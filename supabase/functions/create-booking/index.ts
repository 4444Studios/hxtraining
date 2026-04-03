import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { clientName, clientEmail, clientPhoneNumber, date, trainerId, service } = await req.json();

        if (!clientName || !clientEmail || !date || !service || !trainerId) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Initialize Supabase with SERVICE_ROLE key to bypass RLS for client creation and secure backend actions
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Fetch trainer to get service duration
        const { data: trainer, error: trainerError } = await supabaseAdmin
            .from('trainers')
            .select('services')
            .eq('id', trainerId)
            .single();

        if (trainerError || !trainer) throw trainerError || new Error('Trainer not found');

        const serviceEntry = trainer.services?.find((s: any) => s.name === service);
        const durationMinutes = serviceEntry?.durationMinutes ?? 60;

        // 2. Upsert Client (find or create)
        let clientId;
        const { data: existingClient } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('email', clientEmail)
            .maybeSingle();

        if (existingClient) {
            clientId = existingClient.id;
        } else {
            const { data: newClient, error: clientError } = await supabaseAdmin
                .from('clients')
                .insert({
                    name: clientName,
                    email: clientEmail,
                    phone_number: clientPhoneNumber,
                })
                .select()
                .single();

            if (clientError) throw clientError;
            clientId = newClient.id;
        }

        // 3. Create Session
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .insert({
                trainer_id: trainerId,
                client_id: clientId,
                date,
                service,
                duration_minutes: durationMinutes,
                status: 'confirmed',
                guest_name: clientName,
                guest_email: clientEmail
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // 4. Return success
        return new Response(JSON.stringify(session), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
