import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Activity, Clock, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserRole } from '@/hooks/useUserRole';

interface UserMetrics {
  user_id: string;
  full_name: string;
  email: string;
  user_since: string;
  total_farms: number;
  total_sessions: number;
  total_time_seconds: number;
  unique_pages_visited: number;
  unique_features_used: number;
  predictions_made: number;
  last_activity: string | null;
  surveys_completed: number;
}

export function UserEngagementMetrics() {
  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (isAdmin) {
      loadMetrics();
    }
  }, [isAdmin]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_engagement_metrics')
        .select('*')
        .order('last_activity', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setMetrics(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar métricas',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEngagementLevel = (metrics: UserMetrics) => {
    const score = 
      (metrics.unique_pages_visited > 0 ? 25 : 0) +
      (metrics.total_farms > 0 ? 25 : 0) +
      (metrics.predictions_made > 0 ? 25 : 0) +
      (metrics.unique_features_used > 3 ? 25 : 0);
    
    if (score >= 75) return { label: 'Alto', variant: 'default' as const };
    if (score >= 50) return { label: 'Médio', variant: 'secondary' as const };
    return { label: 'Baixo', variant: 'outline' as const };
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalUsers = metrics.length;
  const activeUsers = metrics.filter(m => m.total_sessions > 0).length;
  const avgSessions = metrics.reduce((sum, m) => sum + m.total_sessions, 0) / totalUsers || 0;
  const usersWithFarms = metrics.filter(m => m.total_farms > 0).length;
  const usersWithPredictions = metrics.filter(m => m.predictions_made > 0).length;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Sessões</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSessions.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              por usuário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Fazendas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithFarms}</div>
            <p className="text-xs text-muted-foreground">
              {((usersWithFarms / totalUsers) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fizeram Predições</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithPredictions}</div>
            <p className="text-xs text-muted-foreground">
              {((usersWithPredictions / totalUsers) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-center">Engajamento</TableHead>
                  <TableHead className="text-center">Fazendas</TableHead>
                  <TableHead className="text-center">Páginas</TableHead>
                  <TableHead className="text-center">Features</TableHead>
                  <TableHead className="text-center">Predições</TableHead>
                  <TableHead className="text-center">Sessões</TableHead>
                  <TableHead className="text-center">Tempo Total</TableHead>
                  <TableHead>Última Atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => {
                  const engagement = getEngagementLevel(metric);
                  return (
                    <TableRow key={metric.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{metric.full_name || 'Sem nome'}</div>
                          <div className="text-xs text-muted-foreground">{metric.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={engagement.variant}>{engagement.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {metric.total_farms > 0 ? (
                          <Badge variant="default">{metric.total_farms}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{metric.unique_pages_visited}</TableCell>
                      <TableCell className="text-center">{metric.unique_features_used}</TableCell>
                      <TableCell className="text-center">
                        {metric.predictions_made > 0 ? (
                          <Badge variant="secondary">{metric.predictions_made}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{metric.total_sessions}</TableCell>
                      <TableCell className="text-center">
                        {metric.total_time_seconds > 0
                          ? formatTime(metric.total_time_seconds)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {metric.last_activity ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(metric.last_activity), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}