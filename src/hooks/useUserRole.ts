import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 useUserRole: inicializando...');
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Verificando role para user:', user?.id);
      
      if (!user) {
        console.log('❌ Nenhum usuário autenticado');
        setRole(null);
        return;
      }

      // Primeiro, testar se conseguimos acessar a tabela
      const { data: testData, error: testError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);
      
      console.log('🧪 Teste de acesso à tabela user_roles:', { testData, testError });

      // Check if user has admin role
      const { data: adminRole, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      console.log('🔍 Verificação de admin:', { adminRole, adminError, userId: user.id });

      if (adminRole) {
        console.log('✅ Usuário é ADMIN');
        setRole('admin');
        return;
      }

      // Check if user has moderator role
      const { data: modRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'moderator')
        .maybeSingle();

      if (modRole) {
        console.log('✅ Usuário é MODERATOR');
        setRole('moderator');
        return;
      }

      // Default to user role
      console.log('👤 Usuário tem role padrão: user');
      setRole('user');
    } catch (error) {
      console.error('❌ Erro ao verificar role:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const result = {
    role,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    isLoading,
    refetch: checkUserRole
  };
  
  console.log('📊 useUserRole retornando:', result);
  
  return result;
}
