import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only initialize if we have the credentials (prevents build-time errors)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as Record<string, unknown>, {
      get(_, prop) {
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error(`Supabase client configuration missing for property "${String(prop)}". Check your environment variables.`);
        }
      }
    }) as unknown as SupabaseClient; 

