import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeftRight, Download, PieChart as PieIcon, Settings, Filter, Layers3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Female = {
  id: string;
  brinco: string;
  nascimento: string;
  naabPai: string;
  nomePai: string;
  TPI: number;
  ["NM$"]?: number;
  NM?: number;
  Milk: number;
  Fat: number;
  Protein: number;
  DPR: number;
  SCS: number;
  PTAT: number;
  year: number;
  _percentil?: number | null;
  _grupo?: "Doadoras" | "Inter" | "Receptoras";
  _motivo?: string;
};

type Weights = { 
  TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; 
};

type PrimaryIndex = "HHP$" | "NM$" | "TPI" | "Protein" | "Custom";

type SegmentConfig = {
  primaryIndex: PrimaryIndex;
  donorCutoffPercent: number;
  goodCutoffUpper: number;
  scsMaxDonor: number;
  dprMinDonor: number;
  critical_dpr_lt: number;
  critical_scs_gt: number;
};

// Color scheme matching Select Sires branding
const COLORS = {
  Doadoras: "hsl(var(--primary))", // Red
  Inter: "hsl(var(--accent))", // Green  
  Receptoras: "hsl(var(--muted))", // Gray
};

function toCSV(rows: any[], filename = "export.csv") {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv =
    [headers.join(",")]
      .concat(rows.map((r) => headers.map((h) => String(r[h] ?? "")).join(",")))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Segmentation functions
function normalize(value: number, mean: number, sd: number) {
  return (value - mean) / (sd || 1);
}

function scoreAnimal(
  a: { TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; },
  stats: any,
  w: Weights
) {
  const zTPI  = normalize(a.TPI,      stats.TPI?.mean,   stats.TPI?.sd);
  const zNM   = normalize(a["NM$"],   (stats["NM$"]?.mean ?? stats.NM?.mean), (stats["NM$"]?.sd ?? stats.NM?.sd));
  const zMilk = normalize(a.Milk,     stats.Milk?.mean,  stats.Milk?.sd);
  const zFat  = normalize(a.Fat,      stats.Fat?.mean,   stats.Fat?.sd);
  const zProt = normalize(a.Protein,  stats.Protein?.mean, stats.Protein?.sd);
  const zSCS  = normalize(a.SCS,      stats.SCS?.mean,   stats.SCS?.sd);
  const zPTAT = normalize(a.PTAT,     stats.PTAT?.mean,  stats.PTAT?.sd);

  return (
    w.TPI    * zTPI +
    w["NM$"] * zNM  +
    w.Milk   * zMilk +
    w.Fat    * zFat +
    w.Protein* zProt +
    w.PTAT   * zPTAT -
    w.SCS    * zSCS        // SCS penaliza
  );
}

function getPrimaryValue(
  f: Female,
  primary: PrimaryIndex,
  statsForCustom: any,
  weights: Weights,
  selectedTraits?: any
): number | null {
  // Leitores robustos para NM$/NM
  const nmCandidate =
    (f as any)["HHP$"] ??            // se já existir HHP$ de verdade
    (f as any)["NM$"]  ??            // padrão com $
    (f as any).NM       ?? null;     // fallback sem $

  if (primary === "TPI")  return isFinite(Number(f.TPI)) ? Number(f.TPI) : null;
  if (primary === "NM$" || primary === "HHP$") {
    return isFinite(Number(nmCandidate)) ? Number(nmCandidate) : null;
  }
  if (primary === "Protein") {
    return isFinite(Number(f.Protein)) ? Number(f.Protein) : null;
  }
  if (primary === "Custom") {
    try {
      // Se nenhum traço for marcado em Custom, usar todos os traços por padrão
      const hasAnySelected = selectedTraits ? Object.values(selectedTraits).some(Boolean) : false;
      const effectiveWeights = hasAnySelected ? weights : {
        TPI: 1, ["NM$"]: 1, Milk: 1, Fat: 1, Protein: 1, SCS: 1, PTAT: 1
      };
      
      const base = {
        TPI: f.TPI,
        ["NM$"]: Number(nmCandidate ?? 0),
        Milk: f.Milk, Fat: f.Fat, Protein: f.Protein, SCS: f.SCS, PTAT: f.PTAT,
      };
      return scoreAnimal(base, statsForCustom || {}, effectiveWeights);
    } catch {
      return null;
    }
  }
  return null;
}

function computePercentiles(values: Array<{ id: string; v: number }>): Map<string, number> {
  const sorted = [...values].sort((a, b) => b.v - a.v);
  const n = sorted.length;
  const map = new Map<string, number>();
  sorted.forEach((item, i) => {
    const p = Math.round(((i + 1) / n) * 100);
    map.set(item.id, p);
  });
  return map;
}

function segmentAnimals(
  females: Female[],
  cfg: SegmentConfig,
  statsForCustom: any,
  weights: Weights,
  selectedTraits?: any
): Female[] {
  // 1) Tenta com índice escolhido
  const base: Array<{ id: string; v: number }> = [];
  females.forEach((f) => {
    const v = getPrimaryValue(f, cfg.primaryIndex, statsForCustom, weights, selectedTraits);
    if (v !== null && !Number.isNaN(v)) base.push({ id: f.id, v: Number(v) });
  });

  // 2) Se ficou vazio (ex.: dataset sem NM$/NM e usuário marcou HHP$),
  //    faz fallback automático para TPI (evita todo mundo cair em Receptoras)
  let pct: Map<string, number>;
  if (base.length === 0) {
    const fallbackBase: Array<{ id: string; v: number }> = [];
    females.forEach((f) => {
      if (isFinite(Number(f.TPI))) fallbackBase.push({ id: f.id, v: Number(f.TPI) });
    });
    console.warn("⚠️ Índice primário sem valores válidos. Usando fallback TPI para segmentação.");
    pct = computePercentiles(fallbackBase);
  } else {
    pct = computePercentiles(base);
  }

  return females.map((f) => {
    const p = pct.get(f.id) ?? null;
    const crit = (f.DPR ?? 0) < cfg.critical_dpr_lt || (f.SCS ?? 0) > cfg.critical_scs_gt;
    if (crit) {
      return { ...f, _percentil: p, _grupo: "Receptoras", _motivo: "Crítico: DPR/SCS" };
    }

    if (p !== null && p <= cfg.donorCutoffPercent) {
      const okSCS = (f.SCS ?? 99) <= cfg.scsMaxDonor;
      const okDPR = (f.DPR ?? -99) >= cfg.dprMinDonor;
      if (okSCS && okDPR) {
        return { ...f, _percentil: p, _grupo: "Doadoras", _motivo: "Top + saúde OK" };
      }
      return { ...f, _percentil: p, _grupo: "Inter", _motivo: "Top, saúde insuficiente" };
    }

    if (p !== null && p <= cfg.goodCutoffUpper) {
      return { ...f, _percentil: p, _grupo: "Inter", _motivo: "Faixa intermediária" };
    }

    return { ...f, _percentil: p, _grupo: "Receptoras", _motivo: "Abaixo do limiar" };
  });
}

const defaultSegConfig: SegmentConfig = {
  primaryIndex: "HHP$",
  donorCutoffPercent: 20,
  goodCutoffUpper: 70,
  scsMaxDonor: 2.9,
  dprMinDonor: 1.0,
  critical_dpr_lt: -1.0,
  critical_scs_gt: 3.0,
};

interface SegmentationPageProps {
  farm: { id: string; nome: string; females: Female[]; bulls: any[]; };
  weights: Weights;
  statsForCustom: any;
  onBack: () => void;
}

export default function SegmentationPage({ farm, weights, statsForCustom, onBack }: SegmentationPageProps) {
  const [config, setConfig] = useState<SegmentConfig>(defaultSegConfig);
  const [customWeights, setCustomWeights] = useState<Weights>(weights);
  const [selectedTraits, setSelectedTraits] = useState({
    HHP$: true, Milk: true, Fat: true, Protein: true,
    SCS: true, PTAT: true, DPR: true
  });
  const [applyBump, setApplyBump] = useState(0);

  const segmentedFemales = useMemo(() => {
    console.log("🔍 Debugging segmentation:", {
      femalesCount: farm.females?.length || 0,
      config,
      weightsKeys: Object.keys(customWeights),
      statsKeys: Object.keys(statsForCustom || {})
    });
    
    if (!farm.females || farm.females.length === 0) {
      console.log("❌ No females data available");
      return [];
    }
    
    const result = segmentAnimals(farm.females, config, statsForCustom, customWeights, selectedTraits);
    console.log("📊 Segmentation result:", {
      totalAnimals: result.length,
      groups: result.reduce((acc, f) => {
        acc[f._grupo || 'undefined'] = (acc[f._grupo || 'undefined'] || 0) + 1;
        return acc;
      }, {} as any)
    });
    
    return result;
  }, [farm.females, config, statsForCustom, customWeights, selectedTraits, applyBump]);

  const groupStats = useMemo(() => {
    const stats = { Doadoras: 0, Inter: 0, Receptoras: 0 };
    segmentedFemales.forEach(f => {
      if (f._grupo) stats[f._grupo]++;
    });
    
    const total = segmentedFemales.length;
    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }));
  }, [segmentedFemales]);

  const handleExport = () => {
    const exportData = segmentedFemales.map(f => ({
      brinco: f.brinco,
      TPI: f.TPI,
      "NM$": f["NM$"],
      Milk: f.Milk,
      Fat: f.Fat,
      Protein: f.Protein,
      DPR: f.DPR,
      SCS: f.SCS,
      PTAT: f.PTAT,
      percentil: f._percentil,
      grupo: f._grupo,
      motivo: f._motivo
    }));
    toCSV(exportData, `segmentacao_${farm.id}.csv`);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => ({ ...prev, [trait]: !prev[trait as keyof typeof prev] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" /> Exportar Segmentação
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5" />
            Segmentação por literatura (Doadoras / Inter / Receptoras)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Índice Base */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Índice base</h3>
              <div className="space-y-3">
                {[
                  { value: "HHP$", label: "HHP$", disabled: false },
                  { value: "NM$", label: "NM$" }, 
                  { value: "TPI", label: "TPI" },
                  { value: "Protein", label: "Protein" },
                  { value: "Custom", label: "Custom" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={option.value}
                      name="primaryIndex"
                      value={option.value}
                      checked={config.primaryIndex === option.value}
                      disabled={option.disabled}
                      onChange={(e) => setConfig({...config, primaryIndex: e.target.value as PrimaryIndex})}
                      className="w-4 h-4"
                    />
                    <Label 
                      htmlFor={option.value} 
                      className={`${option.disabled ? 'text-muted-foreground' : ''} ${option.value === 'Custom' ? 'text-primary font-semibold' : ''}`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-blue-600 mt-2">
                Recomendado: HHP$ (Health & Productivity Profit) - índice holístico.
              </div>
            </div>

            {/* Cortes Percentuais */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Cortes percentuais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-600">Top % (Doadoras)</Label>
                  <Input
                    type="number"
                    value={config.donorCutoffPercent}
                    onChange={(e) => setConfig({...config, donorCutoffPercent: Number(e.target.value)})}
                    min="1" max="100"
                  />
                </div>
                <div>
                  <Label className="text-blue-600">Bottom % (Receptoras)</Label>
                  <Input
                    type="number"
                    value={100 - config.goodCutoffUpper}
                    onChange={(e) => setConfig({...config, goodCutoffUpper: 100 - Number(e.target.value)})}
                    min="1" max="100"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Padrão: {config.donorCutoffPercent}% doadoras / {100 - config.goodCutoffUpper}% receptoras (restante = Inter).
              </div>
            </div>

            {/* Gates Sanitários */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Gates sanitários e tipo</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-blue-600">SCS máx.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.scsMaxDonor}
                    onChange={(e) => setConfig({...config, scsMaxDonor: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label className="text-blue-600">DPR mín.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.dprMinDonor}
                    onChange={(e) => setConfig({...config, dprMinDonor: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label className="text-blue-600">PTAT mín.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={0}
                    disabled
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Valores padrão alinhados à boa saúde do úbere (SCS≤3,0) e fertilidade não negativa (DPR≥0).
              </div>
            </div>
          </div>

          {/* Grid inferior com 2 colunas */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {/* Selecionar PTAs - Desabilitado quando não é Custom */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selecionar PTAs (grupo)</h3>
              {config.primaryIndex !== "Custom" && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  Para editar pesos/traços, selecione Custom.
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'Milk', label: 'Milk', color: 'text-black' },
                  { key: 'Fat', label: 'Fat', color: 'text-purple-600' },
                  { key: 'Protein', label: 'Protein', color: 'text-purple-600' },
                  { key: 'SCS', label: 'SCS', color: 'text-black' },
                  { key: 'PTAT', label: 'PTAT', color: 'text-purple-600' },
                  { key: 'DPR', label: 'DPR', color: 'text-purple-600' }
                ].map((trait) => (
                  <div key={trait.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={trait.key}
                      checked={selectedTraits[trait.key as keyof typeof selectedTraits]}
                      onChange={() => toggleTrait(trait.key)}
                      disabled={config.primaryIndex !== "Custom"}
                      className="w-4 h-4"
                    />
                    <Label 
                      htmlFor={trait.key} 
                      className={`${trait.color} ${config.primaryIndex !== "Custom" ? 'text-muted-foreground' : ''}`}
                    >
                      {trait.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Se nenhum traço for marcado em Custom, usar todos os traços por padrão.
              </div>
            </div>

            {/* Pesos do Índice - Visível quando Custom é selecionado */}
            {config.primaryIndex === "Custom" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pesos do índice</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'Milk', label: 'Milk' },
                    { key: 'Fat', label: 'Fat' },
                    { key: 'Protein', label: 'Protein' },
                    { key: 'SCS', label: 'SCS' },
                    { key: 'PTAT', label: 'PTAT' }
                  ].filter(weight => selectedTraits[weight.key as keyof typeof selectedTraits]).map((weight) => (
                    <div key={weight.key} className="flex items-center justify-between gap-2">
                      <Label className="text-sm">{weight.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customWeights[weight.key as keyof Weights] || 0}
                        onChange={(e) => {
                          setCustomWeights(prev => ({...prev, [weight.key]: Number(e.target.value)}));
                        }}
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  SCS é penalizado automaticamente (sinal invertido).
                </div>
              </div>
            )}
          </div>

          {/* Botão de aplicar */}
          <div className="flex justify-center mt-8">
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setApplyBump((v) => v + 1)}
            >
              Aplicar segmentação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos e Tabela */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Distribuição da Segmentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={groupStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {groupStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Recomendações:</strong>
              </div>
              <div className="text-sm space-y-1">
                <div>• Doadoras: Animais de elite para transferência de embriões</div>
                <div>• Inter: Animais para reprodução natural premium</div>
                <div>• Receptoras: Animais adequados para receber embriões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparação por Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={groupStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Animais Segmentados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">Grupo</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Brinco</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">NAAB Pai</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Nome Pai</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">{config.primaryIndex}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">TPI</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">NM$</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Milk</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Fat</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Protein</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">DPR</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">SCS</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">PTAT</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Percentil</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {segmentedFemales
                  .sort((a, b) => {
                    // Ordenar por grupo: Doadoras primeiro, depois Inter, depois Receptoras
                    const groupOrder = { "Doadoras": 1, "Inter": 2, "Receptoras": 3 };
                    const aOrder = groupOrder[a._grupo as keyof typeof groupOrder] || 4;
                    const bOrder = groupOrder[b._grupo as keyof typeof groupOrder] || 4;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    // Dentro do mesmo grupo, ordenar por TPI descrescente
                    return b.TPI - a.TPI;
                  })
                  .map((f, index) => {
                    // Contar quantas doadoras já apareceram antes desta linha
                    const doadorasCount = segmentedFemales
                      .sort((a, b) => {
                        const groupOrder = { "Doadoras": 1, "Inter": 2, "Receptoras": 3 };
                        const aOrder = groupOrder[a._grupo as keyof typeof groupOrder] || 4;
                        const bOrder = groupOrder[b._grupo as keyof typeof groupOrder] || 4;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        return b.TPI - a.TPI;
                      })
                      .slice(0, index + 1)
                      .filter(animal => animal._grupo === "Doadoras")
                      .length;

                    const segmentLabel = f._grupo === "Doadoras" ? `D${doadorasCount}` : f._grupo;

                    return (
                      <tr key={f.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            f._grupo === "Doadoras" ? "bg-accent text-accent-foreground" :
                            f._grupo === "Inter" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {segmentLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{f.brinco}</td>
                        <td className="px-3 py-2">{f.naabPai}</td>
                        <td className="px-3 py-2 text-red-600 font-medium">{f.nomePai}</td>
                        <td className="px-3 py-2">
                          {(() => {
                            const primary = config.primaryIndex;
                            const nmCandidate = (f as any)["HHP$"] ?? (f as any)["NM$"] ?? (f as any).NM ?? null;
                            if (primary === "TPI")  return isFinite(Number(f.TPI)) ? Number(f.TPI).toFixed(0) : "—";
                            if (primary === "NM$" || primary === "HHP$")
                              return isFinite(Number(nmCandidate)) ? Number(nmCandidate).toFixed(0) : "—";
                            if (primary === "Protein") 
                              return isFinite(Number(f.Protein)) ? Number(f.Protein).toFixed(0) : "—";
                            if (primary === "Custom") {
                              const val = getPrimaryValue(f, "Custom", statsForCustom, customWeights, selectedTraits);
                              return val !== null && isFinite(Number(val)) ? Number(val).toFixed(2) : "—";
                            }
                            return "—";
                          })()}
                        </td>
                        <td className="px-3 py-2 font-semibold">{f.TPI}</td>
                        <td className="px-3 py-2 font-semibold">{f["NM$"]}</td>
                        <td className="px-3 py-2">{f.Milk}</td>
                        <td className="px-3 py-2">{f.Fat}</td>
                        <td className="px-3 py-2">{f.Protein}</td>
                        <td className="px-3 py-2">{f.DPR?.toFixed(1)}</td>
                        <td className="px-3 py-2">{f.SCS?.toFixed(2)}</td>
                        <td className="px-3 py-2">{f.PTAT?.toFixed(2)}</td>
                        <td className="px-3 py-2">{f._percentil}%</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{f._motivo}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}