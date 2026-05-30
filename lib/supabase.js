import { createClient } from "@supabase/supabase-js";

// Use the SERVICE_ROLE key — this bypasses RLS and is safe only on the server.
// Never expose this key to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
