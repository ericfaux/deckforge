import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hvulzgcqdwurrhaebhyy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY is required');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client with anon key for user-level operations
export function createSupabaseClient(authToken?: string) {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || supabaseServiceKey;
  const client = createClient(supabaseUrl, anonKey);
  
  if (authToken) {
    // Set the auth token for this client
    client.auth.setSession({
      access_token: authToken,
      refresh_token: '',
    });
  }
  
  return client;
}
