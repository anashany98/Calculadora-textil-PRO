import { createClient } from '@supabase/supabase-js';

// Credenciales proporcionadas por el usuario
const SUPABASE_URL = "https://xjhwirxfrsdkhifdoohk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaHdpcnhmcnNka2hpZmRvb2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjY1MDgsImV4cCI6MjA3OTIwMjUwOH0.yeUMjfKlTbydBm4sAMk3P_wRdMogfGr_Zx4F1e1jp-c";

export const isSupabaseConfigured = () => {
  return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
};

// Inicializamos el cliente directamente con las credenciales proporcionadas
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);