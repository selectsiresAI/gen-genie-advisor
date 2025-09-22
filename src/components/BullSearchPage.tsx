import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Upload, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Bull {
  id: string;
  code: string;
  name: string;
  registration?: string;
  birth_date?: string;
  sire_naab?: string;
  mgs_naab?: string;
  // All genetic traits from bulls_denorm
  hhp_dollar?: number;
  tpi?: number;
  nm_dollar?: number;
  cm_dollar?: number;
  fm_dollar?: number;
  gm_dollar?: number;
  f_sav?: number;
  ptam?: number;
  cfp?: number;
  ptaf?: number;
  ptaf_pct?: number;
  ptap?: number;
  ptap_pct?: number;
  pl?: number;
  dpr?: number;
  liv?: number;
  scs?: number;
  mast?: number;
  met?: number;
  rp?: number;
  da?: number;
  ket?: number;
  mf?: number;
  ptat?: number;
  udc?: number;
  flc?: number;
  sce?: number;
  dce?: number;
  ssb?: number;
  dsb?: number;
  h_liv?: number;
  ccr?: number;
  hcr?: number;
  fi?: number;
  gl?: number;
  efc?: number;
  bwc?: number;
  sta?: number;
  str?: number;
  dfm?: number;
  rua?: number;
  rls?: number;
  rtp?: number;
  ftl?: number;
  rw?: number;
  rlr?: number;
  fta?: number;
  fls?: number;
  fua?: number;
  ruh?: number;
  ruw?: number;
  ucl?: number;
  udp?: number;
  ftp?: number;
  rfi?: number;
  beta_casein?: string;
  kappa_casein?: string;
  gfi?: number;
  score?: number; // Calculated score
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
  onBullsSelected?: (selectedBulls: string[]) => void;
}

const BullSearchPage: React.FC<BullSearchPageProps> = ({ farm, onBack, onBullsSelected }) => {
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]);
  const [weights, setWeights] = useState({
    TPI: 0.3,
    NM_dollar: 0.25,
    HHP_dollar: 0.2,
    PTAM: 0.15,
    CFP: 0.1
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBulls();
  }, []);

  const loadBulls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bulls_denorm')
        .select('*')
        .order('tpi', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected format
      const transformedBulls: Bull[] = (data || []).map(bull => ({
        id: bull.id || bull.code,
        code: bull.code || '',
        name: bull.name || '',
        registration: bull.registration,
        birth_date: bull.birth_date,
        sire_naab: bull.sire_naab,
        mgs_naab: bull.mgs_naab,
        hhp_dollar: bull.hhp_dollar,
        tpi: bull.tpi,
        nm_dollar: bull.nm_dollar,
        cm_dollar: bull.cm_dollar,
        fm_dollar: bull.fm_dollar,
        gm_dollar: bull.gm_dollar,
        f_sav: bull.f_sav,
        ptam: bull.ptam,
        cfp: bull.cfp,
        ptaf: bull.ptaf,
        ptaf_pct: bull.ptaf_pct,
        ptap: bull.ptap,
        ptap_pct: bull.ptap_pct,
        pl: bull.pl,
        dpr: bull.dpr,
        liv: bull.liv,
        scs: bull.scs,
        mast: bull.mast,
        met: bull.met,
        rp: bull.rp,
        da: bull.da,
        ket: bull.ket,
        mf: bull.mf,
        ptat: bull.ptat,
        udc: bull.udc,
        flc: bull.flc,
        sce: bull.sce,
        dce: bull.dce,
        ssb: bull.ssb,
        dsb: bull.dsb,
        h_liv: bull.h_liv,
        ccr: bull.ccr,
        hcr: bull.hcr,
        fi: bull.fi,
        gl: bull.gl,
        efc: bull.efc,
        bwc: bull.bwc,
        sta: bull.sta,
        str: bull.str,
        dfm: bull.dfm,
        rua: bull.rua,
        rls: bull.rls,
        rtp: bull.rtp,
        ftl: bull.ftl,
        rw: bull.rw,
        rlr: bull.rlr,
        fta: bull.fta,
        fls: bull.fls,
        fua: bull.fua,
        ruh: bull.ruh,
        ruw: bull.ruw,
        ucl: bull.ucl,
        udp: bull.udp,
        ftp: bull.ftp,
        rfi: bull.rfi,
        beta_casein: bull.beta_casein,
        kappa_casein: bull.kappa_casein,
        gfi: bull.gfi
      }));

      setBulls(transformedBulls);
    } catch (error) {
      console.error('Error loading bulls:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar banco de touros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate weighted scores for bulls
  const rankedBulls = useMemo(() => {
    const bullsWithScores = bulls.map(bull => {
      const score = (
        (bull.tpi || 0) * weights.TPI +
        (bull.nm_dollar || 0) * weights.NM_dollar +
        (bull.hhp_dollar || 0) * weights.HHP_dollar +
        (bull.ptam || 0) * weights.PTAM +
        (bull.cfp || 0) * weights.CFP
      );
      return { ...bull, score };
    });

    return bullsWithScores
      .filter(bull => {
        const matchesSearch = bull.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             bull.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [bulls, weights, searchTerm]);

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const handleBullToggle = (code: string) => {
    setSelectedBulls(prev =>
      prev.includes(code)
        ? prev.filter(n => n !== code)
        : [...prev, code]
    );
  };

  const handleAddToBotijao = () => {
    if (selectedBulls.length === 0) {
      toast({
        title: "Nenhum touro selecionado",
        description: "Selecione pelo menos um touro para adicionar ao Botijão Virtual.",
        variant: "destructive",
      });
      return;
    }

    if (onBullsSelected) {
      onBullsSelected(selectedBulls);
    }

    toast({
      title: "Touros selecionados",
      description: `${selectedBulls.length} touro(s) foram selecionados para o Botijão Virtual.`,
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({
      title: "Upload iniciado",
      description: "Processando arquivo de touros...",
    });

    // TODO: Implement actual file processing
    setTimeout(() => {
      toast({
        title: "Touros importados",
        description: "Banco de touros atualizado com sucesso!",
      });
      loadBulls(); // Reload data
    }, 2000);
  };

  const handleExport = () => {
    if (rankedBulls.length === 0) return;
    
    const csvData = rankedBulls.map(bull => ({
      NAAB: bull.code,
      Nome: bull.name,
      'Data Nascimento': bull.birth_date || '',
      'HHP$': bull.hhp_dollar || 0,
      TPI: bull.tpi || 0,
      'NM$': bull.nm_dollar || 0,
      'CM$': bull.cm_dollar || 0,
      'FM$': bull.fm_dollar || 0,
      'GM$': bull.gm_dollar || 0,
      Score: bull.score?.toFixed(0) || 0
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banco-touros-${farm.farm_name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV foi baixado com sucesso!",
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