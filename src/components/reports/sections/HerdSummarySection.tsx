import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { fetchFemalesDenormByFarm, FemaleDenormRow } from '@/supabase/queries/females';
import { calculateCategoryCounts, getAutomaticCategory, type FemaleCategory } from '@/utils/femaleCategories';
import { formatPtaValue } from '@/utils/ptaFormat';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

// PTAs to display with their field names and labels
const PTA_CONFIG = [
  { field: 'hhp_dollar', label: 'HHP$', inverted: false },
  { field: 'tpi', label: 'TPI', inverted: false },
  { field: 'nm_dollar', label: 'NM$', inverted: false },
  { field: 'ptam', label: 'PTAM', inverted: false },
  { field: 'cfp', label: 'CFP', inverted: false },
  { field: 'ptaf_pct', label: 'PTAF%', inverted: false },
  { field: 'ptap_pct', label: 'PTAP%', inverted: false },
  { field: 'pl', label: 'PL', inverted: false },
  { field: 'dpr', label: 'DPR', inverted: false },
  { field: 'scs', label: 'SCS', inverted: true }, // Lower is better
  { field: 'mast', label: 'Mast', inverted: true }, // Lower is better
  { field: 'ptat', label: 'PTAT', inverted: false },
  { field: 'udc', label: 'UDC', inverted: false },
  { field: 'flc', label: 'FLC', inverted: false },
] as const;

type PtaField = typeof PTA_CONFIG[number]['field'];

interface HerdSummarySectionProps {
  farmId: string;
  farmName: string;
}

interface PtaStats {
  field: PtaField;
  label: string;
  average: number;
  percentile: number;
  inverted: boolean;
}

// Calculate internal percentile for a given average in the values distribution
function calculateInternalPercentile(values: number[], average: number, inverted: boolean): number {
  if (values.length === 0) return 50;
  
  // Sort based on whether lower or higher is better
  const sorted = inverted 
    ? [...values].sort((a, b) => a - b) // Lower is better
    : [...values].sort((a, b) => b - a); // Higher is better
  
  // Count how many values are "better" than the average
  const countBetterOrEqual = inverted
    ? sorted.filter(v => v <= average).length
    : sorted.filter(v => v >= average).length;
  
  return Math.round((countBetterOrEqual / sorted.length) * 100);
}

// Get color based on percentile
function getPercentileColor(percentile: number): string {
  if (percentile >= 60) return 'hsl(142, 76%, 36%)'; // Green
  if (percentile >= 40) return 'hsl(45, 93%, 47%)';  // Yellow
  return 'hsl(24, 95%, 53%)';                         // Orange
}

// Percentile explanation component
function PercentileExplanation() {
  return (
    <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">Percentil Interno:</span>{' '}
        A porcentagem indica a posição da média do rebanho em relação aos próprios animais. 
        Um valor de 70% significa que a média está entre os 30% melhores do rebanho para aquela característica.
      </p>
    </div>
  );
}

// Category count card component
function CategoryCountCard({ label, count }: { label: string; count: number }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground">{count}</p>
    </Card>
  );
}

// KPI Card with RadialBarChart
function KPICard({ stat }: { stat: PtaStats }) {
  const color = getPercentileColor(stat.percentile);
  const chartData = [{ value: stat.percentile, fill: color }];
  const formattedAvg = formatPtaValue(stat.label, stat.average);
  
  return (
    <Card className="p-3 flex flex-col items-center">
      <div className="w-20 h-20 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={8}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: 'hsl(var(--muted))' }}
              dataKey="value"
              cornerRadius={4}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{formattedAvg}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-foreground mt-1">{stat.label}</p>
    </Card>
  );
}

