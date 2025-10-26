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
      console.log('🔄 Verificando role para:', user?.id);
      
      if (!user) {
        console.log('❌ Nenhum usuário autenticado');
        setRole(null);
        setIsLoading(false);
        return;
      }

      // ✅ BUSCAR ROLE DIRETAMENTE (sem teste que viola RLS)
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📋 Resultado da consulta:', { userRole, error, userId: user.id });

      if (error) {
        console.error('❌ Erro ao buscar role:', error);
        setRole('user'); // Default em caso de erro
        setIsLoading(false);
        return;
      }

      if (!userRole) {
        console.log('👤 Usuário sem role específica, usando padrão: user');
        setRole('user');
        setIsLoading(false);
        return;
      }

      console.log(`✅ Role identificada: ${userRole.role}`);
      setRole(userRole.role as UserRole);
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setRole('user');
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
