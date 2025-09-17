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
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  DPR: number;
  SCS: number;
  PTAT: number;
  year: number;
  _percentil?: number | null;
  _grupo?: "Doadoras" | "Bom" | "Receptoras";
  _motivo?: string;
};

type Weights = { 
  TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; 
};

type PrimaryIndex = "TPI" | "NM$" | "HHP$" | "Custom";

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
  Bom: "hsl(var(--accent))", // Green  
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

// Segmentation functions (duplicated to avoid import issues)
function normalize(value: number, mean: number, sd: number) {
  return (value - mean) / (sd || 1);
}

function scoreAnimal(a: { TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; }, stats: any, w: Weights) {
  const zTPI = normalize(a.TPI, stats.TPI.mean, stats.TPI.sd);
  const zNM  = normalize(a["NM$"], stats.NM.mean, stats.NM.sd);
  const zMilk= normalize(a.Milk, stats.Milk.mean, stats.Milk.sd);
  const zFat = normalize(a.Fat,  stats.Fat.mean, stats.Fat.sd);
  const zProt= normalize(a.Protein, stats.Protein.mean, stats.Protein.sd);
  const zSCS = normalize(a.SCS,  stats.SCS.mean, stats.SCS.sd);
  const zPTAT= normalize(a.PTAT, stats.PTAT.mean, stats.PTAT.sd);
  return (
    w.TPI * zTPI +
    w["NM$"] * zNM +
    w.Milk * zMilk +
    w.Fat * zFat +
    w.Protein * zProt +
    w.PTAT * zPTAT -
    w.SCS * zSCS
  );
}