// Category averages table
function CategoryAveragesTable({ 
  females, 
  ptaStats 
}: { 
  females: FemaleDenormRow[]; 
  ptaStats: PtaStats[];
}) {
  // Group females by category
  const femalesByCategory = females.reduce((acc, f) => {
    const category = getAutomaticCategory(f.birth_date, f.parity_order);
    if (!acc[category]) acc[category] = [];
    acc[category].push(f);
    return acc;
  }, {} as Record<FemaleCategory, FemaleDenormRow[]>);

  const categories: FemaleCategory[] = ['Bezerra', 'Novilha', 'Primípara', 'Secundípara', 'Multípara'];

  // Calculate averages per category for each PTA
  const getAverage = (categoryFemales: FemaleDenormRow[], field: PtaField): number | null => {
    const values = categoryFemales
      .map(f => f[field as keyof FemaleDenormRow] as number | null)
      .filter((v): v is number => v !== null && !isNaN(v));
    
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Only show PTAs that have data
  const activePtas = ptaStats.slice(0, 8); // Limit for readability

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Categoria</th>
            <th className="text-center py-2 px-2 font-medium text-muted-foreground">N</th>
            {activePtas.map(pta => (
              <th key={pta.field} className="text-right py-2 px-2 font-medium text-muted-foreground">
                {pta.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(category => {
            const categoryFemales = femalesByCategory[category] || [];
            if (categoryFemales.length === 0) return null;
            
            return (
              <tr key={category} className="border-b border-border/50">
                <td className="py-2 px-2 font-medium">{category}</td>
                <td className="py-2 px-2 text-center text-muted-foreground">{categoryFemales.length}</td>
                {activePtas.map(pta => {
                  const avg = getAverage(categoryFemales, pta.field);
                  return (
                    <td key={pta.field} className="py-2 px-2 text-right">
                      {avg !== null ? formatPtaValue(pta.label, avg) : '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function HerdSummarySection({ farmId, farmName }: HerdSummarySectionProps) {
  const [females, setFemales] = useState<FemaleDenormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ptaStats, setPtaStats] = useState<PtaStats[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchFemalesDenormByFarm(farmId);
        setFemales(data);

        // Calculate PTA stats
        const stats: PtaStats[] = [];
        
        for (const pta of PTA_CONFIG) {
          const values = data
            .map(f => f[pta.field as keyof FemaleDenormRow] as number | null)
            .filter((v): v is number => v !== null && !isNaN(v));
          
          if (values.length === 0) continue;
          
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          const percentile = calculateInternalPercentile(values, average, pta.inverted);
          
          stats.push({
            field: pta.field,
            label: pta.label,
            average,
            percentile,
            inverted: pta.inverted,
          });
        }
        
        setPtaStats(stats);
      } catch (error) {
        console.error('Error loading herd data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [farmId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando dados do rebanho...
      </div>
    );
  }

  const categoryCounts = calculateCategoryCounts(females);

  return (
    <div className="space-y-6">
      {/* Section: Category Counts */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Contagem por Categoria
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <CategoryCountCard label="Total" count={categoryCounts.total} />
          <CategoryCountCard label="Bezerras" count={categoryCounts.bezerras} />
          <CategoryCountCard label="Novilhas" count={categoryCounts.novilhas} />
          <CategoryCountCard label="Primíparas" count={categoryCounts.primiparas} />
          <CategoryCountCard label="Secundíparas" count={categoryCounts.secundiparas} />
          <CategoryCountCard label="Multíparas" count={categoryCounts.multiparas} />
        </div>
      </div>

      {/* Section: KPI Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Médias Gerais do Rebanho
        </h3>
        
        <PercentileExplanation />
        
        {ptaStats.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {ptaStats.map(stat => (
              <KPICard key={stat.field} stat={stat} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Sem dados genéticos disponíveis para este rebanho.
          </p>
        )}
      </div>

      {/* Section: Category Averages Table */}
      {ptaStats.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Médias por Categoria
          </h3>
          <CategoryAveragesTable females={females} ptaStats={ptaStats} />
        </div>
      )}
    </div>
  );
}
