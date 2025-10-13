import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calculator } from "lucide-react";
import { useHerdStore } from '@/hooks/useHerdStore';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useToast } from '@/hooks/use-toast';
import { useMothersPtaMeans } from "@/hooks/useMothersPtaMeans";

// Default PTAs to display in the table
const DEFAULT_PTAS = [
  "HHP$®", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", "CFP",
  "PTAF", "PTAF%", "PTAP", "PTAP%", "PL", "DPR", "LIV", "SCS", "MAST"
];

const METRIC_COLUMNS = [
  { key: "hhp_dollar" as const, label: "HHP$" },
  { key: "tpi" as const, label: "TPI" },
  { key: "nm_dollar" as const, label: "NM$" },
  { key: "cm_dollar" as const, label: "CM$" },
  { key: "fm_dollar" as const, label: "FM$" },
];

type MotherAverageCategory = {
  heifers: Record<string, number>;
  primiparous: Record<string, number>;
  secundiparous: Record<string, number>;
  multiparous: Record<string, number>;
};

const CATEGORY_KEY_MAP: Record<string, keyof MotherAverageCategory> = {
  novilha: "heifers",
  novilhas: "heifers",
  primipara: "primiparous",
  primiparas: "primiparous",
  secundipara: "secundiparous",
  secundiparas: "secundiparous",
  multipara: "multiparous",
  multiparas: "multiparous",
};

const normalizeCategory = (category: string) =>
  category
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

interface PTAMothersTableProps {
  selectedPTAs?: string[];
  className?: string;
}

const PTAMothersTable: React.FC<PTAMothersTableProps> = ({
  selectedPTAs: _selectedPTAs = DEFAULT_PTAS,
  className = ""
}) => {
  const { toast } = useToast();
  const { selectedHerdId } = useHerdStore();
  const setMotherAverages = usePlanStore((state) => state.setMotherAverages);
  const { rows, loading, error, refetch } = useMothersPtaMeans(selectedHerdId ?? undefined);

  useEffect(() => {
    if (!rows.length) {
      setMotherAverages({});
      return;
    }

    const motherAverages: MotherAverageCategory = {
      heifers: {},
      primiparous: {},
      secundiparous: {},
      multiparous: {},
    };

    rows.forEach((row) => {
      const normalized = normalizeCategory(row.category);
      let categoryKey = CATEGORY_KEY_MAP[normalized];
      if (!categoryKey) {
        if (normalized.startsWith("novilha")) categoryKey = "heifers";
        else if (normalized.startsWith("primipara")) categoryKey = "primiparous";
        else if (normalized.startsWith("secundipara")) categoryKey = "secundiparous";
        else if (normalized.startsWith("multipara")) categoryKey = "multiparous";
      }
      if (!categoryKey) return;

      const metrics: Array<[string, number | null | undefined]> = [
        ["HHP$®", row.hhp_dollar],
        ["HHP$", row.hhp_dollar],
        ["TPI", row.tpi],
        ["NM$", row.nm_dollar],
        ["CM$", row.cm_dollar],
        ["FM$", row.fm_dollar],
      ];

      metrics.forEach(([label, value]) => {
        if (value !== null && value !== undefined) {
          motherAverages[categoryKey][label] = value;
        }
      });
    });

    setMotherAverages(motherAverages);
  }, [rows, setMotherAverages]);

  const handleRecalculate = async () => {
    if (!selectedHerdId) {
      toast({
        title: "Nenhum rebanho selecionado",
        description: "Selecione um rebanho para recalcular as médias.",
        variant: "destructive",
      });
      return;
    }

    await refetch();
  };

  const showEmptyAlert = !selectedHerdId || (!loading && rows.length === 0 && !error);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            PTA Média das Mães (por categoria)
          </CardTitle>
          <Button
            onClick={handleRecalculate}
            disabled={loading || !selectedHerdId}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {showEmptyAlert && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              {!selectedHerdId 
                ? "Selecione um rebanho para visualizar as médias das PTAs."
                : "Nenhum dado encontrado para o rebanho selecionado."
              }
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Carregando médias das PTAs...
            </span>
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="border px-3 py-2 text-left text-sm font-medium">Categoria</th>
                  {METRIC_COLUMNS.map((column) => (
                    <th key={column.key} className="border px-3 py-2 text-right text-sm font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-b hover:bg-muted/25">
                    <td className="border px-3 py-2 font-medium">{row.category}</td>
                    {METRIC_COLUMNS.map((column) => (
                      <td key={column.key} className="border px-3 py-2 text-right">
                        {row[column.key] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!showEmptyAlert && !loading && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              Médias ponderadas por paridade. Valores arredondados para inteiros.
              {selectedHerdId && ` Rebanho: ${selectedHerdId.slice(0, 8)}...`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTAMothersTable;