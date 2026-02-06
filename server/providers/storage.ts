import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!supabaseUrl || !supabaseSecretKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env');
    }
    if (!client) {
        client = createClient(supabaseUrl, supabaseSecretKey);
    }
    return client;
}

const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET || 'dev';

/**
 * Upload a photo to Supabase Storage and return its public URL.
 * Paths use forward slashes.
 */
export async function uploadPhoto(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType: string
): Promise<{ publicUrl: string }> {
    const c = getClient();
    const { data, error } = await c.storage.from(bucket).upload(path, buffer, {
        contentType,
        upsert: true,
    });

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    const pathForUrl = data.path;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathForUrl}`;
    return { publicUrl };
}

/**
 * Delete a file from Supabase Storage by path.
 */
export async function deletePhoto(bucket: string, path: string): Promise<void> {
    const c = getClient();
    const { error } = await c.storage.from(bucket).remove([path]);
    if (error) {
        throw new Error(`Storage delete failed: ${error.message}`);
    }
}

/**
 * List files in a folder within Supabase Storage.
 */
export async function listPhotos(bucket: string, folder: string): Promise<string[]> {
    const c = getClient();
    const { data, error } = await c.storage.from(bucket).list(folder);
    if (error) {
        throw new Error(`Storage list failed: ${error.message}`);
    }
    return (data ?? []).map(file => `${supabaseUrl}/storage/v1/object/public/${bucket}/${folder}/${file.name}`);
}

export { getClient, DEFAULT_BUCKET };
