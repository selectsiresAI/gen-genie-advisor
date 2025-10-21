import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { auth: { persistSession: true } }
);

export function getEdgeUrl(path: string) {
  const base = supabaseUrl?.replace(/\/$/, '');
  return `${base}/functions/v1/${path}`;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}
