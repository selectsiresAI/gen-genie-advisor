import { supabase } from '@/integrations/supabase/client';

interface EngagementMetrics {
  totalSessionTime: number; // em segundos
  uniquePagesVisited: number;
  uniqueFeaturesUsed: number;
  sessionCount: number;
}

export const calculateEngagementScore = async (userId: string): Promise<number> => {
  // Buscar todas as sessões do usuário
  const { data: sessions, error } = await supabase
    .from('user_activity_tracking')
    .select('*')
    .eq('user_id', userId);

  if (error || !sessions || sessions.length === 0) {
    return 0;
  }

  // Calcular métricas agregadas
  const metrics: EngagementMetrics = {
    totalSessionTime: 0,
    uniquePagesVisited: 0,
    uniqueFeaturesUsed: 0,
    sessionCount: sessions.length,
  };

  const allPages = new Set<string>();
  const allFeatures = new Set<string>();

  sessions.forEach(session => {
    metrics.totalSessionTime += session.total_session_time_seconds || 0;
    
    if (session.pages_visited) {
      session.pages_visited.forEach((page: string) => allPages.add(page));
    }
    
    if (session.features_used) {
      session.features_used.forEach((feature: string) => allFeatures.add(feature));
    }
  });

  metrics.uniquePagesVisited = allPages.size;
  metrics.uniqueFeaturesUsed = allFeatures.size;

  // Calcular score (0-100)
  // Pesos: Tempo (40%), Páginas (30%), Features (20%), Sessões (10%)
  
  // Tempo: 30 minutos = 100%
  const timeScore = Math.min((metrics.totalSessionTime / (30 * 60)) * 100, 100);
  
  // Páginas: 10 páginas únicas = 100%
  const pageScore = Math.min((metrics.uniquePagesVisited / 10) * 100, 100);
  
  // Features: 15 funcionalidades = 100%
  const featureScore = Math.min((metrics.uniqueFeaturesUsed / 15) * 100, 100);
  
  // Sessões: 5 sessões = 100%
  const sessionScore = Math.min((metrics.sessionCount / 5) * 100, 100);

  const finalScore = (
    (timeScore * 0.4) +
    (pageScore * 0.3) +
    (featureScore * 0.2) +
    (sessionScore * 0.1)
  );

  return Math.round(finalScore);
};
