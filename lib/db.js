import { createClient } from '@supabase/supabase-js'

// Klucze pobierane wyłącznie ze zmiennych środowiskowych Vercela (używamy bezpiecznego klucza anon)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});
