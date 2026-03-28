const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

/** Used for auth routes (signUp / signInWithPassword). */
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

/** Used for trusted server-side storage uploads and inserts. Never expose to clients. */
function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = { supabaseAnon, getSupabaseAdmin };
