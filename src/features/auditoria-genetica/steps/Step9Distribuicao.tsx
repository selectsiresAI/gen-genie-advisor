"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useAGFilters } from "../store";
import { useFemales } from "../hooks";

export default function Step9Distribuicao() {
  const { farmId, ptasSelecionadas } = useAGFilters();
  const { data: females = [] } = useFemales(farmId);
  const firstKey = ptasSelecionadas[0] ?? "tpi";

  const buckets = (() => {
    const values = females
      .map((female: any) => Number(female?.[firstKey]))
      .filter((value: number) => Number.isFinite(value));

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

    const bucketCount = 10;
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
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição — {firstKey.toUpperCase()}</CardTitle>
      </CardHeader>
      <CardContent>
        {buckets.length ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={buckets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ED1C24" opacity={0.85} name="Quantidade de Animais" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Sem dados para distribuição.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
