const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('⚠️ Supabase not configured. Admin features will be limited.');
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

module.exports = { getSupabaseClient };


