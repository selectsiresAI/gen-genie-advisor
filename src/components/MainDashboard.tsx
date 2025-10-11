import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Users, Beef, BarChart3, Plus, LogOut, Zap, ArrowLeft, ArrowLeftRight, TrendingUp, Beaker, MessageSquare, Target, FolderOpen, Calculator, Trash2 } from "lucide-react";
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
import { useHerdStore } from '@/hooks/useHerdStore';
import ConversaoPage from '@/pages/tools/conversao';
import AuditoriaGeneticaPage from '@/pages/AuditoriaGeneticaPage';

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

type SupabaseFarm = Omit<Farm, 'total_females'> & {
  total_females: number | null;
};

type DashboardView = 'dashboard' | 'farm' | 'herd' | 'segmentation' | 'bulls' | 'nexus' | 'charts' | 'auditoria' | 'botijao' | 'sms' | 'metas' | 'plano' | 'arquivos' | 'conversao';

type ModuleView = Exclude<DashboardView, 'dashboard' | 'farm'>;
const MainDashboard: React.FC<MainDashboardProps> = ({
  user,
  onLogout
}) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [totalFarms, setTotalFarms] = useState(0);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [totalBulls, setTotalBulls] = useState(0);
  const { toast } = useToast();
  const { setSelectedHerdId, refreshFromSupabase } = useHerdStore();
  useEffect(() => {
    loadUserData();
  }, []);
  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Load user profile
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else {
        setUserProfile(profile);
      }

      // Load farms
      const {
        data: farmsData,
        error: farmsError
      } = await supabase.rpc('my_farms');
      if (farmsError) {
        console.error('Error loading farms:', farmsError);
        toast({
          title: "Erro ao carregar fazendas",
          description: farmsError.message,
          variant: "destructive"
        });
      } else {
        const rawFarms = (farmsData as SupabaseFarm[]) ?? [];
        const normalizedFarms: Farm[] = rawFarms.map(farm => {
          const normalizedCount = Number(farm.total_females ?? 0);
          return {
            ...farm,
            total_females: Number.isFinite(normalizedCount) ? normalizedCount : 0
          };
        });

        setFarms(normalizedFarms);

        // Calcular totais
        setTotalFarms(normalizedFarms.length);
        const totalFemales = normalizedFarms.reduce((sum, farm) => sum + farm.total_females, 0);
        setTotalAnimals(totalFemales);
      }

      // Load total bulls count from database
      const {
        count: bullsCount,
        error: bullsError
      } = await supabase.from('bulls').select('*', {
        count: 'exact',
        head: true
      });
      if (!bullsError) {
        setTotalBulls(bullsCount || 0);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || 'Erro inesperado',
        variant: "destructive"
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
  const handleDeleteFarm = async (farmId: string, farmName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que o click do delete abra a fazenda

    const isConfirmed = confirm(`Tem certeza que deseja apagar a fazenda "${farmName}"? Esta ação não pode ser desfeita.`);
    if (!isConfirmed) {
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.rpc('delete_farm', {
        farm_uuid: farmId
      });
      if (error) {
        throw error;
      }
      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast({
            title: "Fazenda apagada com sucesso!",
            description: `${farmName} foi removida do seu portfólio`
          });

          // Recarregar a lista de fazendas
          loadUserData();
        } else {
          toast({
            title: "Erro ao apagar fazenda",
            description: result.message || 'Erro desconhecido',
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao apagar fazenda:', error);
      toast({
        title: "Erro ao apagar fazenda",
        description: error.message || 'Tente novamente',
        variant: "destructive"
      });
    }
  };
  const handleFarmSelect = async (farm: Farm) => {
    setSelectedFarm(farm);
    setCurrentView('farm');
    
    // Automatically load herd data when entering farm
    setSelectedHerdId(farm.farm_id);
    await refreshFromSupabase(farm.farm_id);
    
    console.log('🏠 Entrando na fazenda e carregando rebanho automaticamente:', farm.farm_name);
  };
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedFarm(null);
  };
  const moduleSections: Array<{
    title: string;
    items: Array<{ title: string; description: string; view: ModuleView }>;
  }> = [
    {
      title: 'Bancos de Dados',
      items: [
        {
          title: 'Rebanho',
          description: 'Banco de fêmeas — consultas, filtros e importação',
          view: 'herd'
        },
        {
          title: 'Busca de Touros',
          description: 'Base global — pesquisa e comparação',
          view: 'bulls'
        },
        {
          title: 'Botijão Virtual',
          description: 'Touros da fazenda — estoque e lotes',
          view: 'botijao'
        }
      ]
    },
    {
      title: 'Análises e Estratégia',
      items: [
        {
          title: 'Segmentação',
          description: 'Monte índices e classifique o rebanho',
          view: 'segmentation'
        },
        {
          title: 'Auditoria Genética',
          description: 'Desempenho por lotes, quartis e tendências',
          view: 'auditoria'
        },
        {
          title: 'Nexus',
          description: 'Predições e acasalamentos otimizados',
          view: 'nexus'
        }
      ]
    },
    {
      title: 'Planejamento e Direcionamento',
      items: [
        {
          title: 'Metas',
          description: 'Defina objetivos de genética e produção',
          view: 'metas'
        },
        {
          title: 'Plano Genético',
          description: 'Projeções e cálculo de reposição',
          view: 'plano'
        }
      ]
    },
    {
      title: 'Operações e Suporte',
      items: [
        {
          title: 'Arquivos',
          description: 'Gerenciamento de documentos e anexos',
          view: 'arquivos'
        },
        {
          title: 'Conversão (preview)',
          description: 'Padronize planilhas e cabeçalhos',
          view: 'conversao'
        }
      ]
    }
  ];

  const handleFarmModuleClick = (view: ModuleView) => {
    setCurrentView(view);
  };
  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
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
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>;
  }

  // Render farm view
  if (currentView === 'farm' && selectedFarm) {
    return <main className="min-h-screen bg-[#FAFAFA]">
        <div className="border-b bg-white">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" onClick={handleBackToDashboard} className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar ao painel de fazendas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fazenda selecionada</p>
              <h1 className="text-xl font-semibold text-neutral-900">{selectedFarm.farm_name}</h1>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Fêmeas cadastradas</CardTitle>
                <CardDescription>Animais ativos no rebanho</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-neutral-900">{(selectedFarm.total_females ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Touros selecionados</CardTitle>
                <CardDescription>Favoritos prontos para uso</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-neutral-900">{selectedFarm.selected_bulls ?? 0}</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Total de touros na base</CardTitle>
                <CardDescription>Catálogo disponível para consulta</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-neutral-900">{totalBulls.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">Proprietário</CardTitle>
                <CardDescription>Gestor da fazenda</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-neutral-900">{selectedFarm.owner_name}</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-3xl border bg-white/70 p-6 shadow-sm md:p-10">
            <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-black tracking-tight">Painel Principal</h2>
                <p className="mt-1 text-sm text-neutral-600">Selecione um módulo do ecossistema ToolSS para continuar.</p>
              </div>
              <p className="text-base italic text-neutral-600">Ecossistema ToolSS</p>
            </header>

            <div className="space-y-10">
              {moduleSections.map(section => (
                <section key={section.title}>
                  <h3 className="mb-6 border-b-2 border-[#E00000] pb-1 text-2xl font-bold text-[#E00000]">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {section.items.map(item => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleFarmModuleClick(item.view)}
                        className="group rounded-xl border bg-white p-6 text-left shadow-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000] focus-visible:ring-offset-2 hover:shadow-lg"
                      >
                        <div className="mb-2 flex items-center">
                          <div className="mr-3 h-3 w-3 rounded-full bg-[#E00000]"></div>
                          <h4 className="text-lg font-semibold text-black">{item.title}</h4>
                        </div>
                        <p className="text-sm text-[#555555]">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>;
  }

  // Render specific views
  if (currentView !== 'dashboard' && currentView !== 'farm') {
    // Transform selectedFarm into the format expected by the components
    const farmData = selectedFarm ? {
      id: selectedFarm.farm_id,
      nome: selectedFarm.farm_name,
      proprietario: selectedFarm.owner_name,
      females: [],
      // Initialize with empty array
      bulls: [] // Initialize with empty array
    } : null;

    // Handle views that need special rendering
    if (currentView === 'conversao') {
      return <div className="min-h-screen bg-background">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-xl font-semibold">Conversão de planilhas (preview)</h1>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <ConversaoPage />
          </div>
        </div>;
    }
    if (currentView === 'nexus') {
      return <div className="min-h-screen bg-background">
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
        </div>;
    }
    if (currentView === 'plano') {
      return <div className="min-h-screen bg-background">
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
        </div>;
    }

    // For components that need farm data
    if (farmData) {
      if (currentView === 'herd') {
        const handleNavigateToCharts = () => {
          setCurrentView('charts');
        };
        return <div className="min-h-screen bg-background">
            <HerdPage farm={selectedFarm!} onBack={handleBackToDashboard} onNavigateToCharts={handleNavigateToCharts} />
          </div>;
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
        return <div className="min-h-screen bg-background">
            <SegmentationPage farm={farmForSegmentation} onBack={handleBackToDashboard} />
          </div>;
      }
      if (currentView === 'botijao') {
        // Get selected bulls from localStorage if coming from bull search
        const storedBulls = localStorage.getItem(`selected-bulls-${selectedFarm.farm_id}`);
        const selectedBulls = storedBulls ? JSON.parse(storedBulls) : [];

        // Get selected females from localStorage if coming from herd page
        const storedFemales = localStorage.getItem(`selected-females-${selectedFarm.farm_id}`);
        const selectedFemales = storedFemales ? JSON.parse(storedFemales) : [];
        return <div className="min-h-screen bg-background">
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
              <BotijaoVirtualPage client={{
              id: 1,
              nome: selectedFarm?.owner_name || '',
              farms: []
            }} farm={farmData} bulls={[]} // Bulls will be loaded from Supabase in BotijaoVirtual
            selectedBulls={selectedBulls} selectedFemales={selectedFemales} onBack={() => {
              localStorage.removeItem(`selected-bulls-${selectedFarm.farm_id}`);
              localStorage.removeItem(`selected-females-${selectedFarm.farm_id}`);
              handleBackToDashboard();
            }} />
            </div>
          </div>;
      }
      if (currentView === 'sms') {
        return <div className="min-h-screen bg-background">
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
          </div>;
      }
      if (currentView === 'metas') {
        return <div className="min-h-screen bg-background">
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
          </div>;
      }
      if (currentView === 'charts') {
        const handleNavigateToHerd = () => {
          setCurrentView('herd');
        };
        return <div className="min-h-screen bg-background">
            <ChartsPage farm={selectedFarm!} onBack={handleBackToDashboard} onNavigateToHerd={handleNavigateToHerd} />
          </div>;
      }
      if (currentView === 'auditoria') {
        return <div className="min-h-screen bg-background">
            <AuditoriaGeneticaPage farm={selectedFarm} onBack={handleBackToDashboard} />
          </div>;
      }
      if (currentView === 'bulls') {
        return <div className="min-h-screen bg-background">
            <BullSearchPage farm={selectedFarm} onBack={handleBackToDashboard} onBullsSelected={selectedBulls => {
            // Navigate to Botijão Virtual with selected bulls
            setCurrentView('botijao');
            // Store selected bulls for BotijaoVirtual
            localStorage.setItem(`selected-bulls-${selectedFarm.farm_id}`, JSON.stringify(selectedBulls));
          }} onGoToBotijao={() => setCurrentView('botijao')} />
          </div>;
      }
      if (currentView === 'arquivos') {
        return <div className="min-h-screen bg-background">
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
          </div>;
      }
    }

    // Default view for other modules
    return <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-xl font-semibold">
              {selectedFarm?.farm_name} - {currentView === 'herd' ? 'Rebanho' : currentView === 'segmentation' ? 'Segmentação' : currentView === 'bulls' ? 'Catálogo de Touros' : currentView === 'charts' ? 'Gráficos' : currentView === 'auditoria' ? 'Auditoria Genética' : 'Módulo'}
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
              {currentView === 'auditoria' && <Target className="w-8 h-8 text-muted-foreground" />}
            </div>
            <h2 className="text-2xl font-bold">Módulo em Desenvolvimento</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Este módulo estará disponível em breve. Você poderá {currentView === 'herd' ? 'gerenciar seu rebanho e cadastrar fêmeas' : currentView === 'segmentation' ? 'segmentar animais por performance genética' : currentView === 'bulls' ? 'explorar o catálogo de touros e fazer seleções' : currentView === 'charts' ? 'visualizar gráficos e estatísticas do rebanho' : currentView === 'auditoria' ? 'navegar pela auditoria genética completa do rebanho' : 'usar esta funcionalidade'}.
            </p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
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
            
            {farms.length === 0 ? <Card>
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
              </Card> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {farms.map(farm => <Card key={farm.farm_id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleFarmSelect(farm)}>
                     <CardHeader>
                       <div className="flex justify-between items-start">
                         <div className="space-y-1">
                           <CardTitle className="text-lg">{farm.farm_name}</CardTitle>
                           <CardDescription>
                             Proprietário: {farm.owner_name}
                           </CardDescription>
                         </div>
                         <div className="flex gap-2 items-center">
                           <Badge variant={getRoleBadgeVariant(farm.my_role)}>
                             {getRoleLabel(farm.my_role)}
                           </Badge>
                           {farm.is_default && <Badge variant="outline">Padrão</Badge>}
                           {farm.my_role === 'owner' && <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={e => handleDeleteFarm(farm.farm_id, farm.farm_name, e)} title="Apagar fazenda">
                               <Trash2 className="h-4 w-4" />
                             </Button>}
                         </div>
                       </div>
                     </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{(farm.total_females ?? 0)} fêmeas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          
                          
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </div>

          {/* Account Totals */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Resumo da Conta</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-5 h-5 text-primary" />
                    Total de Fazendas
                  </CardTitle>
                  <CardDescription>
                    Fazendas cadastradas na sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {totalFarms}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-primary" />
                    Total de Animais
                  </CardTitle>
                  <CardDescription>
                    Fêmeas cadastradas em todas as fazendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {totalAnimals.toLocaleString()}
                  </div>
                </CardContent>
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

      <CreateFarmModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleCreateFarmSuccess} />

      {/* Upload Modal */}
      {selectedFarm && <FemaleUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} farmId={selectedFarm.farm_id} farmName={selectedFarm.farm_name} />}
    </div>;
};
export default MainDashboard;