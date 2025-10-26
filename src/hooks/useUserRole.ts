import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        return;
      }

      // Check if user has admin role
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole) {
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
        setRole('moderator');
        return;
      }

      // Default to user role
      setRole('user');
    } catch (error) {
      console.error('Error checking user role:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    role,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    isLoading,
    refetch: checkUserRole
  };
}
