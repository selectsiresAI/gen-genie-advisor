import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Users, Zap, Save, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Farm {
  id: string;
  nome: string;
  females: any[];
  bulls: any[];
}

interface SMSPageProps {
  farm: Farm;
  onBack: () => void;
}

interface AcasalamentoItem {
  id: string;
  touro: {
    naab: string;
    nome: string;
    TPI: number;
  };
  categoria: "Novilha" | "Primípara" | "Secundípara" | "Multípara";
  subcategoria?: "Doadora" | "Intermediária" | "Receptora";
  femeaSelecionada?: {
    id: string;
    brinco: string;
    nomePai: string;
  };
  quantidade: number;
  observacoes?: string;
}

const categorias = [
  { value: "Novilha", label: "Novilha" },
  { value: "Primípara", label: "Primípara" },
  { value: "Secundípara", label: "Secundípara" },
  { value: "Multípara", label: "Multípara" }
];

const subcategorias = [
  { value: "Doadora", label: "Doadora" },
  { value: "Intermediária", label: "Intermediária" },
  { value: "Receptora", label: "Receptora" }
];

export default function SMSPage({ farm, onBack }: SMSPageProps) {
  const [acasalamentos, setAcasalamentos] = useState<AcasalamentoItem[]>([]);
  const [selectedTouro, setSelectedTouro] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacoes, setObservacoes] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const savedSMS = localStorage.getItem(`sms-${farm.id}`);
    if (savedSMS) {
      try {
        const parsedSMS = JSON.parse(savedSMS);
        setAcasalamentos(parsedSMS);
      } catch (error) {
        console.error('Erro ao carregar SMS salvos:', error);
      }
    }
  }, [farm.id]);

  // Salvar no localStorage sempre que acasalamentos mudarem
  useEffect(() => {
    if (acasalamentos.length > 0) {
      localStorage.setItem(`sms-${farm.id}`, JSON.stringify(acasalamentos));
    }
  }, [acasalamentos, farm.id]);

  const handleUsarBotijao = () => {
    // Buscar dados do botijão virtual
    const savedBotijao = localStorage.getItem(`botijao-${farm.id}`);
    if (savedBotijao) {
      try {
        const parsedBotijao = JSON.parse(savedBotijao);
        const novosAcasalamentos: AcasalamentoItem[] = [];

        parsedBotijao.itens.forEach((item: any) => {
          // Por categoria de idade
          if (item.distribuicao.Nov > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-nov-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Novilha",
              quantidade: item.distribuicao.Nov,
              observacoes: `Importado do Botijão Virtual - ${item.tipo}`
            });
          }

          if (item.distribuicao.Prim > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-prim-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Primípara",
              quantidade: item.distribuicao.Prim,
              observacoes: `Importado do Botijão Virtual - ${item.tipo}`
            });
          }

          if (item.distribuicao.Secund > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-sec-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Secundípara",
              quantidade: item.distribuicao.Secund,
              observacoes: `Importado do Botijão Virtual - ${item.tipo}`
            });
          }

          if (item.distribuicao.Mult > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-mult-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Multípara",
              quantidade: item.distribuicao.Mult,
              observacoes: `Importado do Botijão Virtual - ${item.tipo}`
            });
          }

          // Por segmentação
          if (item.distribuicao.Doadoras > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-doad-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Novilha", // categoria padrão
              subcategoria: "Doadora",
              quantidade: item.distribuicao.Doadoras,
              observacoes: `Importado do Botijão Virtual - ${item.tipo} - Doadoras`
            });
          }

          if (item.distribuicao.Intermediarias > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-inter-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Novilha", // categoria padrão
              subcategoria: "Intermediária",
              quantidade: item.distribuicao.Intermediarias,
              observacoes: `Importado do Botijão Virtual - ${item.tipo} - Intermediárias`
            });
          }

          if (item.distribuicao.Receptoras > 0) {
            novosAcasalamentos.push({
              id: `${Date.now()}-recep-${item.touro.naab}`,
              touro: {
                naab: item.touro.naab,
                nome: item.touro.nome,
                TPI: item.touro.TPI
              },
              categoria: "Novilha", // categoria padrão
              subcategoria: "Receptora",
              quantidade: item.distribuicao.Receptoras,
              observacoes: `Importado do Botijão Virtual - ${item.tipo} - Receptoras`
            });
          }
        });

        setAcasalamentos(prev => [...prev, ...novosAcasalamentos]);
        toast({
          title: "Botijão Virtual Importado",
          description: `${novosAcasalamentos.length} acasalamentos importados com sucesso.`
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao importar dados do Botijão Virtual.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Botijão Virtual Vazio",
        description: "Nenhum touro encontrado no Botijão Virtual. Monte o botijão primeiro.",
        variant: "destructive"
      });
    }
  };

  const adicionarAcasalamento = () => {
    if (!selectedTouro || !selectedCategoria) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um touro e uma categoria.",
        variant: "destructive"
      });
      return;
    }

    const touro = farm.bulls.find(b => b.naab === selectedTouro);
    if (!touro) {
      toast({
        title: "Erro",
        description: "Touro não encontrado.",
        variant: "destructive"
      });
      return;
    }

    const novoAcasalamento: AcasalamentoItem = {
      id: Date.now().toString(),
      touro: {
        naab: touro.naab,
        nome: touro.nome,
        TPI: touro.TPI
      },
      categoria: selectedCategoria as any,
      subcategoria: selectedSubcategoria as any,
      quantidade,
      observacoes
    };

    setAcasalamentos(prev => [...prev, novoAcasalamento]);
    
    // Limpar formulário
    setSelectedTouro("");
    setSelectedCategoria("");
    setSelectedSubcategoria("");
    setQuantidade(1);
    setObservacoes("");

    toast({
      title: "Acasalamento adicionado",
      description: "Acasalamento adicionado com sucesso."
    });
  };

  const removerAcasalamento = (id: string) => {
    setAcasalamentos(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Acasalamento removido",
      description: "Acasalamento removido com sucesso."
    });
  };

  const limparTodos = () => {
    setAcasalamentos([]);
    localStorage.removeItem(`sms-${farm.id}`);
    toast({
      title: "Dados limpos",
      description: "Todos os acasalamentos foram removidos."
    });
  };

  const exportarSMS = () => {
    if (acasalamentos.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há acasalamentos para exportar.",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['Touro NAAB', 'Nome do Touro', 'TPI', 'Categoria', 'Subcategoria', 'Quantidade', 'Observações'].join(','),
      ...acasalamentos.map(a => [
        a.touro.naab,
        a.touro.nome,
        a.touro.TPI,
        a.categoria,
        a.subcategoria || '',
        a.quantidade,
        a.observacoes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SMS_${farm.nome}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportado",
      description: "SMS exportado com sucesso."
    });
  };

  const tourosFiltrados = farm.bulls.filter(bull =>
    bull.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bull.naab.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resumoPorCategoria = acasalamentos.reduce((acc, item) => {
    const key = item.subcategoria ? `${item.categoria} - ${item.subcategoria}` : item.categoria;
    acc[key] = (acc[key] || 0) + item.quantidade;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">SMS - Sistema de Acasalamento</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUsarBotijao}>
              <Zap className="w-4 h-4 mr-2" />
              Usar Botijão Virtual
            </Button>
            <Button variant="outline" onClick={exportarSMS}>
              <Save className="w-4 h-4 mr-2" />
              Exportar SMS
            </Button>
          </div>
        </div>

        <Tabs defaultValue="acasalar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="acasalar">Acasalar</TabsTrigger>
            <TabsTrigger value="planejados">Planejados ({acasalamentos.length})</TabsTrigger>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
          </TabsList>

          <TabsContent value="acasalar" className="space-y-6">
            {/* Formulário de Acasalamento */}
            <Card>
              <CardHeader>
                <CardTitle>Novo Acasalamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Busca de touros */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar Touro</label>
                  <Input
                    placeholder="Buscar por nome ou NAAB..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={selectedTouro} onValueChange={setSelectedTouro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um touro" />
                    </SelectTrigger>
                    <SelectContent>
                      {tourosFiltrados.map((bull) => (
                        <SelectItem key={bull.naab} value={bull.naab}>
                          {bull.nome} ({bull.naab}) - TPI: {bull.TPI}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Categoria */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria</label>
                    <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategoria */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subcategoria (Opcional)</label>
                    <Select value={selectedSubcategoria} onValueChange={setSelectedSubcategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma subcategoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias.map((sub) => (
                          <SelectItem key={sub.value} value={sub.value}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Quantidade */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantidade de Doses</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Observações</label>
                    <Input
                      placeholder="Observações opcionais..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={adicionarAcasalamento} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Acasalamento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planejados" className="space-y-6">
            {/* Lista de Acasalamentos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Acasalamentos Planejados</CardTitle>
                {acasalamentos.length > 0 && (
                  <Button variant="outline" onClick={limparTodos} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Todos
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {acasalamentos.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Nenhum acasalamento planejado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione acasalamentos ou importe do Botijão Virtual
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {acasalamentos.map((acasalamento) => (
                      <div
                        key={acasalamento.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{acasalamento.touro.nome}</h4>
                            <Badge variant="secondary">{acasalamento.touro.naab}</Badge>
                            <Badge variant="outline">TPI: {acasalamento.touro.TPI}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge>{acasalamento.categoria}</Badge>
                            {acasalamento.subcategoria && (
                              <Badge variant="outline">{acasalamento.subcategoria}</Badge>
                            )}
                            <span>• {acasalamento.quantidade} doses</span>
                            {acasalamento.observacoes && (
                              <span>• {acasalamento.observacoes}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerAcasalamento(acasalamento.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumo" className="space-y-6">
            {/* Resumo por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(resumoPorCategoria).length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Nenhum dados para resumo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione acasalamentos para ver o resumo
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(resumoPorCategoria).map(([categoria, quantidade]) => (
                      <Card key={categoria}>
                        <CardContent className="p-4 text-center">
                          <h3 className="font-medium">{categoria}</h3>
                          <p className="text-2xl font-bold text-primary">{quantidade}</p>
                          <p className="text-sm text-muted-foreground">doses</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Geral */}
            {acasalamentos.length > 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <h2 className="text-xl font-bold mb-2">Total Geral</h2>
                  <p className="text-3xl font-bold text-primary">
                    {acasalamentos.reduce((acc, item) => acc + item.quantidade, 0)}
                  </p>
                  <p className="text-muted-foreground">doses planejadas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}