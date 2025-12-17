import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

export const supabase = createClient(url, key);

export async function testSupabase() {
  // ejemplo: listar tablas públicas (puedes ajustar a tu esquema)
  const { data, error } = await supabase.from('test_table').select('*').limit(1);
  return { data, error };
}
