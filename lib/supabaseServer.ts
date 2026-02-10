import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Get a Supabase admin client for server-side operations.
 * This client bypasses RLS and should ONLY be used in API routes or server actions.
 */
export function getSupabaseAdmin(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        // During build, environment variables might be missing.
        // We log this but don't crash the process unless it's actually called.
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
             console.warn('Supabase Admin client initialized without credentials. This is expected during build.');
        }
        
        // Return a proxy or throw an error only when used
        return new Proxy({} as Record<string, unknown>, {
            get(_, prop) {
                if (!supabaseUrl || !supabaseServiceKey) {
                    throw new Error(`Supabase Admin configuration missing for property "${String(prop)}". Check your environment variables.`);
                }
            }
        }) as unknown as SupabaseClient;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Get a standard Supabase client for server-side operations.
 */
export function getSupabaseServer(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return new Proxy({} as Record<string, unknown>, {
            get(_, prop) {
                if (!supabaseUrl || !supabaseKey) {
                    throw new Error(`Supabase configuration missing for property "${String(prop)}". Check your environment variables.`);
                }
            }
        }) as unknown as SupabaseClient;
    }

    return createClient(supabaseUrl, supabaseKey);
}

