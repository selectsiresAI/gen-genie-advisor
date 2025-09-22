import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  Plus, 
  Settings, 
  Building2, 
  Users, 
  BarChart3, 
  Calculator,
  Beef,
  TestTube,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import CreateFarmModal from './CreateFarmModal';

interface MainDashboardProps {
  user: User;
  onLogout: () => void;
}

interface Farm {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  my_role: string;
  is_default: boolean;
  total_females: number;
  selected_bulls: number;
  created_at: string;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ user, onLogout }) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Carregar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Carregar fazendas do usuário
      const { data: farmsData, error } = await supabase
        .rpc('my_farms');

      if (error) {
        throw error;
      }

      setFarms(farmsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || 'Tente recarregar a página',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      onLogout();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateFarm = () => {
    setShowCreateFarm(true);
  };

  const handleCreateFarmSuccess = () => {
    loadUserData(); // Recarregar dados após criar fazenda
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">ToolSS</h1>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">Sistema de Seleção e Segmentação</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {profile?.full_name ? getUserInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{profile?.full_name || user.email}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              {profile?.is_admin && (
                <Badge variant="secondary">Admin</Badge>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Técnico'}!
            </h2>
            <p className="text-muted-foreground">
              Gerencie suas fazendas, fêmeas, touros e análises genéticas
            </p>
          </div>

          {/* Fazendas Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Suas Fazendas</h3>
                <p className="text-sm text-muted-foreground">
                  {farms.length === 0 ? 'Nenhuma fazenda encontrada' : `${farms.length} fazenda(s) disponível(is)`}
                </p>
              </div>
              
              <Button onClick={handleCreateFarm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Fazenda
              </Button>
            </div>

            {farms.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent className="space-y-4">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h4 className="text-lg font-medium">Nenhuma fazenda cadastrada</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie sua primeira fazenda para começar a usar o ToolSS
                    </p>
                  </div>
                  <Button onClick={handleCreateFarm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Fazenda
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {farms.map((farm) => (
                  <Card key={farm.farm_id} className={`cursor-pointer hover:shadow-lg transition-shadow ${farm.is_default ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{farm.farm_name}</CardTitle>
                          <CardDescription>
                            Proprietário: {farm.owner_name}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getRoleBadgeVariant(farm.my_role)}>
                            {getRoleLabel(farm.my_role)}
                          </Badge>
                          {farm.is_default && (
                            <Badge variant="outline">Padrão</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{farm.total_females} fêmeas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Beef className="w-4 h-4 text-muted-foreground" />
                          <span>{farm.selected_bulls} touros</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Acesso Rápido</h3>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-primary" />
                    Rebanho
                  </CardTitle>
                  <CardDescription>
                    Gerenciar fêmeas da fazenda
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Segmentação
                  </CardTitle>
                  <CardDescription>
                    Classificar animais por performance
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Beef className="w-5 h-5 text-primary" />
                    Catálogo de Touros
                  </CardTitle>
                  <CardDescription>
                    Buscar e selecionar touros
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="w-5 h-5 text-primary" />
                    Nexus
                  </CardTitle>
                  <CardDescription>
                    Predições genéticas
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-8 border-t">
            <div className="text-center text-sm text-muted-foreground">
              <p>ToolSS - Sistema desenvolvido para técnicos em melhoramento genético bovino</p>
              <p className="mt-1">Versão 1.0 - Powered by Supabase</p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Farm Modal */}
      <CreateFarmModal
        isOpen={showCreateFarm}
        onClose={() => setShowCreateFarm(false)}
        onSuccess={handleCreateFarmSuccess}
      />
    </div>
  );
};

export default MainDashboard;