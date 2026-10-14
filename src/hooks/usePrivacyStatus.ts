import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { privacyApi } from "@/lib/privacy";

/** Situação do aceite da política e do termo do usuário logado (só consulta quando há sessão). */
export function usePrivacyStatus() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setHasSession(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return useQuery({
    queryKey: ["toolss-privacy-status"],
    queryFn: privacyApi.status,
    enabled: hasSession,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
