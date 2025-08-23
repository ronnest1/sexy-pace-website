import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Only create the client in the browser to avoid build-time errors during SSG
const isBrowser = typeof window !== 'undefined';

let client: SupabaseClient | null = null;
export const supabase: SupabaseClient = ((): any => {
  if (!isBrowser) return null;
  if (client) return client;
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
  }
  client = createClient(url, key);
  return client;
})();
