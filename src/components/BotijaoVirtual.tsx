import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Search as SearchIcon, Filter, Download, Upload, Edit, Save, X, Clock, TrendingUp, ChevronUp, ChevronDown, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Types
type Bull = {
  naab: string;
  nome: string;
  pedigree: string;
  TPI: number;
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  SCS: number;
  PTAT: number;
  disponibilidade?: "Disponível" | "Sem estoque";
  empresa?: string;
};

type BotijaoItem = {
  id: string;
  touro: Bull;
  tipo: "Convencional" | "Sexado";
  doses: number;
  preco: number;
  distribuicao: {
    Nov: number;
    Prim: number;
    Secund: number;
    Mult: number;
    Doadoras: number;
    Intermediarias: number;
    Receptoras: number;
  };
  dataAdicao: string;
  observacoes?: string;
};

type BotijaoVirtual = {
  fazendaId: string;
  itens: BotijaoItem[];
  dataAtualizacao: string;
  estoqueAtual: {
    total: number;
    convencional: number;
    sexado: number;
  };
};

type StockUpdate = {
  touroId: string;
  dosesUsadas: number;
  categoria: string;
  data: string;
  tecnico: string;
};

interface BotijaoVirtualPageProps {
  client: any;
  farm: any;
  bulls: Bull[];
  selectedBulls?: string[];
  onBack: () => void;
}

