import { supabase, supabaseUrl } from '@/integrations/supabase/client';

export { supabase };

export function getEdgeUrl(path: string) {
  const base = supabaseUrl?.replace(/\/$/, '');
  return `${base}/functions/v1/${path}`;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}
