"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { IM5Config } from "./IM5Configurator";
import type { PlanBull } from "@/hooks/usePlanBulls";

function fmtMoney(v: number) {
  return `R$ ${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type IM5Row = {
  id: string;
  bull: string;
  im5: number;
  ret_per_preg: number;
  ret_per_dose_conv: number;
  ret_per_dose_sexed: number;
  missingPTA: boolean;
};

export function IM5Results({
  farmId,
  bulls,
  config,
  onComputed,
}: {
  farmId: string;
  bulls: PlanBull[];
  config: IM5Config | null;
  onComputed?: (rows: IM5Row[]) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<IM5Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function compute() {
    if (!config) return;
    setLoading(true);
    const out: IM5Row[] = [];

    for (const b of bulls) {
      const { data, error } = await supabase.rpc("ag_im5_bull_value", {
        p_farm_id: farmId,
        p_bull_id: b.id,
        p_traits: config.traits,
      });

      if (error) {
        console.error("Erro ao calcular IM5$", error);
      }

      const im5 = Number(data) || 0;
      const retPerPreg = im5 * (config.femaleRate ?? 0.47);
      const retPerDoseConv =
        retPerPreg * (config.conceptionRate ?? 0.35) - (b.price_conv ?? 0);
      const retPerDoseSexed =
        retPerPreg * (config.conceptionRate ?? 0.35) - (b.price_sexed ?? 0);

      const missingPTA =
        (config.traits.includes("PTA_MILK_KG") && b.pta_milk == null) ||
        (config.traits.includes("PTA_FAT_KG") && b.pta_fat == null) ||
        (config.traits.includes("PTA_PROT_KG") && b.pta_prot == null) ||
        (config.traits.includes("PL_MO") && b.pl == null) ||
        (config.traits.includes("DPR_PP") && b.dpr == null);

      out.push({
        id: b.id,
        bull: b.name,
        im5,
        ret_per_preg: retPerPreg,
        ret_per_dose_conv: retPerDoseConv,
        ret_per_dose_sexed: retPerDoseSexed,
        missingPTA,
      });
    }

    setRows(out);
    onComputed?.(out);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>IM5$ — Custo-benefício por Touro</CardTitle>
        <button
          onClick={compute}
          className="text-sm underline"
          disabled={loading || !config}
        >
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t">
                <th className="p-2 text-left">Touro</th>
                <th className="p-2 text-right">IM5$ / filha</th>
                <th className="p-2 text-right">R$ / prenhez</th>
                <th className="p-2 text-right">R$ / dose (Conv.)</th>
                <th className="p-2 text-right">R$ / dose (Sexado)</th>
                <th className="p-2 text-right">Qualidade PTA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{r.bull}</td>
                  <td className="p-2 text-right">{fmtMoney(r.im5)}</td>
                  <td className="p-2 text-right">{fmtMoney(r.ret_per_preg)}</td>
                  <td
                    className={`p-2 text-right ${
                      r.ret_per_dose_conv > 0
                        ? "text-green-700"
                        : r.ret_per_dose_conv < 0
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    {fmtMoney(r.ret_per_dose_conv)}
                  </td>
                  <td
                    className={`p-2 text-right ${
                      r.ret_per_dose_sexed > 0
                        ? "text-green-700"
                        : r.ret_per_dose_sexed < 0
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    {fmtMoney(r.ret_per_dose_sexed)}
                  </td>
                  <td className="p-2 text-right">
                    {r.missingPTA ? (
                      <span className="text-amber-700">PTA incompleta</span>
                    ) : (
                      <span className="text-green-700">OK</span>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td
                    className="p-4 text-sm text-muted-foreground"
                    colSpan={6}
                  >
                    Clique em “Calcular”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          IM5$ = Σ(ΔPTA_i × R$/unid_i). ΔPTA_i = PTA_touro − média das mães (fazenda).
          Valores nulos são tratados como 0 para não travar o cálculo.
        </div>
      </CardContent>
    </Card>
  );
}