function BotijaoVirtualPage({ client, farm, bulls, selectedBulls = [], onBack }: BotijaoVirtualPageProps) {
  const [botijao, setBotijao] = useState<BotijaoVirtual>({
    fazendaId: farm.id,
    itens: [],
    dataAtualizacao: new Date().toISOString(),
    estoqueAtual: { total: 0, convencional: 0, sexado: 0 }
  });

  // Carregar dados salvos do localStorage na inicialização
  useEffect(() => {
    const savedBotijao = localStorage.getItem(`botijao-${farm.id}`);
    if (savedBotijao) {
      try {
        const parsedBotijao = JSON.parse(savedBotijao);
        setBotijao(parsedBotijao);
      } catch (error) {
        console.error('Erro ao carregar botijão salvo:', error);
      }
    }
  }, [farm.id]);

  // Salvar no localStorage sempre que o botijão mudar
  useEffect(() => {
    if (botijao.itens.length > 0 || botijao.dataAtualizacao) {
      localStorage.setItem(`botijao-${farm.id}`, JSON.stringify(botijao));
    }
  }, [botijao, farm.id]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("todas");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showStockUpdateDialog, setShowStockUpdateDialog] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [newUpdate, setNewUpdate] = useState<Partial<StockUpdate>>({
    dosesUsadas: 1,
    categoria: "Nov",
    data: new Date().toISOString().split('T')[0],
    tecnico: ""
  });

  // Sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Nitrogen supply state
  const [showNitrogenDialog, setShowNitrogenDialog] = useState(false);
  const [nitrogenData, setNitrogenData] = useState({
    dataAbastecimento: new Date().toISOString().split('T')[0],
    volume: 0,
    observacoes: ""
  });
  const [nitrogenRecords, setNitrogenRecords] = useState<{
    dataAbastecimento: string;
    volume: number;
    observacoes: string;
    id: string;
  }[]>([]);
  const [editingNitrogen, setEditingNitrogen] = useState<string | null>(null);

  // Carregar dados de nitrogênio salvos do localStorage
  useEffect(() => {
    const savedNitrogen = localStorage.getItem(`nitrogen-${farm.id}`);
    if (savedNitrogen) {
      try {
        const parsedNitrogen = JSON.parse(savedNitrogen);
        setNitrogenRecords(parsedNitrogen);
      } catch (error) {
        console.error('Erro ao carregar dados de nitrogênio:', error);
      }
    }
  }, [farm.id]);

  // Salvar dados de nitrogênio no localStorage sempre que mudarem
  useEffect(() => {
    if (nitrogenRecords.length > 0) {
      localStorage.setItem(`nitrogen-${farm.id}`, JSON.stringify(nitrogenRecords));
    }
  }, [nitrogenRecords, farm.id]);
  
  const [editingItemData, setEditingItemData] = useState<BotijaoItem | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<BotijaoItem>>({
    touro: undefined,
    tipo: "Convencional",
    doses: 1,
    preco: 0,
    distribuicao: {
      Nov: 0,
      Prim: 0,
      Secund: 0,
      Mult: 0,
      Doadoras: 0,
      Intermediarias: 0,
      Receptoras: 0
    },
    observacoes: ""
  });

  // Auto-adicionar touros selecionados
  useEffect(() => {
    if (selectedBulls.length > 0) {
      const bullsToAdd = selectedBulls
        .map(naab => bulls.find(b => b.naab === naab))
        .filter(Boolean)
        .filter(bull => !botijao.itens.some(item => item.touro.naab === bull!.naab));

      if (bullsToAdd.length > 0) {
        const newItems: BotijaoItem[] = bullsToAdd.map(bull => ({
          id: `${bull!.naab}-${Date.now()}-${Math.random()}`,
          touro: bull!,
          tipo: "Convencional",
          doses: 5, // Valor padrão
          preco: 0,
          distribuicao: {
            Nov: 0, Prim: 0, Secund: 0, Mult: 0,
            Doadoras: 0, Intermediarias: 0, Receptoras: 0
          },
          dataAdicao: new Date().toISOString(),
          observacoes: ""
        }));

        setBotijao(prev => {
          const updatedItens = [...prev.itens, ...newItems];
          const estoqueAtual = calculateStock(updatedItens);
          return {
            ...prev,
            itens: updatedItens,
            dataAtualizacao: new Date().toISOString(),
            estoqueAtual
          };
        });
      }
    }
  }, [selectedBulls, bulls]);

  // Calcular estoque
  const calculateStock = (itens: BotijaoItem[]) => {
    const total = itens.reduce((sum, item) => sum + item.doses, 0);
    const convencional = itens.filter(i => i.tipo === "Convencional").reduce((sum, item) => sum + item.doses, 0);
    const sexado = itens.filter(i => i.tipo === "Sexado").reduce((sum, item) => sum + item.doses, 0);
    return { total, convencional, sexado };
  };

  // Filtrar touros
  const filteredBulls = useMemo(() => {
    let filtered = bulls.filter(bull => 
      bull.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bull.naab.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (selectedEmpresa !== "todas") {
      filtered = filtered.filter(bull => bull.empresa === selectedEmpresa);
    }
    
    return filtered;
  }, [bulls, searchTerm, selectedEmpresa]);

  // Obter empresas únicas
  const empresas = useMemo(() => {
    const uniqueEmpresas = Array.from(new Set(bulls.map(bull => bull.empresa).filter(Boolean)));
    return uniqueEmpresas;
  }, [bulls]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalDoses = botijao.itens.reduce((sum, item) => sum + item.doses, 0);
    const totalTouros = botijao.itens.length;
    const dosesConvencionais = botijao.itens.filter(i => i.tipo === "Convencional").reduce((sum, item) => sum + item.doses, 0);
    const dosesSexadas = botijao.itens.filter(i => i.tipo === "Sexado").reduce((sum, item) => sum + item.doses, 0);
    const valorTotal = botijao.itens.reduce((sum, item) => sum + (item.preco * item.doses), 0);
    
    const porCategoria = {
      Nov: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Nov, 0),
      Prim: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Prim, 0),
      Secund: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Secund, 0),
      Mult: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Mult, 0),
      Doadoras: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Doadoras, 0),
      Intermediarias: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Intermediarias, 0),
      Receptoras: botijao.itens.reduce((sum, item) => sum + item.distribuicao.Receptoras, 0)
    };

    return { totalDoses, totalTouros, dosesConvencionais, dosesSexadas, valorTotal, porCategoria };
  }, [botijao.itens]);

  const addItemToBotijao = () => {
    if (!newItem.touro) return;
    
    const item: BotijaoItem = {
      id: `${newItem.touro.naab}-${Date.now()}-${Math.random()}`,
      touro: newItem.touro,
      tipo: newItem.tipo || "Convencional",
      doses: newItem.doses || 1,
      preco: newItem.preco || 0,
      distribuicao: newItem.distribuicao || {
        Nov: 0, Prim: 0, Secund: 0, Mult: 0,
        Doadoras: 0, Intermediarias: 0, Receptoras: 0
      },
      dataAdicao: new Date().toISOString(),
      observacoes: newItem.observacoes || ""
    };

    setBotijao(prev => {
      const updatedItens = [...prev.itens, item];
      const estoqueAtual = calculateStock(updatedItens);
      return {
        ...prev,
        itens: updatedItens,
        dataAtualizacao: new Date().toISOString(),
        estoqueAtual
      };
    });

    setNewItem({
      touro: undefined,
      tipo: "Convencional",
      doses: 1,
      preco: 0,
      distribuicao: {
        Nov: 0, Prim: 0, Secund: 0, Mult: 0,
        Doadoras: 0, Intermediarias: 0, Receptoras: 0
      },
      observacoes: ""
    });
    setShowAddDialog(false);
  };

  const updateItem = (itemId: string, updates: Partial<BotijaoItem>) => {
    setBotijao(prev => {
      const updatedItens = prev.itens.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      const estoqueAtual = calculateStock(updatedItens);
      return {
        ...prev,
        itens: updatedItens,
        dataAtualizacao: new Date().toISOString(),
        estoqueAtual
      };
    });
    
    // Update editing item data if it's the same item
    if (editingItemData && editingItemData.id === itemId) {
      setEditingItemData(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const startEditingItem = (item: BotijaoItem) => {
    setEditingItem(item.id);
    setEditingItemData({ ...item });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingItemData(null);
  };

  const saveEditing = () => {
    if (editingItemData) {
      updateItem(editingItemData.id, editingItemData);
    }
    setEditingItem(null);
    setEditingItemData(null);
  };

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortField) return botijao.itens;
    
    return [...botijao.itens].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case "nome":
          aValue = a.touro.nome.toLowerCase();
          bValue = b.touro.nome.toLowerCase();
          break;
        case "tipo":
          aValue = a.tipo.toLowerCase();
          bValue = b.tipo.toLowerCase();
          break;
        case "empresa":
          aValue = (a.touro.empresa || "").toLowerCase();
          bValue = (b.touro.empresa || "").toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [botijao.itens, sortField, sortDirection]);

  // Add nitrogen supply
  const addNitrogenSupply = () => {
    const newRecord = {
      ...nitrogenData,
      id: `nitrogen-${Date.now()}-${Math.random()}`
    };
    
    setNitrogenRecords(prev => [...prev, newRecord]);
    setNitrogenData({
      dataAbastecimento: new Date().toISOString().split('T')[0],
      volume: 0,
      observacoes: ""
    });
    setShowNitrogenDialog(false);
  };

  const editNitrogenRecord = (id: string, updatedData: Partial<typeof nitrogenData>) => {
    setNitrogenRecords(prev => prev.map(record => 
      record.id === id ? { ...record, ...updatedData } : record
    ));
  };

  const deleteNitrogenRecord = (id: string) => {
    setNitrogenRecords(prev => prev.filter(record => record.id !== id));
  };

  // Função para limpar todos os dados salvos (útil para reset)
  const clearAllData = () => {
    localStorage.removeItem(`botijao-${farm.id}`);
    localStorage.removeItem(`nitrogen-${farm.id}`);
    setBotijao({
      fazendaId: farm.id,
      itens: [],
      dataAtualizacao: new Date().toISOString(),
      estoqueAtual: { total: 0, convencional: 0, sexado: 0 }
    });
    setNitrogenRecords([]);
  };

  const removeItem = (itemId: string) => {
    setBotijao(prev => {
      const updatedItens = prev.itens.filter(item => item.id !== itemId);
      const estoqueAtual = calculateStock(updatedItens);
      return {
        ...prev,
        itens: updatedItens,
        dataAtualizacao: new Date().toISOString(),
        estoqueAtual
      };
    });
  };

  const duplicateItem = (originalItem: BotijaoItem) => {
    const duplicatedItem: BotijaoItem = {
      ...originalItem,
      id: `${originalItem.touro.naab}-${Date.now()}-${Math.random()}`,
      dataAdicao: new Date().toISOString()
    };

    setBotijao(prev => {
      const updatedItens = [...prev.itens, duplicatedItem];
      const estoqueAtual = calculateStock(updatedItens);
      return {
        ...prev,
        itens: updatedItens,
        dataAtualizacao: new Date().toISOString(),
        estoqueAtual
      };
    });
  };

  const addStockUpdate = () => {
    if (!newUpdate.touroId || !newUpdate.tecnico) return;
    
    const update: StockUpdate = {
      touroId: newUpdate.touroId,
      dosesUsadas: newUpdate.dosesUsadas || 1,
      categoria: newUpdate.categoria || "Nov",
      data: newUpdate.data || new Date().toISOString().split('T')[0],
      tecnico: newUpdate.tecnico
    };

    setStockUpdates(prev => [...prev, update]);
    
    // Atualizar doses do touro no botijão
    setBotijao(prev => {
      const updatedItens = prev.itens.map(item => {
        if (item.id === newUpdate.touroId) {
          const newDoses = Math.max(0, item.doses - (newUpdate.dosesUsadas || 1));
          return { ...item, doses: newDoses };
        }
        return item;
      });
      const estoqueAtual = calculateStock(updatedItens);
      return {
        ...prev,
        itens: updatedItens,
        dataAtualizacao: new Date().toISOString(),
        estoqueAtual
      };
    });

    setNewUpdate({
      dosesUsadas: 1,
      categoria: "Nov",
      data: new Date().toISOString().split('T')[0],
      tecnico: ""
    });
    setShowStockUpdateDialog(false);
  };

  const exportBotijao = () => {
    const csvData = botijao.itens.map(item => ({
      NAAB: item.touro.naab,
      Nome: item.touro.nome,
      Empresa: item.touro.empresa || "-",
      Tipo: item.tipo,
      Doses: item.doses,
      Preco: item.preco.toFixed(2),
      Nov: item.distribuicao.Nov,
      Prim: item.distribuicao.Prim,
      Secund: item.distribuicao.Secund,
      Mult: item.distribuicao.Mult,
      Doadoras: item.distribuicao.Doadoras,
      Intermediarias: item.distribuicao.Intermediarias,
      Receptoras: item.distribuicao.Receptoras,
      DataAdicao: new Date(item.dataAdicao).toLocaleDateString(),
      Observacoes: item.observacoes || ""
    }));

    const headers = Object.keys(csvData[0] || {});
    const csv = [headers.join(",")]
      .concat(csvData.map(row => headers.map(h => String((row as any)[h] ?? "")).join(",")))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `botijao-virtual-${farm.nome}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Botijão Virtual</h1>
          <p className="text-muted-foreground">Fazenda: {farm.nome}</p>
          <p className="text-xs text-muted-foreground">
            Última atualização: {new Date(botijao.dataAtualizacao).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>

      {/* ÚNICO conjunto de Painéis de Gestão de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              <div>
                <div className="text-2xl font-bold">{stats.totalDoses}</div>
                <div className="text-sm text-muted-foreground">Total de Doses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} />
              <div>
                <div className="text-2xl font-bold">{stats.dosesConvencionais}</div>
                <div className="text-sm text-muted-foreground">Convencionais</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-purple-500" size={20} />
              <div>
                <div className="text-2xl font-bold">{stats.dosesSexadas}</div>
                <div className="text-sm text-muted-foreground">Sexadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="text-green-600">R$</div>
              <div>
                <div className="text-2xl font-bold">{stats.valorTotal.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ÚNICA Distribuição por Categoria */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-bold">{stats.porCategoria.Nov}</div>
            <div className="text-xs text-muted-foreground">Novilhas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-bold">{stats.porCategoria.Prim}</div>
            <div className="text-xs text-muted-foreground">Primíparas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-bold">{stats.porCategoria.Secund}</div>
            <div className="text-xs text-muted-foreground">Secundíparas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-lg font-bold">{stats.porCategoria.Mult}</div>
            <div className="text-xs text-muted-foreground">Multíparas</div>
          </CardContent>
        </Card>
      </div>



      {/* Controles - Mantém apenas os necessários */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                Adicionar Touro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Touro ao Botijão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Selecionar Touro</Label>
                  <Select 
                    value={newItem.touro?.naab || ""} 
                    onValueChange={(value) => {
                      const touro = filteredBulls.find(b => b.naab === value);
                      setNewItem(prev => ({ ...prev, touro }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um touro" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBulls.map(bull => (
                        <SelectItem key={bull.naab} value={bull.naab}>
                          {bull.naab} - {bull.nome} ({bull.empresa || "S/Empresa"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={newItem.tipo} 
                      onValueChange={(value: "Convencional" | "Sexado") => 
                        setNewItem(prev => ({ ...prev, tipo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Convencional">Convencional</SelectItem>
                        <SelectItem value="Sexado">Sexado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Doses</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.doses}
                      onChange={(e) => setNewItem(prev => ({ 
                        ...prev, 
                        doses: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Preço por Dose (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.preco}
                      onChange={(e) => setNewItem(prev => ({ 
                        ...prev, 
                        preco: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Distribuição por Categoria de Idade</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {["Nov", "Prim", "Secund", "Mult"].map(cat => (
                      <div key={cat}>
                        <Label className="text-xs">{cat}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newItem.distribuicao?.[cat as keyof typeof newItem.distribuicao] || 0}
                          onChange={(e) => setNewItem(prev => ({
                            ...prev,
                            distribuicao: {
                              ...prev.distribuicao!,
                              [cat]: parseInt(e.target.value) || 0
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Distribuição por Segmentação</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["Doadoras", "Intermediarias", "Receptoras"].map(seg => (
                      <div key={seg}>
                        <Label className="text-xs">{seg}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newItem.distribuicao?.[seg as keyof typeof newItem.distribuicao] || 0}
                          onChange={(e) => setNewItem(prev => ({
                            ...prev,
                            distribuicao: {
                              ...prev.distribuicao!,
                              [seg]: parseInt(e.target.value) || 0
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Input
                    value={newItem.observacoes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre este touro..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addItemToBotijao} disabled={!newItem.touro}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNitrogenDialog} onOpenChange={setShowNitrogenDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Snowflake size={16} className="mr-2" />
                Abastecimento N2
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abastecimento de Nitrogênio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Data do Abastecimento</Label>
                  <Input
                    type="date"
                    value={nitrogenData.dataAbastecimento}
                    onChange={(e) => setNitrogenData(prev => ({ 
                      ...prev, 
                      dataAbastecimento: e.target.value 
                    }))}
                  />
                </div>
                
                <div>
                  <Label>Volume (Litros)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={nitrogenData.volume}
                    onChange={(e) => setNitrogenData(prev => ({ 
                      ...prev, 
                      volume: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Input
                    value={nitrogenData.observacoes}
                    onChange={(e) => setNitrogenData(prev => ({ 
                      ...prev, 
                      observacoes: e.target.value 
                    }))}
                    placeholder="Observações sobre o abastecimento..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNitrogenDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addNitrogenSupply}>
                    Registrar Abastecimento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Registros de Nitrogênio - Exibição ao lado */}
          {nitrogenRecords.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
              <Snowflake size={16} className="text-blue-600" />
              <div className="text-sm">
                <span className="font-medium">Último N2:</span>
                <span className="ml-1">
                  {new Date(nitrogenRecords[nitrogenRecords.length - 1].dataAbastecimento).toLocaleDateString()} - 
                  {nitrogenRecords[nitrogenRecords.length - 1].volume}L
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNitrogen(nitrogenRecords[nitrogenRecords.length - 1].id)}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <Edit size={12} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowStockUpdateDialog(true)}
            disabled={botijao.itens.length === 0}
          >
            <Clock size={16} className="mr-2" />
            Atualizar Estoque
          </Button>

          <Button variant="outline" onClick={exportBotijao} disabled={botijao.itens.length === 0}>
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabela do Botijão */}
      <Card>
        <CardHeader>
          <CardTitle>Composição do Botijão Virtual ({stats.totalTouros} touros)</CardTitle>
        </CardHeader>
        <CardContent>
          {botijao.itens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedBulls.length > 0 ? 
                "Processando touros selecionados..." : 
                "Nenhum touro adicionado ao botijão ainda."
              }
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">NAAB</th>
                    <th className="text-left p-3">
                      <button 
                        onClick={() => handleSort("nome")}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Nome
                        {sortField === "nome" && (
                          sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button 
                        onClick={() => handleSort("empresa")}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Empresa
                        {sortField === "empresa" && (
                          sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button 
                        onClick={() => handleSort("tipo")}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Tipo
                        {sortField === "tipo" && (
                          sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">Doses</th>
                    <th className="text-left p-3">Preço</th>
                    <th className="text-left p-3">Nov</th>
                    <th className="text-left p-3">Prim</th>
                    <th className="text-left p-3">Sec</th>
                    <th className="text-left p-3">Mult</th>
                    <th className="text-left p-3">Doad</th>
                    <th className="text-left p-3">Inter</th>
                    <th className="text-left p-3">Recep</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{item.touro.naab}</td>
                      <td className="p-3 font-medium">{item.touro.nome}</td>
                      <td className="p-3">{item.touro.empresa || "-"}</td>
                      <td className="p-3">
                        <Badge variant={item.tipo === "Sexado" ? "default" : "secondary"}>
                          {item.tipo}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold">{item.doses}</span>
                      </td>
                      <td className="p-3">
                        <span>R$ {item.preco.toFixed(2)}</span>
                      </td>
                      <td className="p-3">{item.distribuicao.Nov}</td>
                      <td className="p-3">{item.distribuicao.Prim}</td>
                      <td className="p-3">{item.distribuicao.Secund}</td>
                      <td className="p-3">{item.distribuicao.Mult}</td>
                      <td className="p-3">{item.distribuicao.Doadoras}</td>
                      <td className="p-3">{item.distribuicao.Intermediarias}</td>
                      <td className="p-3">{item.distribuicao.Receptoras}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingItem(item)}
                            className="text-blue-600"
                            title="Editar touro"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateItem(item)}
                            className="text-green-600"
                            title="Duplicar touro"
                          >
                            <Plus size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600"
                            title="Remover touro"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Editar Touro - Corrigido */}
      <Dialog open={editingItem !== null} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Touro no Botijão</DialogTitle>
          </DialogHeader>
          {editingItemData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={editingItemData.tipo} 
                    onValueChange={(value: "Convencional" | "Sexado") => 
                      setEditingItemData(prev => prev ? { ...prev, tipo: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Convencional">Convencional</SelectItem>
                      <SelectItem value="Sexado">Sexado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Doses</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingItemData.doses}
                    onChange={(e) => setEditingItemData(prev => prev ? { 
                      ...prev, 
                      doses: parseInt(e.target.value) || 1 
                    } : null)}
                  />
                </div>

                <div>
                  <Label>Preço por Dose (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItemData.preco}
                    onChange={(e) => setEditingItemData(prev => prev ? { 
                      ...prev, 
                      preco: parseFloat(e.target.value) || 0 
                    } : null)}
                  />
                </div>
              </div>

              <div>
                <Label>Distribuição por Categoria de Idade</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {["Nov", "Prim", "Secund", "Mult"].map(cat => (
                    <div key={cat}>
                      <Label className="text-xs">{cat}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingItemData.distribuicao[cat as keyof typeof editingItemData.distribuicao]}
                        onChange={(e) => setEditingItemData(prev => prev ? {
                          ...prev,
                          distribuicao: {
                            ...prev.distribuicao,
                            [cat]: parseInt(e.target.value) || 0
                          }
                        } : null)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Distribuição por Segmentação</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["Doadoras", "Intermediarias", "Receptoras"].map(seg => (
                    <div key={seg}>
                      <Label className="text-xs">{seg}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingItemData.distribuicao[seg as keyof typeof editingItemData.distribuicao]}
                        onChange={(e) => setEditingItemData(prev => prev ? {
                          ...prev,
                          distribuicao: {
                            ...prev.distribuicao,
                            [seg]: parseInt(e.target.value) || 0
                          }
                        } : null)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Input
                  value={editingItemData.observacoes || ""}
                  onChange={(e) => setEditingItemData(prev => prev ? { 
                    ...prev, 
                    observacoes: e.target.value 
                  } : null)}
                  placeholder="Observações sobre este touro..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEditing}>
                  Cancelar
                </Button>
                <Button onClick={saveEditing}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Atualização de Estoque */}
      <Dialog open={showStockUpdateDialog} onOpenChange={setShowStockUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Estoque - Uso de Doses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Touro</Label>
              <Select 
                value={newUpdate.touroId || ""} 
                onValueChange={(value) => setNewUpdate(prev => ({ ...prev, touroId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o touro" />
                </SelectTrigger>
                <SelectContent>
                  {botijao.itens.filter(item => item.doses > 0).map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.touro.naab} - {item.touro.nome} ({item.doses} doses disponíveis)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Doses Utilizadas</Label>
                <Input
                  type="number"
                  min="1"
                  value={newUpdate.dosesUsadas}
                  onChange={(e) => setNewUpdate(prev => ({ 
                    ...prev, 
                    dosesUsadas: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select 
                  value={newUpdate.categoria} 
                  onValueChange={(value) => setNewUpdate(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nov">Novilhas</SelectItem>
                    <SelectItem value="Prim">Primíparas</SelectItem>
                    <SelectItem value="Secund">Secundíparas</SelectItem>
                    <SelectItem value="Mult">Multíparas</SelectItem>
                    <SelectItem value="Doadoras">Doadoras</SelectItem>
                    <SelectItem value="Intermediarias">Intermediárias</SelectItem>
                    <SelectItem value="Receptoras">Receptoras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={newUpdate.data}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>

              <div>
                <Label>Técnico Responsável</Label>
                <Input
                  value={newUpdate.tecnico}
                  onChange={(e) => setNewUpdate(prev => ({ ...prev, tecnico: e.target.value }))}
                  placeholder="Nome do técnico"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStockUpdateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={addStockUpdate} 
                disabled={!newUpdate.touroId || !newUpdate.tecnico}
              >
                Confirmar Uso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Nitrogênio */}
      <Dialog open={editingNitrogen !== null} onOpenChange={(open) => !open && setEditingNitrogen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro de Nitrogênio</DialogTitle>
          </DialogHeader>
          {editingNitrogen && (() => {
            const record = nitrogenRecords.find(r => r.id === editingNitrogen);
            if (!record) return null;
            
            return (
              <div className="space-y-4">
                <div>
                  <Label>Data do Abastecimento</Label>
                  <Input
                    type="date"
                    value={record.dataAbastecimento}
                    onChange={(e) => editNitrogenRecord(record.id, { 
                      dataAbastecimento: e.target.value 
                    })}
                  />
                </div>
                
                <div>
                  <Label>Volume (Litros)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={record.volume}
                    onChange={(e) => editNitrogenRecord(record.id, { 
                      volume: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Input
                    value={record.observacoes}
                    onChange={(e) => editNitrogenRecord(record.id, { 
                      observacoes: e.target.value 
                    })}
                    placeholder="Observações sobre o abastecimento..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => deleteNitrogenRecord(record.id)} 
                    className="text-red-600"
                  >
                    Excluir
                  </Button>
                  <Button variant="outline" onClick={() => setEditingNitrogen(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Histórico de Nitrogênio - Card separado */}
      {nitrogenRecords.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="text-blue-600" size={20} />
              Histórico de Abastecimento de Nitrogênio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nitrogenRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(record.dataAbastecimento).toLocaleDateString()} - {record.volume}L
                    </div>
                    {record.observacoes && (
                      <div className="text-sm text-muted-foreground">{record.observacoes}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNitrogen(record.id)}
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão para limpar todos os dados salvos */}
      {(botijao.itens.length > 0 || nitrogenRecords.length > 0) && (
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={clearAllData} 
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Limpar Todos os Dados Salvos
          </Button>
        </div>
      )}
    </div>
  );
}

export default BotijaoVirtualPage;