import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ActivitySession {
  sessionId: string | null;
  startTime: number;
  pagesVisited: Set<string>;
  featuresUsed: Set<string>;
}

export const useActivityTracker = (user: User | null) => {
  // Safely handle location - may not be available if not in Router context
  let location;
  try {
    location = useLocation();
  } catch {
    location = null;
  }
  const sessionRef = useRef<ActivitySession>({
    sessionId: null,
    startTime: Date.now(),
    pagesVisited: new Set(),
    featuresUsed: new Set(),
  });

  // Iniciar sessão
  useEffect(() => {
    if (!user) return;

    const startSession = async () => {
      try {
        const { data, error } = await supabase
          .from('user_activity_tracking')
          .insert({
            user_id: user.id,
            session_start: new Date().toISOString(),
          })
          .select()
          .single();

        if (data && !error) {
          sessionRef.current.sessionId = data.id;
        }
      } catch (error) {
        // Falha silenciosa - não quebrar o app
        console.debug('Activity tracking initialization failed:', error);
      }
    };

    startSession();
  }, [user]);

  // Rastrear mudanças de página
  useEffect(() => {
    if (!user || !sessionRef.current.sessionId || !location) return;

    const currentPath = location.pathname;
    sessionRef.current.pagesVisited.add(currentPath);

    // Atualizar no banco
    const updateSession = async () => {
      try {
        await supabase
          .from('user_activity_tracking')
          .update({
            pages_visited: Array.from(sessionRef.current.pagesVisited),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionRef.current.sessionId);
      } catch (error) {
        // Falha silenciosa
        console.debug('Activity tracking update failed:', error);
      }
    };

    updateSession();
  }, [location?.pathname, user]);

  // Finalizar sessão ao sair
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = async () => {
      if (!sessionRef.current.sessionId) return;

      const sessionTime = Math.floor((Date.now() - sessionRef.current.startTime) / 1000);

      try {
        await supabase
          .from('user_activity_tracking')
          .update({
            session_end: new Date().toISOString(),
            total_session_time_seconds: sessionTime,
            pages_visited: Array.from(sessionRef.current.pagesVisited),
            features_used: Array.from(sessionRef.current.featuresUsed),
          })
          .eq('id', sessionRef.current.sessionId);
      } catch (error) {
        // Falha silenciosa
        console.debug('Activity tracking session end failed:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Também executar no unmount
    };
  }, [user]);

  // Função para registrar uso de funcionalidade
  const trackFeature = async (featureName: string) => {
    if (!sessionRef.current.sessionId) return;

    sessionRef.current.featuresUsed.add(featureName);

    try {
      await supabase
        .from('user_activity_tracking')
        .update({
          features_used: Array.from(sessionRef.current.featuresUsed),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionRef.current.sessionId);
    } catch (error) {
      // Falha silenciosa
      console.debug('Activity tracking feature update failed:', error);
    }
  };

  return { trackFeature };
};