function getPrimaryValue(f: Female, primary: PrimaryIndex, statsForCustom: any, weights: Weights): number | null {
  if (primary === "TPI") return Number(f.TPI ?? null);
  if (primary === "NM$") return Number(f["NM$"] ?? null);
  if (primary === "HHP$") return Number(f["NM$"] ?? null); // Using NM$ as HHP$ placeholder
  if (primary === "Custom") {
    try {
      const base = { TPI: f.TPI, ["NM$"]: f["NM$"], Milk: f.Milk, Fat: f.Fat, Protein: f.Protein, SCS: f.SCS, PTAT: f.PTAT };
      return scoreAnimal(base, statsForCustom, weights);
    } catch { return null; }
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
  weights: Weights
): Female[] {
  const base: Array<{ id: string; v: number }> = [];
  females.forEach((f) => {
    const v = getPrimaryValue(f, cfg.primaryIndex, statsForCustom, weights);
    if (v === null || Number.isNaN(v)) return;
    base.push({ id: f.id, v: Number(v) });
  });
  const pct = computePercentiles(base);

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
      return { ...f, _percentil: p, _grupo: "Bom", _motivo: "Top, saúde insuficiente" };
    }

    if (p !== null && p <= cfg.goodCutoffUpper) {
      return { ...f, _percentil: p, _grupo: "Bom", _motivo: "Faixa intermediária" };
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

  const segmentedFemales = useMemo(() => {
    return segmentAnimals(farm.females, config, statsForCustom, customWeights);
  }, [farm.females, config, statsForCustom, customWeights]);

  const groupStats = useMemo(() => {
    const stats = { Doadoras: 0, Bom: 0, Receptoras: 0 };
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
            Segmentação por literatura (Doadoras / Bom / Receptoras)
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
                Padrão: {config.donorCutoffPercent}% doadoras / {100 - config.goodCutoffUpper}% receptoras (restante = Bom).
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
            {/* Selecionar PTAs */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selecionar PTAs (grupo)</h3>
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
                      className="w-4 h-4"
                    />
                    <Label htmlFor={trait.key} className={trait.color}>
                      {trait.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Se nenhum traço for marcado, será usado HHP$.
              </div>
            </div>

            {/* Pesos do Índice - Mantendo os pesos das características selecionadas */}
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
          </div>
        </CardContent>
      </Card>

      {/* Resultado com gráficos melhorados */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Distribuição do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={groupStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percentage}) => `${name} ${percentage}%`}
                  labelLine={false}
                >
                  {groupStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-3">
              {groupStats.map((stat) => (
                <div key={stat.name} className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: `${COLORS[stat.name as keyof typeof COLORS]}15`}}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{backgroundColor: COLORS[stat.name as keyof typeof COLORS]}}
                    />
                    <span className="font-medium">{stat.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{stat.value} animais ({stat.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise Comparativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {groupStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Recomendações:</strong>
              </div>
              <div className="text-sm space-y-1">
                <div>• Doadoras: Animais de elite para transferência de embriões</div>
                <div>• Bom: Animais para reprodução natural premium</div>
                <div>• Receptoras: Animais adequados para receber embriões</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela completa de todos os animais */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Completa do Rebanho Segmentado</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por brinco, pai, NAAB ou segmento"
                className="pl-10"
              />
              <div className="absolute left-3 top-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="21 21l-4.35-4.35"/>
                </svg>
              </div>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Aplicar segmentação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-full w-full">
              <thead>
                <tr className="border-b bg-black text-white">
                  <th className="px-3 py-3 text-left font-medium">Segmento</th>
                  <th className="px-3 py-3 text-left font-medium">Brinco</th>
                  <th className="px-3 py-3 text-left font-medium">Nascimento</th>
                  <th className="px-3 py-3 text-left font-medium">NAAB do Pai</th>
                  <th className="px-3 py-3 text-left font-medium">Nome do Pai</th>
                  <th className="px-3 py-3 text-left font-medium">HHP$</th>
                  <th className="px-3 py-3 text-left font-medium cursor-pointer">
                    TPI ▼
                  </th>
                  <th className="px-3 py-3 text-left font-medium">NM$</th>
                  <th className="px-3 py-3 text-left font-medium">Leite (lbs)</th>
                  <th className="px-3 py-3 text-left font-medium">Gordura (lbs)</th>
                  <th className="px-3 py-3 text-left font-medium">Proteína (lbs)</th>
                </tr>
              </thead>
              <tbody>
                {segmentedFemales
                  .sort((a, b) => {
                    // Ordenar por grupo: Doadoras primeiro, depois Bom, depois Receptoras
                    const groupOrder = { "Doadoras": 1, "Bom": 2, "Receptoras": 3 };
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
                        const groupOrder = { "Doadoras": 1, "Bom": 2, "Receptoras": 3 };
                        const aOrder = groupOrder[a._grupo as keyof typeof groupOrder] || 4;
                        const bOrder = groupOrder[b._grupo as keyof typeof groupOrder] || 4;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        return b.TPI - a.TPI;
                      })
                      .slice(0, index + 1)
                      .filter(animal => animal._grupo === "Doadoras").length;
                    
                    const segmentLabel = f._grupo === "Doadoras" ? `Doadora #${doadorasCount}` : f._grupo || "—";
                    
                    return (
                      <tr key={f.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            f._grupo === "Doadoras" ? "bg-accent text-accent-foreground" :
                            f._grupo === "Bom" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {segmentLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">{f.brinco}</td>
                        <td className="px-3 py-2">{new Date(f.nascimento).toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2">{f.naabPai}</td>
                        <td className="px-3 py-2 text-red-600 font-medium">{f.nomePai}</td>
                        <td className="px-3 py-2">—</td>
                        <td className="px-3 py-2 font-semibold">{f.TPI}</td>
                        <td className="px-3 py-2 font-semibold">{f["NM$"]}</td>
                        <td className="px-3 py-2">{f.Milk}</td>
                        <td className="px-3 py-2">{f.Fat}</td>
                        <td className="px-3 py-2">{f.Protein}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Total: {segmentedFemales.length} animais
          </div>
        </CardContent>
      </Card>
    </div>
  );
}