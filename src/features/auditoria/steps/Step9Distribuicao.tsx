"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PTA_CATALOG } from "@/lib/pta";
import { useFemales } from "../hooks";
import { useAGFilters } from "../store";

function buildBuckets(values: number[], bucketCount: number) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [
      {
        range: `${min.toFixed(1)}`,
        count: values.length,
        percentage: 100,
      },
    ];
  }
  const size = (max - min) / bucketCount;
  const result = Array.from({ length: bucketCount }, (_, index) => ({
    range: `${(min + index * size).toFixed(1)} - ${(min + (index + 1) * size).toFixed(1)}`,
    count: 0,
    percentage: 0,
  }));
  values.forEach((value) => {
    const bucketIndex = Math.min(Math.floor((value - min) / size), bucketCount - 1);
    result[bucketIndex].count++;
  });
  result.forEach((bucket) => {
    bucket.percentage = (bucket.count / values.length) * 100;
  });
  return result;
}

export default function Step9Distribuicao() {
  const { farmId, ptasSelecionadas } = useAGFilters();
  const { data: females = [] } = useFemales(farmId);
  const [bucketCount, setBucketCount] = useState(10);

  const series = useMemo(() => {
    const output: Record<string, Array<{ range: string; count: number; percentage: number }>> = {};
    ptasSelecionadas.forEach((key) => {
      const values = females
        .map((female: any) => Number(female?.[key]))
        .filter((value: number) => Number.isFinite(value));
      output[key] = buildBuckets(values, bucketCount);
    });
    return output;
  }, [ptasSelecionadas, females, bucketCount]);

  const labelOf = (key: string) => PTA_CATALOG.find((item) => item.key === key)?.label ?? key.toUpperCase();

  if (!ptasSelecionadas.length) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">Selecione ao menos uma PTA.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição — múltiplas PTAs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="text-sm">Número de classes</label>
            <input
              type="range"
              min={5}
              max={30}
              value={bucketCount}
              onChange={(event) => setBucketCount(parseInt(event.target.value, 10))}
            />
            <span className="text-sm">{bucketCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {ptasSelecionadas.map((key) => {
          const data = series[key] ?? [];
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle>Distribuição — {labelOf(key)}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ED1C24" opacity={0.85} name="Qtd de Animais" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">Sem dados.</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
