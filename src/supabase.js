import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseApiKey = process.env.REACT_APP_SUPABASE_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseApiKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
});
