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
        const url = new URL(req.url);
        const trainerId = url.searchParams.get('trainerId');
        const startDateStr = url.searchParams.get('startDate');
        const endDateStr = url.searchParams.get('endDate');
        const singleDateStr = url.searchParams.get('date');

        if (!trainerId) {
            return new Response(JSON.stringify({ error: 'Missing trainerId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Simplistic date extraction for demo purposes, you can enhance timezone handling here
        const start = startDateStr || singleDateStr;
        const end = endDateStr || singleDateStr;

        if (!start) {
            return new Response(JSON.stringify({ error: 'Missing date parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Fetch sessions
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('date, duration_minutes')
            .eq('trainer_id', trainerId)
            .gte('date', `${start}T00:00:00.000Z`)
            .lte('date', `${end}T23:59:59.999Z`);

        if (error) throw error;

        const SLOT_MINUTES = 30;
        const takenSet = new Set<string>();

        for (const ses of sessions || []) {
            const d = new Date(ses.date);
            const mins = d.getUTCMinutes();
            const roundedMins = mins < 30 ? 0 : 30;
            d.setUTCMinutes(roundedMins, 0, 0);

            const duration = ses.duration_minutes ?? 60;
            const numSlots = Math.max(1, Math.ceil(duration / SLOT_MINUTES));
            for (let i = 0; i < numSlots; i++) {
                const slotStart = new Date(d);
                slotStart.setUTCMinutes(slotStart.getUTCMinutes() + i * SLOT_MINUTES, 0, 0);
                takenSet.add(slotStart.toISOString());
            }
        }

        return new Response(JSON.stringify({ taken: Array.from(takenSet) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
