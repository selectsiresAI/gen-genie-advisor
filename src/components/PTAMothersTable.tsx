import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calculator } from "lucide-react";
import { usePTAStore } from '@/hooks/usePTAStore';
import { useHerdStore } from '@/hooks/useHerdStore';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useToast } from '@/hooks/use-toast';
import { formatPtaValue } from '@/utils/ptaFormat';

// Default PTAs to display in the table
const DEFAULT_PTAS = [
  "HHP$®", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", "CFP", 
  "PTAF", "PTAF%", "PTAP", "PTAP%", "PL", "DPR", "LIV", "SCS", "MAST"
];

interface PTAMothersTableProps {
  selectedPTAs?: string[];
  className?: string;
}

const PTAMothersTable: React.FC<PTAMothersTableProps> = ({ 
  selectedPTAs = DEFAULT_PTAS, 
  className = "" 
}) => {
  const { toast } = useToast();
  const { selectedHerdId } = useHerdStore();
  const planStore = usePlanStore();
  const { 
    ptaMeansByCategory, 
    loading, 
    error, 
    loadPtaMeansForHerd 
  } = usePTAStore();

  const [isRecalculating, setIsRecalculating] = useState(false);

  // Load PTA means when herd changes or component mounts
  useEffect(() => {
    if (selectedHerdId && selectedPTAs.length > 0) {
      loadPtaMeansForHerd(selectedHerdId, selectedPTAs);
    }
  }, [selectedHerdId, selectedPTAs, loadPtaMeansForHerd]);

  // Sync calculated PTA means with planStore for calculations
  useEffect(() => {
    if (Object.keys(ptaMeansByCategory).length > 0) {
      // Convert our category names to planStore format
      const categoryMapping = {
        'novilha': 'heifers',
        'primipara': 'primiparous',
        'secundipara': 'secundiparous', 
        'multipara': 'multiparous'
      };

      const newMotherAverages: Record<string, Record<string, number>> = {};
      
      // Initialize categories
      Object.values(categoryMapping).forEach(categoryKey => {
        newMotherAverages[categoryKey] = {};
      });

      // Populate with calculated values
      selectedPTAs.forEach(ptaLabel => {
        if (ptaMeansByCategory[ptaLabel]) {
          Object.entries(categoryMapping).forEach(([ourCategory, planStoreCategory]) => {
            newMotherAverages[planStoreCategory][ptaLabel] = ptaMeansByCategory[ptaLabel][ourCategory as keyof typeof ptaMeansByCategory[string]] || 0;
          });
        }
      });

      // Update planStore with calculated values
      planStore.setMotherAverages(newMotherAverages);
    }
  }, [ptaMeansByCategory, selectedPTAs, planStore]);

  // Manual recalculate function
  const handleRecalculate = async () => {
    if (!selectedHerdId) {
      toast({
        title: "Nenhum rebanho selecionado",
        description: "Selecione um rebanho para recalcular as médias.",
        variant: "destructive",
      });
      return;
    }

    setIsRecalculating(true);
    try {
      await loadPtaMeansForHerd(selectedHerdId, selectedPTAs);
      toast({
        title: "Médias recalculadas",
        description: "As médias das PTAs foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao recalcular",
        description: "Erro ao carregar dados do rebanho.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  // Get value for a specific PTA and category
  const getPTAValue = (ptaLabel: string, category: string): string => {
    const value = ptaMeansByCategory[ptaLabel]?.[category as keyof typeof ptaMeansByCategory[string]] || 0;
    return formatPtaValue(ptaLabel, value);
  };

  // Show empty alert if no herd selected or all values are zero
  const showEmptyAlert = !selectedHerdId || Object.keys(ptaMeansByCategory).length === 0;

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
            disabled={loading || isRecalculating || !selectedHerdId}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || isRecalculating) ? 'animate-spin' : ''}`} />
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

        {(loading || isRecalculating) ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Carregando médias das PTAs...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="border px-3 py-2 text-left text-sm font-medium">Categoria</th>
                  {selectedPTAs.map(ptaLabel => (
                    <th key={ptaLabel} className="border px-3 py-2 text-center text-sm font-medium">
                      {ptaLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/25">
                  <td className="border px-3 py-2 font-medium text-green-700">Novilhas</td>
                  {selectedPTAs.map(ptaLabel => (
                    <td key={ptaLabel} className="border px-3 py-2 text-center">
                      {getPTAValue(ptaLabel, 'novilha')}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/25">
                  <td className="border px-3 py-2 font-medium text-purple-700">Primíparas</td>
                  {selectedPTAs.map(ptaLabel => (
                    <td key={ptaLabel} className="border px-3 py-2 text-center">
                      {getPTAValue(ptaLabel, 'primipara')}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/25">
                  <td className="border px-3 py-2 font-medium text-orange-700">Secundíparas</td>
                  {selectedPTAs.map(ptaLabel => (
                    <td key={ptaLabel} className="border px-3 py-2 text-center">
                      {getPTAValue(ptaLabel, 'secundipara')}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/25">
                  <td className="border px-3 py-2 font-medium text-red-700">Multíparas</td>
                  {selectedPTAs.map(ptaLabel => (
                    <td key={ptaLabel} className="border px-3 py-2 text-center">
                      {getPTAValue(ptaLabel, 'multipara')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {!showEmptyAlert && !loading && !isRecalculating && (
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