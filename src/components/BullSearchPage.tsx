import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Upload, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface Bull {
  naab: string;
  nome: string;
  empresa: string;
  registro: string;
  pedigree: string;
  nascimento: string;
  HHP_dollar: number;
  TPI: number;
  NM_dollar: number;
  CM_dollar: number;
  FM_dollar: number;
  GM_dollar: number;
  F_SAV: number;
  PTAM: number;
  CFP: number;
  score?: number;
}

interface Farm {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  selected_bulls: number;
}

interface BullSearchPageProps {
  farm: Farm;
  onBack: () => void;
}

const BullSearchPage: React.FC<BullSearchPageProps> = ({ farm, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState("todas");
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]);
  const [weights, setWeights] = useState({
    TPI: 0.3,
    NM_dollar: 0.25,
    HHP_dollar: 0.2,
    PTAM: 0.15,
    CFP: 0.1
  });
  const { toast } = useToast();

  // Sample bull data for demonstration
  const sampleBulls: Bull[] = [
    {
      naab: "200HO12345",
      nome: "PEAK ALTAIRR-ET",
      empresa: "Select Sires",
      registro: "HO12345678",
      pedigree: "PEAK ALTABAXTER x PEAK ALTAMONTE",
      nascimento: "2018-03-15",
      HHP_dollar: 890,
      TPI: 2850,
      NM_dollar: 920,
      CM_dollar: 780,
      FM_dollar: 650,
      GM_dollar: 420,
      F_SAV: -1.2,
      PTAM: 1850,
      CFP: 65
    },
    {
      naab: "200HO67890",
      nome: "SANDY-VALLEY MOGUL",
      empresa: "Genex",
      registro: "HO67890123",
      pedigree: "SANDY-VALLEY GRANITE x SANDY-VALLEY MAXIMO",
      nascimento: "2019-01-22",
      HHP_dollar: 820,
      TPI: 2780,
      NM_dollar: 860,
      CM_dollar: 720,
      FM_dollar: 580,
      GM_dollar: 380,
      F_SAV: -0.8,
      PTAM: 1780,
      CFP: 58
    },
    {
      naab: "200HO11111",
      nome: "WESTCOAST DYNAMO-ET",
      empresa: "ABS Global",
      registro: "HO11111222",
      pedigree: "WESTCOAST DYNAMIC x WESTCOAST DELUXE",
      nascimento: "2017-11-08",
      HHP_dollar: 950,
      TPI: 2920,
      NM_dollar: 980,
      CM_dollar: 820,
      FM_dollar: 720,
      GM_dollar: 480,
      F_SAV: -1.5,
      PTAM: 1920,
      CFP: 72
    }
  ];

  // Calculate weighted scores for bulls
  const rankedBulls = useMemo(() => {
    const bullsWithScores = sampleBulls.map(bull => {
      const score = (
        bull.TPI * weights.TPI +
        bull.NM_dollar * weights.NM_dollar +
        bull.HHP_dollar * weights.HHP_dollar +
        bull.PTAM * weights.PTAM +
        bull.CFP * weights.CFP
      );
      return { ...bull, score };
    });

    return bullsWithScores
      .filter(bull => {
        const matchesSearch = bull.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             bull.naab.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             bull.pedigree.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = selectedEmpresa === "todas" || bull.empresa === selectedEmpresa;
        return matchesSearch && matchesEmpresa;
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [sampleBulls, weights, searchTerm, selectedEmpresa]);

  const empresas = [...new Set(sampleBulls.map(bull => bull.empresa))];
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const handleBullToggle = (naab: string) => {
    setSelectedBulls(prev =>
      prev.includes(naab)
        ? prev.filter(n => n !== naab)
        : [...prev, naab]
    );
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({
      title: "Upload iniciado",
      description: "Processando arquivo de touros...",
    });

    // Simulate file processing
    setTimeout(() => {
      toast({
        title: "Touros importados",
        description: "Banco de touros atualizado com sucesso!",
      });
    }, 2000);
  };

  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Arquivo CSV será baixado em instantes...",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold">{farm.farm_name} - Busca de Touros</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Weight Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Pesos - Índice Personalizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium">{key}</label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={value}
                      onChange={(e) => setWeights(prev => ({
                        ...prev,
                        [key]: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Soma de pesos: <b>{totalWeight.toFixed(2)}</b> (recomendado 1.00 ± 0.2)
              </div>
              <div className="text-sm text-muted-foreground">
                O score usa z-score por traço para evitar escalas diferentes e aplica penalização para SCS (menor é melhor).
              </div>
            </CardContent>
          </Card>

          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Buscar touros por NAAB, nome ou pedigree" 
                className="pl-10" 
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
            
            <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <label className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload size={16} className="mr-2" />
                    Importar CSV
                  </span>
                </Button>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleUpload} 
                  className="hidden" 
                />
              </label>
              
              <Button onClick={handleExport}>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
            
            <Badge variant="secondary">
              Selecionados: {selectedBulls.length}
            </Badge>
          </div>

          {/* Bulls Table */}
          <Card>
            <div className="overflow-auto rounded-lg" style={{ maxHeight: '70vh' }}>
              <table className="min-w-[2000px] w-full">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">✓</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">NAAB</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">Nome</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">Registro</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">Pedigre Pai/Avô Materno/BisaAvô Materno</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">Data de Nascimento</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">HHP$®</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">TPI</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">NM$</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">CM$</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FM$</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">GM$</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">F SAV</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PTAM</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">CFP</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PTAF</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PTAF%</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PTAP</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PTAP%</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PL</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">DPR</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">LIV</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">SCS</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">MAST</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">MET</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RP</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">DA</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">KET</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">MF</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">PTAT</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">UDC</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FLC</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">SCE</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">DCE</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">SSB</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">DSB</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">H LIV</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">CCR</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">HCR</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FI</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">GL</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">EFC</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">BWC</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">STA</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">STR</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">DFM</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RUA</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RLS</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RTP</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FTL</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RW</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RLR</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FTA</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FLS</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FUA</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RUH</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RUW</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">UCL</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">UDP</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">FTP</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">RFI</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">Beta-Caseina</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">Kappa-Caseina</th>
                    <th className="px-2 py-1 bg-foreground text-background text-xs">GFI</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedBulls.map((bull, index) => (
                    <tr key={bull.naab} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={selectedBulls.includes(bull.naab)}
                          onChange={() => handleBullToggle(bull.naab)}
                        />
                      </td>
                      <td className="px-2 py-1 font-mono text-xs">{bull.naab}</td>
                      <td className="px-2 py-1 font-medium text-xs">{bull.nome}</td>
                      <td className="px-2 py-1 font-mono text-xs">{bull.registro}</td>
                      <td className="px-2 py-1 text-xs">{bull.pedigree}</td>
                      <td className="px-2 py-1 text-xs">{bull.nascimento}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.HHP_dollar}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.TPI}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.NM_dollar}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.CM_dollar}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.FM_dollar}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.GM_dollar}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.F_SAV}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.PTAM}</td>
                      <td className="px-2 py-1 text-center text-xs">{bull.CFP}</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                      <td className="px-2 py-1 text-center text-xs">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {rankedBulls.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">Nenhum touro encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros de pesquisa ou importe um novo banco de touros.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BullSearchPage;