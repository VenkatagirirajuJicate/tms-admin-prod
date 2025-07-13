import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Type definitions would be generated from your Supabase schema
type Database = Record<string, unknown>;

// Create Supabase client for admin operations
function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(`Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment.`);
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Export the client creation function
export { createClient };

// Export admin client (same as createClient for admin operations)
export const supabase = createClient();

// Export admin client with explicit name for clarity
export const supabaseAdmin = createClient(); 