import { createClient } from '@supabase/supabase-js';

// Note: This uses the SERVICE_ROLE_KEY, not the Anon key.
// You need to get this from Supabase Dashboard > Project Settings > API
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);