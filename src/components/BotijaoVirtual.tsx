import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Search as SearchIcon, Filter, Download, Upload, Edit, Save, X, Clock, TrendingUp } from "lucide-react";
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
    setEditingItem(null);
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

      {/* Painéis de Gestão de Estoque */}
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

      {/* Distribuição por Categoria */}
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
    </div>
  );
}

export default BotijaoVirtualPage;