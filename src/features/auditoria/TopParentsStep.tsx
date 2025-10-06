import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';

type Props = { farmId: string };

type ParentRow = {
  label: string;
  count: number;
};

const ageOpts = [
  'ALL',
  'Bezerra',
  'Novilha',
  'Primípara',
  'Secundípara',
  'Multípara',
] as const;
const segOpts = ['ALL', 'Superior', 'Intermediário', 'Inferior'] as const;

export default function TopParentsStep({ farmId }: Props) {
  const [age, setAge] = useState<(typeof ageOpts)[number]>('ALL');
  const [seg, setSeg] = useState<(typeof segOpts)[number]>('ALL');
  const [topN, setTopN] = useState(20);
  const [sires, setSires] = useState<ParentRow[]>([]);
  const [mgs, setMgs] = useState<ParentRow[]>([]);

  const load = useCallback(
    async (kind: 'sire' | 'mgs') => {
      const { data, error } = await (supabase.rpc as any)('ag_top_parents', {
        p_farm: farmId,
        p_group_by: kind,
        p_min_birth_year: null,
        p_max_birth_year: null,
        p_top_n: topN,
        p_age_filter: age,
        p_segment: seg,
      });
      if (error) throw error;
      return (data ?? []) as ParentRow[];
    },
    [age, farmId, seg, topN],
  );

  useEffect(() => {
    (async () => {
      setSires(await load('sire'));
      setMgs(await load('mgs'));
    })();
  }, [load]);

  const barTitle = useMemo(() => `Top ${topN}`, [topN]);

  const BarBlock = ({ title, rows }: { title: string; rows: ParentRow[] }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={520}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="label" width={260} />
            <Tooltip />
            <Bar dataKey="count" fill="#444">
              <LabelList dataKey="count" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={age} onValueChange={(v: any) => setAge(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {ageOpts.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={seg} onValueChange={(v: any) => setSeg(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            {segOpts.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(topN)} onValueChange={(v: any) => setTopN(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Top N" />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>{`Top ${n}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BarBlock title={`${barTitle} Sires`} rows={sires} />
        <BarBlock title={`${barTitle} Maternal Grandsires`} rows={mgs} />
      </div>
    </div>
  );
}
