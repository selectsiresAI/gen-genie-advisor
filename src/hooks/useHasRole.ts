import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseHasRoleOptions {
  /**
   * When true (default), the hook will automatically run the RPC call
   * as soon as the component mounts. Disable to trigger manually with `refetch`.
   */
  autoFetch?: boolean;
  /**
   * Optional Supabase RPC function name. Defaults to `has_role_v2`.
   */
  functionName?: string;
}

interface HasRoleState {
  hasRole: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<boolean>;
}

const DEFAULT_FUNCTION = "has_role_v2";

type RpcReturn = boolean | number | { [key: string]: any } | null;

const normalizeRpcResult = (value: RpcReturn): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (value && typeof value === "object") {
    if (typeof value.has_role === "boolean") {
      return value.has_role;
    }

    if (typeof value.is_admin === "boolean") {
      return value.is_admin;
    }

    if (typeof value.role === "string") {
      return value.role.length > 0;
    }

    if (typeof value.result === "boolean") {
      return value.result;
    }
  }

  return Boolean(value);
};

export function useHasRole(role: string, options: UseHasRoleOptions = {}): HasRoleState {
  const { autoFetch = true, functionName = DEFAULT_FUNCTION } = options;
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setHasRole(false);
        return false;
      }

      const { data, error } = await supabase.rpc(functionName, {
        _user_id: user.id,
        _role: role
      });

      if (error) {
        throw error;
      }

      const normalized = Array.isArray(data) ? data[0] : data;
      const result = normalizeRpcResult(normalized as RpcReturn);
      setHasRole(result);
      return result;
    } catch (err: any) {
      console.error(`Erro ao verificar role "${role}" via RPC ${functionName}:`, err);
      setError(err?.message ?? "Não foi possível verificar permissões");
      setHasRole(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [functionName, role]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return useMemo(
    () => ({
      hasRole,
      loading,
      error,
      refetch
    }),
    [error, hasRole, loading, refetch]
  );
}

