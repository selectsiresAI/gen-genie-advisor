import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHasRole } from "@/hooks/useHasRole";
import { supabase } from "@/integrations/supabase/client";

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
    <div className="flex flex-col items-center gap-4 text-muted-foreground">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      <p>Verificando permissões de administrador…</p>
    </div>
  </div>
);

const DefaultFallback = ({ redirectTo }: { redirectTo?: string }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <Card className="max-w-lg">
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Você precisa de permissões administrativas para acessar esta área.</p>
          <p>Se acredita que isto é um erro, entre em contato com o suporte ou com o administrador da sua organização.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default" onClick={() => navigate(redirectTo ?? "/")}>Voltar para o início</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export function AdminGuard({ children, fallback, redirectTo }: AdminGuardProps) {
  const { hasRole, loading, error, refetch } = useHasRole("admin");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      await refetch();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refetch]);

  useEffect(() => {
    if (!loading && !hasRole && !error && redirectTo) {
      navigate(redirectTo);
    }
  }, [error, hasRole, loading, navigate, redirectTo]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-yellow-100/40 p-4">
        <Card className="max-w-lg">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <CardTitle>Não foi possível validar seu acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{error}</p>
            <p>Tente novamente mais tarde ou verifique se a função RPC <code>has_role_v2</code> está com permissões de execução para usuários autenticados.</p>
            <Button variant="default" onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <DefaultFallback redirectTo={redirectTo} />;
  }

  return <>{children}</>;
}

