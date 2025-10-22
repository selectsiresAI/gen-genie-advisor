import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Trash2, Plus, Target, TrendingUp, Users, Milk, Heart, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpButton } from "@/components/help/HelpButton";
import { HelpHint } from "@/components/help/HelpHint";
interface Farm {
  id: string;
  nome: string;
}
interface MetasPageProps {
  farm: Farm;
  onBack: () => void;
}
interface MetaGenetica {
  id: string;
  nome: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
  categoria: "genetica" | "fenotipica";
}
interface MetaReproductiva {
  id: string;
  nome: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
}
interface MetaProducao {
  id: string;
  nome: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
}
interface MetaPopulacional {
  id: string;
  categoria: string;
  quantidadeAtual: number;
  quantidadeMeta: number;
}
interface MetasSistema {
  metasGeneticas: MetaGenetica[];
  metasReproductivas: MetaReproductiva[];
  metasProducao: MetaProducao[];
  metasPopulacionais: MetaPopulacional[];
  anotacoes: string;
  dataAtualizacao: string;
}
const metasGeneticasPadrao: Omit<MetaGenetica, 'id' | 'valorAtual' | 'valorMeta'>[] = [{
  nome: "TPI",
  unidade: "pontos",
  categoria: "genetica"
}, {
  nome: "NM$",
  unidade: "dólares",
  categoria: "genetica"
}, {
  nome: "Milk",
  unidade: "libras",
  categoria: "genetica"
}, {
  nome: "Fat",
  unidade: "libras",
  categoria: "genetica"
}, {
  nome: "Protein",
  unidade: "libras",
  categoria: "genetica"
}, {
  nome: "SCS",
  unidade: "pontos",
  categoria: "genetica"
}, {
  nome: "DPR",
  unidade: "pontos",
  categoria: "genetica"
}, {
  nome: "PTAT",
  unidade: "pontos",
  categoria: "genetica"
}];
const metasFenotipicasPadrao: Omit<MetaGenetica, 'id' | 'valorAtual' | 'valorMeta'>[] = [{
  nome: "Escore Corporal Médio",
  unidade: "pontos",
  categoria: "fenotipica"
}, {
  nome: "Peso Médio",
  unidade: "kg",
  categoria: "fenotipica"
}, {
  nome: "Altura Média",
  unidade: "cm",
  categoria: "fenotipica"
}];
const metasReproductivasPadrao: Omit<MetaReproductiva, 'id' | 'valorAtual' | 'valorMeta'>[] = [{
  nome: "Taxa de Prenhez",
  unidade: "%"
}, {
  nome: "Taxa de Concepção",
  unidade: "%"
}, {
  nome: "Intervalo entre Partos",
  unidade: "dias"
}, {
  nome: "Idade ao Primeiro Parto",
  unidade: "meses"
}, {
  nome: "Taxa de Retenção de Placenta",
  unidade: "%"
}, {
  nome: "Taxa de Mastite",
  unidade: "%"
}];
const metasProducaoPadrao: Omit<MetaProducao, 'id' | 'valorAtual' | 'valorMeta'>[] = [{
  nome: "Produção de Leite/Dia",
  unidade: "litros"
}, {
  nome: "Produção de Leite/Lactação",
  unidade: "litros"
}, {
  nome: "Teor de Gordura",
  unidade: "%"
}, {
  nome: "Teor de Proteína",
  unidade: "%"
}, {
  nome: "CCS Médio",
  unidade: "mil/ml"
}, {
  nome: "Persistência de Lactação",
  unidade: "%"
}];
const categoriasPopulacionais = ["Novilhas (0-12 meses)", "Novilhas (12-24 meses)", "Novilhas Prenhes", "Primíparas", "Secundíparas", "Multíparas", "Vacas Secas", "Vacas em Lactação", "Doadoras", "Receptoras"];
export default function MetasPage({
  farm,
  onBack
}: MetasPageProps) {
  const [metas, setMetas] = useState<MetasSistema>({
    metasGeneticas: [],
    metasReproductivas: [],
    metasProducao: [],
    metasPopulacionais: [],
    anotacoes: "",
    dataAtualizacao: new Date().toISOString()
  });
  const {
    toast
  } = useToast();

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const savedMetas = localStorage.getItem(`metas-${farm.id}`);
    if (savedMetas) {
      try {
        const parsedMetas = JSON.parse(savedMetas);
        setMetas(parsedMetas);
      } catch (error) {
        console.error('Erro ao carregar metas salvas:', error);
      }
    } else {
      // Inicializar com metas padrão
      inicializarMetasPadrao();
    }
  }, [farm.id]);
  const inicializarMetasPadrao = () => {
    const metasGeneticasInit = [...metasGeneticasPadrao.map(meta => ({
      ...meta,
      id: Date.now().toString() + Math.random().toString(),
      valorAtual: 0,
      valorMeta: 0
    })), ...metasFenotipicasPadrao.map(meta => ({
      ...meta,
      id: Date.now().toString() + Math.random().toString(),
      valorAtual: 0,
      valorMeta: 0
    }))];
    const metasReproductivasInit = metasReproductivasPadrao.map(meta => ({
      ...meta,
      id: Date.now().toString() + Math.random().toString(),
      valorAtual: 0,
      valorMeta: 0
    }));
    const metasProducaoInit = metasProducaoPadrao.map(meta => ({
      ...meta,
      id: Date.now().toString() + Math.random().toString(),
      valorAtual: 0,
      valorMeta: 0
    }));
    const metasPopulacionaisInit = categoriasPopulacionais.map(categoria => ({
      id: Date.now().toString() + Math.random().toString(),
      categoria,
      quantidadeAtual: 0,
      quantidadeMeta: 0
    }));
    setMetas({
      metasGeneticas: metasGeneticasInit,
      metasReproductivas: metasReproductivasInit,
      metasProducao: metasProducaoInit,
      metasPopulacionais: metasPopulacionaisInit,
      anotacoes: "",
      dataAtualizacao: new Date().toISOString()
    });
  };

  // Salvar no localStorage sempre que metas mudarem
  useEffect(() => {
    if (metas.metasGeneticas.length > 0 || metas.anotacoes) {
      localStorage.setItem(`metas-${farm.id}`, JSON.stringify(metas));
    }
  }, [metas, farm.id]);
  const salvarMetas = () => {
    const metasAtualizadas = {
      ...metas,
      dataAtualizacao: new Date().toISOString()
    };
    setMetas(metasAtualizadas);
    localStorage.setItem(`metas-${farm.id}`, JSON.stringify(metasAtualizadas));
    toast({
      title: "Metas salvas",
      description: "Suas metas foram salvas com sucesso."
    });
  };
  const atualizarMetaGenetica = (id: string, campo: 'valorAtual' | 'valorMeta', valor: number) => {
    setMetas(prev => ({
      ...prev,
      metasGeneticas: prev.metasGeneticas.map(meta => meta.id === id ? {
        ...meta,
        [campo]: valor
      } : meta)
    }));
  };
  const atualizarMetaReproductiva = (id: string, campo: 'valorAtual' | 'valorMeta', valor: number) => {
    setMetas(prev => ({
      ...prev,
      metasReproductivas: prev.metasReproductivas.map(meta => meta.id === id ? {
        ...meta,
        [campo]: valor
      } : meta)
    }));
  };
  const atualizarMetaProducao = (id: string, campo: 'valorAtual' | 'valorMeta', valor: number) => {
    setMetas(prev => ({
      ...prev,
      metasProducao: prev.metasProducao.map(meta => meta.id === id ? {
        ...meta,
        [campo]: valor
      } : meta)
    }));
  };
  const atualizarMetaPopulacional = (id: string, campo: 'quantidadeAtual' | 'quantidadeMeta', valor: number) => {
    setMetas(prev => ({
      ...prev,
      metasPopulacionais: prev.metasPopulacionais.map(meta => meta.id === id ? {
        ...meta,
        [campo]: valor
      } : meta)
    }));
  };
  const limparTodasMetas = () => {
    inicializarMetasPadrao();
    localStorage.removeItem(`metas-${farm.id}`);
    toast({
      title: "Metas reinicializadas",
      description: "Todas as metas foram resetadas para os valores padrão."
    });
  };
  const calcularProgressoGenetico = (valorAtual: number, valorMeta: number) => {
    if (valorMeta === 0) return 0;
    return Math.min(100, Math.max(0, valorAtual / valorMeta * 100));
  };
  const calcularProgressoPopulacional = (atual: number, meta: number) => {
    if (meta === 0) return 0;
    return Math.min(100, Math.max(0, atual / meta * 100));
  };
  return <div className="min-h-screen bg-background p-6">
      <HelpButton context="metas" />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Metas da Fazenda</h1>
            <HelpHint content="Estabeleça objetivos mensuráveis em 4 áreas: Genética, Reproductiva, Produção e Populacional. Acompanhe o progresso em tempo real" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={limparTodasMetas} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Reinicializar
            </Button>
            <Button onClick={salvarMetas}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Metas
            </Button>
          </div>
        </div>

        <Tabs defaultValue="geneticas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geneticas">Genéticas</TabsTrigger>
            <TabsTrigger value="reproductivas">Reproductivas</TabsTrigger>
            <TabsTrigger value="producao">Produção</TabsTrigger>
            <TabsTrigger value="populacionais">Populacionais</TabsTrigger>
            <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
          </TabsList>

          <TabsContent value="geneticas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Metas Genéticas e Fenotípicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metas.metasGeneticas.map(meta => <div key={meta.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{meta.nome}</Label>
                      <p className="text-xs text-muted-foreground">{meta.categoria === 'genetica' ? 'Genética' : 'Fenotípica'}</p>
                    </div>
                    <div>
                      <Label className="text-sm">Valor Atual</Label>
                      <Input type="number" step="0.01" value={meta.valorAtual} onChange={e => atualizarMetaGenetica(meta.id, 'valorAtual', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-sm">Meta</Label>
                      <Input type="number" step="0.01" value={meta.valorMeta} onChange={e => atualizarMetaGenetica(meta.id, 'valorMeta', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="font-medium">{calcularProgressoGenetico(meta.valorAtual, meta.valorMeta).toFixed(1)}%</span>
                        <p className="text-xs text-muted-foreground">{meta.unidade}</p>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{
                      width: `${calcularProgressoGenetico(meta.valorAtual, meta.valorMeta)}%`
                    }} />
                      </div>
                    </div>
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reproductivas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Metas Reproductivas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metas.metasReproductivas.map(meta => <div key={meta.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{meta.nome}</Label>
                    </div>
                    <div>
                      <Label className="text-sm">Valor Atual</Label>
                      <Input type="number" step="0.01" value={meta.valorAtual} onChange={e => atualizarMetaReproductiva(meta.id, 'valorAtual', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-sm">Meta</Label>
                      <Input type="number" step="0.01" value={meta.valorMeta} onChange={e => atualizarMetaReproductiva(meta.id, 'valorMeta', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="font-medium">{calcularProgressoGenetico(meta.valorAtual, meta.valorMeta).toFixed(1)}%</span>
                        <p className="text-xs text-muted-foreground">{meta.unidade}</p>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all" style={{
                      width: `${calcularProgressoGenetico(meta.valorAtual, meta.valorMeta)}%`
                    }} />
                      </div>
                    </div>
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="producao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Milk className="w-5 h-5" />
                  Metas de Produção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metas.metasProducao.map(meta => <div key={meta.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{meta.nome}</Label>
                    </div>
                    <div>
                      <Label className="text-sm">Valor Atual</Label>
                      <Input type="number" step="0.01" value={meta.valorAtual} onChange={e => atualizarMetaProducao(meta.id, 'valorAtual', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-sm">Meta</Label>
                      <Input type="number" step="0.01" value={meta.valorMeta} onChange={e => atualizarMetaProducao(meta.id, 'valorMeta', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="font-medium">{calcularProgressoGenetico(meta.valorAtual, meta.valorMeta).toFixed(1)}%</span>
                        <p className="text-xs text-muted-foreground">{meta.unidade}</p>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{
                      width: `${calcularProgressoGenetico(meta.valorAtual, meta.valorMeta)}%`
                    }} />
                      </div>
                    </div>
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="populacionais" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Metas Populacionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metas.metasPopulacionais.map(meta => <div key={meta.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{meta.categoria}</Label>
                    </div>
                    <div>
                      <Label className="text-sm">Quantidade Atual</Label>
                      <Input type="number" value={meta.quantidadeAtual} onChange={e => atualizarMetaPopulacional(meta.id, 'quantidadeAtual', parseInt(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-sm">Meta</Label>
                      <Input type="number" value={meta.quantidadeMeta} onChange={e => atualizarMetaPopulacional(meta.id, 'quantidadeMeta', parseInt(e.target.value) || 0)} placeholder="0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="font-medium">{calcularProgressoPopulacional(meta.quantidadeAtual, meta.quantidadeMeta).toFixed(1)}%</span>
                        <p className="text-xs text-muted-foreground">animais</p>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{
                      width: `${calcularProgressoPopulacional(meta.quantidadeAtual, meta.quantidadeMeta)}%`
                    }} />
                      </div>
                    </div>
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anotacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Anotações e Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Anotações Gerais da Fazenda
                    </Label>
                    <Textarea placeholder="Digite suas anotações sobre metas, estratégias, observações importantes, números iniciais, auditoria genética, etc..." value={metas.anotacoes} onChange={e => setMetas(prev => ({
                    ...prev,
                    anotacoes: e.target.value
                  }))} className="min-h-[200px]" />
                  </div>
                  
                  {metas.dataAtualizacao && <div className="text-sm text-muted-foreground">
                      Última atualização: {new Date(metas.dataAtualizacao).toLocaleString('pt-BR')}
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* Card de resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo das Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-medium">Metas Genéticas</h3>
                    <p className="text-2xl font-bold text-primary">{metas.metasGeneticas.length}</p>
                    <p className="text-sm text-muted-foreground">definidas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-medium">Metas Reproductivas</h3>
                    <p className="text-2xl font-bold text-green-600">{metas.metasReproductivas.length}</p>
                    <p className="text-sm text-muted-foreground">definidas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-medium">Metas de Produção</h3>
                    <p className="text-2xl font-bold text-blue-600">{metas.metasProducao.length}</p>
                    <p className="text-sm text-muted-foreground">definidas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-medium">Categorias Populacionais</h3>
                    <p className="text-2xl font-bold text-orange-600">{metas.metasPopulacionais.length}</p>
                    <p className="text-sm text-muted-foreground">definidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}