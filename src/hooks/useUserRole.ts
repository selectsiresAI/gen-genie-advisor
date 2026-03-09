import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "moderator" | "user" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUserRole = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      // Verificar admin usando RPC SECURITY DEFINER
      const { data: isAdmin, error: adminError } = await supabase
        .rpc("has_role_v2", { _user_id: user.id, _role: "admin" });

      if (adminError) {
        console.error("Erro ao buscar role:", adminError);
        throw adminError;
      }

      if (isAdmin) {
        setRole("admin");
        return;
      }

      // Verificar moderator
      const { data: isModerator } = await supabase
        .rpc("has_role_v2", { _user_id: user.id, _role: "moderator" });

      if (isModerator) {
        setRole("moderator");
        return;
      }

      // Default para user
      setRole("user");
    } catch (err: any) {
      console.error("Erro ao verificar role do usuário", err);
      setError(err?.message ?? "Não foi possível verificar permissões");
      setRole("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  return useMemo(
    () => ({
      role,
      isAdmin: role === "admin",
      isModerator: role === "moderator",
      isLoading,
      refetch: checkUserRole,
      error
    }),
    [checkUserRole, error, isLoading, role]
  );
}
