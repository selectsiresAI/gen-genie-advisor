import React, { useState, useMemo } from "react";
import { Plus, Trash2, Search as SearchIcon, Filter, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  touro: Bull;
  tipo: "Convencional" | "Sexado";
  doses: number;
  distribuicao: {
    Nov: number;
    Prim: number;
    Secund: number;
    Mult: number;
    Doadoras: number;
    Intermediarias: number;
    Receptoras: number;
  };
};

type BotijaoVirtual = {
  fazendaId: string;
  itens: BotijaoItem[];
  dataAtualizacao: string;
};

interface BotijaoVirtualPageProps {
  client: any;
  farm: any;
  bulls: Bull[];
  onBack: () => void;
}

function BotijaoVirtualPage({ client, farm, bulls, onBack }: BotijaoVirtualPageProps) {
  const [botijao, setBotijao] = useState<BotijaoVirtual>({
    fazendaId: farm.id,
    itens: [],
    dataAtualizacao: new Date().toISOString()
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("todas");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BotijaoItem>>({
    touro: undefined,
    tipo: "Convencional",
    doses: 1,
    distribuicao: {
      Nov: 0,
      Prim: 0,
      Secund: 0,
      Mult: 0,
      Doadoras: 0,
      Intermediarias: 0,
      Receptoras: 0
    }
  });

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

  const totalDoses = botijao.itens.reduce((sum, item) => sum + item.doses, 0);
  const totalTouros = botijao.itens.length;

  const addItemToBotijao = () => {
    if (!newItem.touro) return;
    
    const item: BotijaoItem = {
      touro: newItem.touro,
      tipo: newItem.tipo || "Convencional",
      doses: newItem.doses || 1,
      distribuicao: newItem.distribuicao || {
        Nov: 0, Prim: 0, Secund: 0, Mult: 0,
        Doadoras: 0, Intermediarias: 0, Receptoras: 0
      }
    };

    setBotijao(prev => ({
      ...prev,
      itens: [...prev.itens, item],
      dataAtualizacao: new Date().toISOString()
    }));

    setNewItem({
      touro: undefined,
      tipo: "Convencional",
      doses: 1,
      distribuicao: {
        Nov: 0, Prim: 0, Secund: 0, Mult: 0,
        Doadoras: 0, Intermediarias: 0, Receptoras: 0
      }
    });
    setShowAddDialog(false);
  };

  const removeItem = (index: number) => {
    setBotijao(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
      dataAtualizacao: new Date().toISOString()
    }));
  };

  const exportBotijao = () => {
    const csvData = botijao.itens.map(item => ({
      NAAB: item.touro.naab,
      Nome: item.touro.nome,
      Empresa: item.touro.empresa || "-",
      Tipo: item.tipo,
      Doses: item.doses,
      Nov: item.distribuicao.Nov,
      Prim: item.distribuicao.Prim,
      Secund: item.distribuicao.Secund,
      Mult: item.distribuicao.Mult,
      Doadoras: item.distribuicao.Doadoras,
      Intermediarias: item.distribuicao.Intermediarias,
      Receptoras: item.distribuicao.Receptoras
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
        </div>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalTouros}</div>
            <div className="text-sm text-muted-foreground">Touros no Botijão</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalDoses}</div>
            <div className="text-sm text-muted-foreground">Total de Doses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {botijao.itens.filter(i => i.tipo === "Sexado").length}
            </div>
            <div className="text-sm text-muted-foreground">Sexadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar touros por NAAB ou nome..."
            className="pl-10"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        
        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map(empresa => (
              <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Número de Doses</Label>
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

        <Button variant="outline" onClick={exportBotijao} disabled={botijao.itens.length === 0}>
          <Download size={16} className="mr-2" />
          Exportar
        </Button>
      </div>

      {/* Tabela do Botijão */}
      <Card>
        <CardHeader>
          <CardTitle>Composição do Botijão Virtual</CardTitle>
        </CardHeader>
        <CardContent>
          {botijao.itens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum touro adicionado ao botijão ainda.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">NAAB</th>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Empresa</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Doses</th>
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
                  {botijao.itens.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3">{item.touro.naab}</td>
                      <td className="p-3 font-medium">{item.touro.nome}</td>
                      <td className="p-3">{item.touro.empresa || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.tipo === "Sexado" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{item.doses}</td>
                      <td className="p-3">{item.distribuicao.Nov}</td>
                      <td className="p-3">{item.distribuicao.Prim}</td>
                      <td className="p-3">{item.distribuicao.Secund}</td>
                      <td className="p-3">{item.distribuicao.Mult}</td>
                      <td className="p-3">{item.distribuicao.Doadoras}</td>
                      <td className="p-3">{item.distribuicao.Intermediarias}</td>
                      <td className="p-3">{item.distribuicao.Receptoras}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BotijaoVirtualPage;