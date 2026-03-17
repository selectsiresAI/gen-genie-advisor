import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchFemalesDenormByFarm, FemaleDenormRow } from '@/supabase/queries/females';
import { getAutomaticCategory, FemaleCategory } from '@/utils/femaleCategories';
import { formatPtaValue } from '@/utils/ptaFormat';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Settings, BarChart3 } from 'lucide-react';

interface SegmentationSectionProps {
  farmId: string;
  farmName: string;
}

type SegmentationClass = 'donor' | 'inter' | 'recipient';

interface SegmentationParams {
  index_type?: 'HHP$' | 'TPI' | 'NM$' | 'Custom' | string;
  selected_traits?: string[];
  weights?: Record<string, number>;
  segmentation_percentages?: {
    superior?: number;
    intermediario?: number;
    inferior?: number;
  };
}

interface ClassificationStats {
  class: SegmentationClass;
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  categoryBreakdown: Record<FemaleCategory, { count: number; percentage: number }>;
  ptaAverages: Record<string, number>;
}

// PTAs configuration (same as HerdSummarySection)
const PTA_CONFIG = [
  { key: 'hhp_dollar', label: 'HHP$', inverted: false },
  { key: 'tpi', label: 'TPI', inverted: false },
  { key: 'nm_dollar', label: 'NM$', inverted: false },
  { key: 'ptam', label: 'PTAM', inverted: false },
  { key: 'cfp', label: 'CFP', inverted: false },
  { key: 'ptaf_pct', label: 'PTAF%', inverted: false },
  { key: 'ptap_pct', label: 'PTAP%', inverted: false },
  { key: 'pl', label: 'PL', inverted: false },
  { key: 'dpr', label: 'DPR', inverted: false },
  { key: 'scs', label: 'SCS', inverted: true },
  { key: 'mast', label: 'Mast', inverted: true },
  { key: 'ptat', label: 'PTAT', inverted: false },
  { key: 'udc', label: 'UDC', inverted: false },
  { key: 'flc', label: 'FLC', inverted: false },
];

const CLASS_CONFIG: Record<SegmentationClass, { label: string; color: string; bgColor: string }> = {
  donor: { label: 'Superior', color: 'hsl(142, 76%, 36%)', bgColor: 'bg-green-500' },
  inter: { label: 'Intermediário', color: 'hsl(38, 92%, 50%)', bgColor: 'bg-yellow-500' },
  recipient: { label: 'Inferior', color: 'hsl(0, 84%, 60%)', bgColor: 'bg-red-500' },
};

