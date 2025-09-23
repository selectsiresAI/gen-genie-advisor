import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Beef, BarChart3, Plus, LogOut, Zap, ArrowLeft, TrendingUp, Beaker, MessageSquare, Target, FolderOpen, Calculator } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateFarmModal from './CreateFarmModal';
import BotijaoVirtualPage from './BotijaoVirtual';
import SMSPage from './SMS';
import MetasPage from './Metas';
import PastaArquivosPage from './PastaArquivos';
import PlanoApp from './PlanoApp';
import NexusApp from './NexusApp';
import ChartsPage from './ChartsPage';
import HerdPage from './HerdPage';
import BullSearchPage from './BullSearchPage';
import FemaleUploadModal from './FemaleUploadModal';
import SegmentationPage from './SegmentationPage';
import { usePlanStore } from '@/hooks/usePlanStore';

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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'farm' | 'herd' | 'segmentation' | 'bulls' | 'nexus' | 'charts' | 'botijao' | 'sms' | 'metas' | 'plano' | 'arquivos'>('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else {
        setUserProfile(profile);
      }

      // Load farms
      const { data: farmsData, error: farmsError } = await supabase.rpc('my_farms');
      
      if (farmsError) {
        console.error('Error loading farms:', farmsError);
        toast({
          title: "Erro ao carregar fazendas",
          description: farmsError.message,
          variant: "destructive",
        });
      } else {
        setFarms(farmsData || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || 'Erro inesperado',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleCreateFarm = () => {
    setShowCreateModal(true);
  };

  const handleCreateFarmSuccess = () => {
    loadUserData();
  };

  const handleFarmSelect = (farm: Farm) => {
    setSelectedFarm(farm);
    setCurrentView('farm');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedFarm(null);
  };

  const handleQuickAction = (action: string) => {
    if (farms.length > 0) {
      const defaultFarm = farms.find(f => f.is_default) || farms[0];
      setSelectedFarm(defaultFarm);
      setCurrentView(action as any);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Render farm view
  if (currentView === 'farm' && selectedFarm) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-semibold">{selectedFarm.farm_name}</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('herd')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-primary" />
                  Rebanho
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>{selectedFarm.total_females} fêmeas cadastradas</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUploadModal(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Importar
                  </Button>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('segmentation')}>
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

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('bulls')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Beef className="w-5 h-5 text-primary" />
                  Busca de Touros
                </CardTitle>
                <CardDescription>
                  {selectedFarm.selected_bulls} touros selecionados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('nexus')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-primary" />
                  Nexus
                </CardTitle>
                <CardDescription>
                  Predições genéticas e acasalamentos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('charts')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Gráficos
                </CardTitle>
                <CardDescription>
                  Análises e estatísticas do rebanho
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('botijao')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Beaker className="w-5 h-5 text-primary" />
                  Botijão Virtual
                </CardTitle>
                <CardDescription>
                  Gerenciamento de doses de sêmen
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('metas')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-primary" />
                  Metas
                </CardTitle>
                <CardDescription>
                  Definir objetivos genéticos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('sms')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  SMS
                </CardTitle>
                <CardDescription>
                  Comunicação e notificações
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('arquivos')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Arquivos
                </CardTitle>
                <CardDescription>
                  Gerenciamento de documentos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('plano')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="w-5 h-5 text-primary" />
                  Plano Genético
                </CardTitle>
                <CardDescription>
                  Projeções e calculadora de reposição
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render specific views
  if (currentView !== 'dashboard' && currentView !== 'farm') {
    // Transform selectedFarm into the format expected by the components
    const farmData = selectedFarm ? {
      id: selectedFarm.farm_id,
      nome: selectedFarm.farm_name,
      proprietario: selectedFarm.owner_name,
      females: [], // Initialize with empty array
      bulls: [], // Initialize with empty array
    } : null;

    // Handle views that need special rendering
    if (currentView === 'nexus') {
      return (
        <div className="min-h-screen bg-background">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-xl font-semibold">Nexus - Sistema de Predição Genética</h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <NexusApp />
          </div>
        </div>
      );
    }

    if (currentView === 'plano') {
      return (
        <div className="min-h-screen bg-background">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-xl font-semibold">Plano Genético</h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <PlanoApp onBack={handleBackToDashboard} />
          </div>
        </div>
      );
    }

    // For components that need farm data
    if (farmData) {
      if (currentView === 'herd') {
        const handleNavigateToCharts = () => {
          setCurrentView('charts');
        };
        
        return (
          <div className="min-h-screen bg-background">
            <HerdPage 
              farm={selectedFarm!} 
              onBack={handleBackToDashboard}
              onNavigateToCharts={handleNavigateToCharts}
              onGoToBotijao={() => setCurrentView('botijao')}
            />
          </div>
        );
      }

      if (currentView === 'segmentation') {
        // Convert farm format and prepare data for SegmentationPage
        const farmForSegmentation = {
          id: selectedFarm!.farm_id,
          farm_id: selectedFarm!.farm_id,
          name: selectedFarm!.farm_name,
          owner_name: selectedFarm!.owner_name || ''
        };

        // Basic weights for segmentation
        const weights = {
          TPI: 1,
          ["NM$"]: 1,
          Milk: 1,
          Fat: 1,
          Protein: 1,
          SCS: 1,
          PTAT: 1
        };

        // Load females data from multiple sources
        if (typeof window !== 'undefined') {
          // Try from ToolSS window object
          const toolSSData = (window as any).ToolSS?.fazendas?.find((f: any) => f.id === selectedFarm!.farm_id);
          if (toolSSData?.females?.length > 0) {
            // farmForSegmentation.females = toolSSData.females;
          } else {
            // Try from Rebanho window object
            const rebanhoData = (window as any).Rebanho?.find((f: any) => f.id === selectedFarm!.farm_id);
            if (rebanhoData?.females?.length > 0) {
              // farmForSegmentation.females = rebanhoData.females;
            } else {
              // Try from localStorage
              const storedFemales = localStorage.getItem(`females-${selectedFarm!.farm_id}`);
              if (storedFemales) {
                try {
                  // farmForSegmentation.females = JSON.parse(storedFemales);
                } catch (e) {
                  console.warn('Could not parse stored females data');
                }
              } else {
                // No data found - using database instead
              }
            }
          }
        }

        return (
          <div className="min-h-screen bg-background">
            <SegmentationPage 
              farm={farmForSegmentation} 
              onBack={handleBackToDashboard} 
            />
          </div>
        );
      }

      if (currentView === 'botijao') {
        // Get selected bulls from localStorage if coming from bull search
        const storedBulls = localStorage.getItem(`selected-bulls-${selectedFarm.farm_id}`);
        const selectedBulls = storedBulls ? JSON.parse(storedBulls) : [];
        
        // Get selected females from localStorage if coming from herd page
        const storedFemales = localStorage.getItem(`selected-females-${selectedFarm.farm_id}`);
        const selectedFemales = storedFemales ? JSON.parse(storedFemales) : [];
        
        return (
          <div className="min-h-screen bg-background">
            <div className="border-b">
              <div className="flex h-16 items-center px-4">
                <Button variant="ghost" onClick={() => {
                  // Clear selected bulls and females when going back
                  localStorage.removeItem(`selected-bulls-${selectedFarm.farm_id}`);
                  localStorage.removeItem(`selected-females-${selectedFarm.farm_id}`);
                  handleBackToDashboard();
                }} className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <h1 className="text-xl font-semibold">{selectedFarm?.farm_name} - Botijão Virtual</h1>
              </div>
            </div>
            <div className="container mx-auto px-4 py-8">
              <BotijaoVirtualPage 
                client={{ id: 1, nome: selectedFarm?.owner_name || '', farms: [] }}
                farm={farmData}
                bulls={[]} // Bulls will be loaded from Supabase in BotijaoVirtual
                selectedBulls={selectedBulls}
                selectedFemales={selectedFemales}
                onBack={() => {
                  localStorage.removeItem(`selected-bulls-${selectedFarm.farm_id}`);
                  localStorage.removeItem(`selected-females-${selectedFarm.farm_id}`);
                  handleBackToDashboard();
                }}
              />
            </div>
          </div>
        );
      }

      if (currentView === 'sms') {
        return (
          <div className="min-h-screen bg-background">
            <div className="border-b">
              <div className="flex h-16 items-center px-4">
                <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <h1 className="text-xl font-semibold">{selectedFarm?.farm_name} - SMS</h1>
              </div>
            </div>
            <div className="container mx-auto px-4 py-8">
              <SMSPage farm={farmData} onBack={handleBackToDashboard} />
            </div>
          </div>
        );
      }

      if (currentView === 'metas') {
        return (
          <div className="min-h-screen bg-background">
            <div className="border-b">
              <div className="flex h-16 items-center px-4">
                <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <h1 className="text-xl font-semibold">{selectedFarm?.farm_name} - Metas</h1>
              </div>
            </div>
            <div className="container mx-auto px-4 py-8">
              <MetasPage farm={farmData} onBack={handleBackToDashboard} />
            </div>
          </div>
        );
      }

      if (currentView === 'charts') {
        const handleNavigateToHerd = () => {
          setCurrentView('herd');
        };
        
        return (
          <div className="min-h-screen bg-background">
            <ChartsPage 
              farm={selectedFarm!} 
              onBack={handleBackToDashboard}
              onNavigateToHerd={handleNavigateToHerd}
            />
          </div>
        );
      }

      if (currentView === 'bulls') {
        return (
          <div className="min-h-screen bg-background">
            <BullSearchPage 
              farm={selectedFarm} 
              onBack={handleBackToDashboard}
              onBullsSelected={(selectedBulls) => {
                // Navigate to Botijão Virtual with selected bulls
                setCurrentView('botijao');
                // Store selected bulls for BotijaoVirtual
                localStorage.setItem(`selected-bulls-${selectedFarm.farm_id}`, JSON.stringify(selectedBulls));
              }}
              onGoToBotijao={() => setCurrentView('botijao')}
            />
          </div>
        );
      }

      if (currentView === 'arquivos') {
        return (
          <div className="min-h-screen bg-background">
            <div className="border-b">
              <div className="flex h-16 items-center px-4">
                <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <h1 className="text-xl font-semibold">{selectedFarm?.farm_name} - Pasta de Arquivos</h1>
              </div>
            </div>
            <div className="container mx-auto px-4 py-8">
              <PastaArquivosPage onBack={handleBackToDashboard} />
            </div>
          </div>
        );
      }
    }

    // Default view for other modules
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-xl font-semibold">
              {selectedFarm?.farm_name} - {
                currentView === 'herd' ? 'Rebanho' :
                currentView === 'segmentation' ? 'Segmentação' :
                currentView === 'bulls' ? 'Catálogo de Touros' :
                currentView === 'charts' ? 'Gráficos' : 'Módulo'
              }
            </h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              {currentView === 'herd' && <Users className="w-8 h-8 text-muted-foreground" />}
              {currentView === 'segmentation' && <BarChart3 className="w-8 h-8 text-muted-foreground" />}
              {currentView === 'bulls' && <Beef className="w-8 h-8 text-muted-foreground" />}
              {currentView === 'charts' && <TrendingUp className="w-8 h-8 text-muted-foreground" />}
            </div>
            <h2 className="text-2xl font-bold">Módulo em Desenvolvimento</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Este módulo estará disponível em breve. Você poderá {
                currentView === 'herd' ? 'gerenciar seu rebanho e cadastrar fêmeas' :
                currentView === 'segmentation' ? 'segmentar animais por performance genética' :
                currentView === 'bulls' ? 'explorar o catálogo de touros e fazer seleções' :
                currentView === 'charts' ? 'visualizar gráficos e estatísticas do rebanho' : 'usar esta funcionalidade'
              }.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">ToolSS</h1>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarFallback>
                  {getUserInitials(userProfile?.full_name || user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{userProfile?.full_name || user.email}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Bem-vindo, {userProfile?.full_name?.split(' ')[0] || 'Usuário'}!
            </h2>
            <p className="text-muted-foreground">
              Gerencie suas fazendas, rebanhos e análises genéticas em um só lugar.
            </p>
          </div>

          {/* Farms Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Suas Fazendas</h3>
              <Button onClick={handleCreateFarm}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Fazenda
              </Button>
            </div>
            
            {farms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma fazenda encontrada</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comece criando sua primeira fazenda para gerenciar seu rebanho.
                  </p>
                  <Button onClick={handleCreateFarm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Fazenda
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {farms.map((farm) => (
                  <Card 
                    key={farm.farm_id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleFarmSelect(farm)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
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
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('herd')}>
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

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('nexus')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="w-5 h-5 text-primary" />
                    Nexus
                  </CardTitle>
                  <CardDescription>
                    Predições genéticas e acasalamentos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('botijao')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Beaker className="w-5 h-5 text-primary" />
                    Botijão Virtual
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de doses de sêmen
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('metas')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-5 h-5 text-primary" />
                    Metas
                  </CardTitle>
                  <CardDescription>
                    Definir objetivos genéticos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('plano')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="w-5 h-5 text-primary" />
                    Plano Genético
                  </CardTitle>
                  <CardDescription>
                    Calcular índices e projeções
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('charts')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Gráficos
                  </CardTitle>
                  <CardDescription>
                    Análises e estatísticas
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('sms')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    SMS
                  </CardTitle>
                  <CardDescription>
                    Comunicação e notificações
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleQuickAction('arquivos')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Arquivos
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de documentos
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t">
            <div className="text-center text-sm text-muted-foreground">
              <p>ToolSS - Sistema de Seleção de Touros</p>
              <p>Desenvolvido para otimizar a genética do seu rebanho</p>
            </div>
          </div>
        </div>
      </div>

      <CreateFarmModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateFarmSuccess}
      />

      {/* Upload Modal */}
      {selectedFarm && (
        <FemaleUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          farmId={selectedFarm.farm_id}
          farmName={selectedFarm.farm_name}
        />
      )}
    </div>
  );
};

export default MainDashboard;