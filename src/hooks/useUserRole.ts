import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "./useHasRole";

export type UserRole = "admin" | "moderator" | "user" | null;

const FALLBACK_TABLE = "user_roles";

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAdminRole = useHasRole("admin", { autoFetch: false });
  const hasModeratorRole = useHasRole("moderator", { autoFetch: false });

  const fetchRoleFromTable = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(FALLBACK_TABLE)
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data?.role ?? "user") as UserRole;
    } catch (tableError: any) {
      console.warn("Não foi possível carregar role via tabela de fallback", tableError);
      return "user" as UserRole;
    }
  }, []);

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

      const [adminResult, moderatorResult] = await Promise.all([
        hasAdminRole.refetch(),
        hasModeratorRole.refetch()
      ]);

      if (adminResult) {
        setRole("admin");
        return;
      }

      if (moderatorResult) {
        setRole("moderator");
        return;
      }

      const fallbackRole = await fetchRoleFromTable(user.id);
      setRole(fallbackRole ?? "user");
    } catch (err: any) {
      console.error("Erro ao verificar role do usuário", err);
      setError(err?.message ?? "Não foi possível verificar permissões");
      setRole("user");
    } finally {
      setIsLoading(false);
    }
  }, [fetchRoleFromTable, hasAdminRole, hasModeratorRole]);

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