const CATEGORY_ORDER: FemaleCategory[] = ['Bezerra', 'Novilha', 'Primípara', 'Secundípara', 'Multípara'];

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Configuration Card Component
function SegmentationConfigCard({ params }: { params: SegmentationParams | null }) {
  if (!params) return null;

  const indexType = params.index_type || 'Não especificado';
  const isCustom = indexType === 'Custom';

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Configuração Utilizada</h3>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-muted-foreground">Índice:</span>
        <Badge variant={isCustom ? 'secondary' : 'default'} className="text-sm">
          {indexType}
        </Badge>
      </div>

      {isCustom && params.selected_traits && params.weights && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-3">Composição do Índice Customizado:</p>
          <div className="space-y-2">
            {params.selected_traits.map((trait) => {
              const weight = params.weights?.[trait] || 0;
              return (
                <div key={trait} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-medium">{trait}</span>
                  <Progress value={weight} className="flex-1 h-3" />
                  <span className="w-12 text-sm text-right text-muted-foreground">{weight}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// Group Distribution Component
function GroupDistributionCard({ stats }: { stats: ClassificationStats[] }) {
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Distribuição dos Grupos</h3>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.class} className="flex items-center gap-4">
            <span className="w-28 text-sm font-medium">{stat.label}</span>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
              <div
                className={`h-full ${stat.bgColor} transition-all duration-300`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
            <span className="w-24 text-sm text-right text-muted-foreground">
              {stat.count} ({stat.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>

      <div className="text-center mt-4 pt-4 border-t">
        <span className="text-sm text-muted-foreground">Total: </span>
        <span className="font-semibold">{total} animais</span>
      </div>
    </Card>
  );
}

// Classification Averages Table Component
function ClassificationAveragesTable({ stats }: { stats: ClassificationStats[] }) {
  return (
    <Card className="p-4 mb-6 overflow-x-auto">
      <h3 className="font-semibold text-foreground mb-4">Médias por Classificação</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium">Classificação</th>
            {PTA_CONFIG.map((pta) => (
              <th key={pta.key} className="text-center py-2 px-2 font-medium whitespace-nowrap">
                {pta.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.class} className="border-b last:border-0">
              <td className="py-2 px-2">
                <Badge 
                  variant="outline" 
                  className="font-medium"
                  style={{ borderColor: stat.color, color: stat.color }}
                >
                  {stat.label}
                </Badge>
              </td>
              {PTA_CONFIG.map((pta) => (
                <td key={pta.key} className="text-center py-2 px-2 font-mono">
                  {formatPtaValue(pta.label, stat.ptaAverages[pta.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// Category Breakdown Component
function CategoryBreakdownCard({ stats }: { stats: ClassificationStats[] }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground mb-4">Categorias por Classificação</h3>

      <div className="space-y-6">
        {stats.map((stat) => (
          <div key={stat.class}>
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="outline" 
                className="font-medium"
                style={{ borderColor: stat.color, color: stat.color }}
              >
                {stat.label}
              </Badge>
              <span className="text-sm text-muted-foreground">({stat.count} animais)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {CATEGORY_ORDER.map((category) => {
                const breakdown = stat.categoryBreakdown[category] || { count: 0, percentage: 0 };
                return (
                  <div
                    key={category}
                    className="bg-muted/50 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{category}s</p>
                    <p className="font-semibold">{breakdown.count}</p>
                    <p className="text-xs text-muted-foreground">({breakdown.percentage.toFixed(0)}%)</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// No Segmentation Message
function NoSegmentationMessage() {
  return (
    <Card className="p-8 text-center">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-warning" />
      <h3 className="font-semibold text-lg mb-2">Nenhuma Segmentação Encontrada</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Nenhuma segmentação foi salva para esta fazenda. Execute a segmentação na página 
        de Segmentação e salve os resultados para incluí-los no relatório.
      </p>
    </Card>
  );
}

export default function SegmentationSectionContent({ farmId, farmName }: SegmentationSectionProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClassificationStats[]>([]);
  const [params, setParams] = useState<SegmentationParams | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      try {
        // 1. Fetch segmentation data
        const { data: segmentations, error: segError } = await supabase
          .from('female_segmentations')
          .select('female_id, class, parameters')
          .eq('client_id', farmId);

        if (segError) throw segError;

        if (!segmentations || segmentations.length === 0) {
          setHasData(false);
          setLoading(false);
          return;
        }

        setHasData(true);

        // 2. Extract parameters from first record
        const rawParams = segmentations[0]?.parameters;
        const segParams = rawParams as SegmentationParams | null;
        setParams(segParams);

        // 3. Fetch females data
        const females = await fetchFemalesDenormByFarm(farmId);

        // 4. Build segmentation map
        const segMap = new Map<string, SegmentationClass>();
        segmentations.forEach((seg) => {
          segMap.set(seg.female_id, seg.class as SegmentationClass);
        });

        // 5. Calculate stats for each class
        const classStats: ClassificationStats[] = (['donor', 'inter', 'recipient'] as SegmentationClass[]).map((cls) => {
          const config = CLASS_CONFIG[cls];
          
          // Filter females in this class
          const classifiedFemales = females.filter((f) => segMap.get(f.id) === cls);
          const count = classifiedFemales.length;
          const total = females.filter((f) => segMap.has(f.id)).length;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          // Calculate category breakdown
          const categoryBreakdown: Record<FemaleCategory, { count: number; percentage: number }> = {} as any;
          CATEGORY_ORDER.forEach((cat) => {
            categoryBreakdown[cat] = { count: 0, percentage: 0 };
          });
          categoryBreakdown['Indefinida'] = { count: 0, percentage: 0 };

          classifiedFemales.forEach((f) => {
            const category = getAutomaticCategory(f.birth_date, f.parity_order);
            if (categoryBreakdown[category]) {
              categoryBreakdown[category].count++;
            }
          });

          // Calculate percentages
          Object.keys(categoryBreakdown).forEach((cat) => {
            const catKey = cat as FemaleCategory;
            categoryBreakdown[catKey].percentage = count > 0 
              ? (categoryBreakdown[catKey].count / count) * 100 
              : 0;
          });

          // Calculate PTA averages
          const ptaAverages: Record<string, number> = {};
          PTA_CONFIG.forEach((pta) => {
            const values = classifiedFemales
              .map((f) => (f as any)[pta.key])
              .filter((v): v is number => typeof v === 'number' && !isNaN(v));
            ptaAverages[pta.key] = calculateAverage(values);
          });

          return {
            class: cls,
            label: config.label,
            count,
            percentage,
            color: config.color,
            bgColor: config.bgColor,
            categoryBreakdown,
            ptaAverages,
          };
        });

        setStats(classStats);
      } catch (error) {
        console.error('Error loading segmentation data:', error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [farmId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando dados de segmentação...
      </div>
    );
  }

  if (!hasData) {
    return <NoSegmentationMessage />;
  }

  return (
    <div className="space-y-6">
      <SegmentationConfigCard params={params} />
      <GroupDistributionCard stats={stats} />
      <ClassificationAveragesTable stats={stats} />
      <CategoryBreakdownCard stats={stats} />
    </div>
  );
}
