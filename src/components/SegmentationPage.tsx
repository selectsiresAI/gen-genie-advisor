import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeftRight, Download, PieChart as PieIcon, Settings, Filter } from "lucide-react";
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

type PrimaryIndex = "TPI" | "NM$" | "Custom";

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
  primaryIndex: "NM$",
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
  const [selectedGroup, setSelectedGroup] = useState<"all" | "Doadoras" | "Bom" | "Receptoras">("all");
  const [search, setSearch] = useState("");

  const segmentedFemales = useMemo(() => {
    return segmentAnimals(farm.females, config, statsForCustom, weights);
  }, [farm.females, config, statsForCustom, weights]);

  const filteredFemales = useMemo(() => {
    let rows = segmentedFemales;
    
    if (selectedGroup !== "all") {
      rows = rows.filter(f => f._grupo === selectedGroup);
    }
    
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        r.brinco.includes(q) ||
        r.nomePai.toLowerCase().includes(q) ||
        r.naabPai.toLowerCase().includes(q)
      );
    }
    
    return rows;
  }, [segmentedFemales, selectedGroup, search]);

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração de Segmentação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Índice Primário</Label>
              <Select value={config.primaryIndex} onValueChange={(value: PrimaryIndex) => 
                setConfig({...config, primaryIndex: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TPI">TPI</SelectItem>
                  <SelectItem value="NM$">NM$</SelectItem>
                  <SelectItem value="Custom">Índice Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Top % para Doadoras</Label>
              <Input
                type="number"
                value={config.donorCutoffPercent}
                onChange={(e) => setConfig({...config, donorCutoffPercent: Number(e.target.value)})}
                min="1"
                max="100"
              />
            </div>

            <div>
              <Label>Limite Superior "Bom" (%)</Label>
              <Input
                type="number"
                value={config.goodCutoffUpper}
                onChange={(e) => setConfig({...config, goodCutoffUpper: Number(e.target.value)})}
                min="1"
                max="100"
              />
            </div>

            <div>
              <Label>SCS Máximo Doadoras</Label>
              <Input
                type="number"
                step="0.1"
                value={config.scsMaxDonor}
                onChange={(e) => setConfig({...config, scsMaxDonor: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>DPR Mínimo Doadoras</Label>
              <Input
                type="number"
                step="0.1"
                value={config.dprMinDonor}
                onChange={(e) => setConfig({...config, dprMinDonor: Number(e.target.value)})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Distribuição do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={groupStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percentage}) => `${name} (${percentage}%)`}
                >
                  {groupStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {groupStats.map((stat) => (
                <div key={stat.name} className="flex justify-between text-sm">
                  <span className="font-medium">{stat.name}:</span>
                  <span>{stat.value} animais ({stat.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filter Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Grupo</Label>
              <Select value={selectedGroup} onValueChange={(value: typeof selectedGroup) => setSelectedGroup(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Grupos</SelectItem>
                  <SelectItem value="Doadoras">Doadoras</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Receptoras">Receptoras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Buscar</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Brinco, NAAB pai ou nome do pai"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Mostrando {filteredFemales.length} de {segmentedFemales.length} animais
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Segmentação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-full w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Brinco</th>
                  <th className="px-3 py-2 text-left font-medium">TPI</th>
                  <th className="px-3 py-2 text-left font-medium">NM$</th>
                  <th className="px-3 py-2 text-left font-medium">DPR</th>
                  <th className="px-3 py-2 text-left font-medium">SCS</th>
                  <th className="px-3 py-2 text-left font-medium">Percentil</th>
                  <th className="px-3 py-2 text-left font-medium">Grupo</th>
                  <th className="px-3 py-2 text-left font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filteredFemales.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-muted/50">
                    <td className="px-3 py-2">{f.brinco}</td>
                    <td className="px-3 py-2 font-semibold">{f.TPI}</td>
                    <td className="px-3 py-2 font-semibold">{f["NM$"]}</td>
                    <td className="px-3 py-2">{f.DPR}</td>
                    <td className="px-3 py-2">{f.SCS.toFixed(2)}</td>
                    <td className="px-3 py-2">{f._percentil ? `${f._percentil}%` : "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        f._grupo === "Doadoras" ? "bg-primary/10 text-primary" :
                        f._grupo === "Bom" ? "bg-accent/10 text-accent-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {f._grupo}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">{f._motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}