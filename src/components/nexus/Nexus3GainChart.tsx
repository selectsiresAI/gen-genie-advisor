/* src/components/nexus/Nexus3GainChart.tsx
 * Gráfico "Mães vs. Filhas" da Nexus 3, com os touros, o espaço de ganho e o ganho por ano.
 * A conta não muda: filha = (mãe + média dos touros) / 2. Só a forma de mostrar.
 */
import React from "react";

export interface GainBull {
  id: string;
  name: string;
  value: number; // PTA do touro nesta característica
  percent: number; // % de uso
}

export interface GainRow {
  year: number;
  mothers: number;
  daughters: number;
}

interface Props {
  traitLabel: string;
  rows: GainRow[]; // ordenado por ano, só anos com mãe
  bullsAvg: number | null; // null = nenhum touro selecionado
  bulls: GainBull[]; // todos os touros com valor nesta característica
  fmt: (v: number) => string;
  isEn: boolean;
  isEs: boolean;
}

const MOTHER = "#ED1C24";
const DAUGHTER = "#111827";
const BULL = "#7B8798";
const AREA = "rgba(237,28,36,0.14)";
const MUTED = "#6B7280";
const GRID = "#E5E7EB";
export const MAX_BULL_LINES = 8;

const W = 900;
const L = 56;
const R = 150;
const TOP = 22;
const B = 34;

const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) * (r1 - r0)) / (d1 - d0);

export const signed = (n: number, fmt: (v: number) => string) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;

/** Posições dos rótulos à direita (um por touro), sem sobreposição: mínimo de 12 de distância. */
export function stackLabels(ys: number[], minGap = 12): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const out = new Array<number>(ys.length);
  let last = -Infinity;
  for (const { y, i } of order) {
    const pos = Math.max(y + 4, last + minGap);
    out[i] = pos;
    last = pos;
  }
  return out;
}

/** Touros desenhados no gráfico: até 8, os de maior uso (empate: maior valor). */
export function bullsForLines(bulls: GainBull[]): GainBull[] {
  return bulls
    .filter((b) => b.percent > 0 && Number.isFinite(b.value))
    .slice()
    .sort((a, b) => b.percent - a.percent || b.value - a.value)
    .slice(0, MAX_BULL_LINES);
}

export default function Nexus3GainChart({ traitLabel, rows, bullsAvg, bulls, fmt, isEn, isEs }: Props) {
  const tx = (pt: string, en: string, es: string) => (isEs ? es : isEn ? en : pt);
  if (!rows.length) return null;

  const hasBulls = bullsAvg != null && bulls.some((b) => b.percent > 0);
  const years = rows.map((r) => r.year);
  const mothers = rows.map((r) => r.mothers);
  const daughters = rows.map((r) => r.daughters);
  const gains = rows.map((r) => r.daughters - r.mothers);
  const lines = hasBulls ? bullsForLines(bulls) : [];

  // ---- painel principal ----
  const H = hasBulls ? 330 : 250;
  const all = [...mothers, ...(hasBulls ? [...daughters, bullsAvg as number, ...lines.map((b) => b.value)] : [])];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || Math.max(Math.abs(hi) * 0.02, 1);
  const ylo = lo - span * 0.12;
  const yhi = hi + span * 0.14;
  const x = scale(0, Math.max(years.length - 1, 1), L + 20, W - R - 16);
  const xAt = (i: number) => (years.length === 1 ? (L + W - R) / 2 : x(i));
  const y = scale(ylo, yhi, H - B, TOP);
  const gridVals = [0, 1, 2, 3].map((i) => ylo + ((yhi - ylo) * i) / 3);
  const right = W - R;

  const polyDaughters = years.map((_, i) => `${xAt(i)},${y(daughters[i])}`);
  const polyMothers = years.map((_, i) => `${xAt(years.length - 1 - i)},${y(mothers[years.length - 1 - i])}`);
  const labelYs = stackLabels(lines.map((b) => y(b.value)));

  const dotLabel = (i: number, v: number, color: string, above: boolean) => (
    <text key={`${color}${i}`} x={xAt(i)} y={y(v) + (above ? -9 : 15)} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={color}>
      {fmt(v)}
    </text>
  );

  // ---- painel do ganho (escala própria, a partir do zero) ----
  const GH = 128;
  const gTop = 26;
  const gBottom = 22;
  const gMax = Math.max(0, ...gains) * 1.25 || 1;
  const gMin = Math.min(0, ...gains) * 1.25;
  const gy = scale(gMin, gMax, GH - gBottom, gTop);
  const maxAbs = Math.max(...gains.map(Math.abs), 1e-9);
  const bw = Math.min(34, ((right - L - 32) / years.length) * 0.6);

  const last = rows.length - 1;
  const lastGain = gains[last];
  const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
  const showPct = Math.abs(mothers[last]) >= 100;
  const wsum = bulls.reduce((a, b) => a + (b.percent || 0), 0);
  const tableBulls = bulls.filter((b) => b.percent > 0).slice().sort((a, b) => b.value - a.value);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: MOTHER }} />{tx("Mães", "Dams", "Madres")}</span>
        {hasBulls && <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: DAUGHTER }} />{tx("Filhas (predição)", "Daughters (prediction)", "Hijas (predicción)")}</span>}
        {hasBulls && <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: BULL }} />{tx("Touros", "Sires", "Toros")}</span>}
        {hasBulls && <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: AREA, border: "1px solid #f3b3b6" }} />{tx("Ganho", "Gain", "Ganancia")}</span>}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={tx("Gráfico de mães e filhas por ano de nascimento", "Dams and daughters by birth year chart", "Gráfico de madres e hijas por año de nacimiento")}>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={L} x2={right} y1={y(v)} y2={y(v)} stroke={GRID} strokeDasharray="3 3" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill={MUTED}>{fmt(v)}</text>
          </g>
        ))}
        {years.map((yr, i) => (
          <text key={yr} x={xAt(i)} y={H - 12} textAnchor="middle" fontSize={11.5} fill={MUTED}>{yr}</text>
        ))}

        {hasBulls && years.length > 1 && <polygon points={[...polyDaughters, ...polyMothers].join(" ")} fill={AREA} />}

        {lines.map((b, i) => (
          <g key={b.id}>
            <line x1={L} x2={right} y1={y(b.value)} y2={y(b.value)} stroke={BULL} strokeWidth={1} strokeDasharray="2 4" opacity={0.85} />
            <text x={right + 6} y={labelYs[i]} fontSize={10.5} fill={MUTED}>{`${b.name.length > 14 ? `${b.name.slice(0, 13)}…` : b.name} ${fmt(b.value)}`}</text>
          </g>
        ))}
        {hasBulls && (
          <g>
            <line x1={L} x2={right} y1={y(bullsAvg as number)} y2={y(bullsAvg as number)} stroke={BULL} strokeWidth={1.9} strokeDasharray="6 3" />
            <text x={L + 6} y={y(bullsAvg as number) - 7} fontSize={11.5} fontWeight={700} fill={MUTED}>
              {tx("Média dos touros", "Sires average", "Promedio de toros")} {fmt(bullsAvg as number)}
            </text>
          </g>
        )}

        <polyline points={years.map((_, i) => `${xAt(i)},${y(mothers[i])}`).join(" ")} fill="none" stroke={MOTHER} strokeWidth={2.2} strokeLinejoin="round" />
        {hasBulls && <polyline points={polyDaughters.join(" ")} fill="none" stroke={DAUGHTER} strokeWidth={2.2} strokeLinejoin="round" />}
        {years.map((_, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={y(mothers[i])} r={3.6} fill={MOTHER} />
            {hasBulls && <circle cx={xAt(i)} cy={y(daughters[i])} r={3.6} fill={DAUGHTER} />}
            {dotLabel(i, mothers[i], MOTHER, !hasBulls || gains[i] < 0)}
            {hasBulls && dotLabel(i, daughters[i], DAUGHTER, gains[i] >= 0)}
          </g>
        ))}
        {hasBulls && gains.map((g, i) => {
          const cy = (y(mothers[i]) + y(daughters[i])) / 2;
          const text = signed(g, fmt);
          const w = Math.max(40, text.length * 7.2 + 14);
          return (
            <g key={`g${i}`}>
              <rect x={xAt(i) - w / 2} y={cy - 9} width={w} height={18} rx={9} fill="#fff" stroke={MOTHER} />
              <text x={xAt(i)} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={MOTHER}>{text}</text>
            </g>
          );
        })}
      </svg>

      {!hasBulls && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {tx(
            "Selecione touros para ver a predição das filhas, o ganho e a comparação com os touros.",
            "Select sires to see the daughters' prediction, the gain and the comparison with the sires.",
            "Seleccione toros para ver la predicción de las hijas, la ganancia y la comparación con los toros."
          )}
        </div>
      )}

      {hasBulls && (
        <>
          <svg viewBox={`0 0 ${W} ${GH}`} className="block h-auto w-full" role="img" aria-label={tx("Ganho esperado por ano de nascimento", "Expected gain by birth year", "Ganancia esperada por año de nacimiento")}>
            <text x={L} y={13} fontSize={11.5} fontWeight={700} fill={MUTED}>
              {tx(`Ganho esperado da filha sobre a mãe (${traitLabel})`, `Expected gain of the daughter over the dam (${traitLabel})`, `Ganancia esperada de la hija sobre la madre (${traitLabel})`)}
            </text>
            <line x1={L} x2={right} y1={gy(0)} y2={gy(0)} stroke={GRID} />
            {gains.map((g, i) => {
              const top = Math.min(gy(g), gy(0));
              return (
                <g key={i}>
                  <rect x={xAt(i) - bw / 2} y={top} width={bw} height={Math.max(Math.abs(gy(0) - gy(g)), 1)} rx={4} fill={MOTHER} opacity={0.35 + (0.65 * Math.abs(g)) / maxAbs} />
                  <text x={xAt(i)} y={g >= 0 ? top - 5 : top + Math.abs(gy(0) - gy(g)) + 13} textAnchor="middle" fontSize={11} fontWeight={700} fill="#111827">{signed(g, fmt)}</text>
                  <text x={xAt(i)} y={GH - 10} textAnchor="middle" fontSize={11} fill={MUTED}>{years[i]}</text>
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <b className="block text-lg font-bold leading-tight text-emerald-700 tabular-nums">{signed(lastGain, fmt)}</b>
              <span className="text-[11px] leading-tight text-gray-500">
                {tx(`Ganho, mães de ${years[last]}`, `Gain, ${years[last]} dams`, `Ganancia, madres de ${years[last]}`)}
                {showPct ? ` (${((100 * lastGain) / mothers[last]).toFixed(1).replace(".", isEn ? "." : ",")}%)` : ""}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <b className="block text-lg font-bold leading-tight text-gray-900 tabular-nums">{fmt(Math.abs((bullsAvg as number) - daughters[last]))}</b>
              <span className="text-[11px] leading-tight text-gray-500">
                {(bullsAvg as number) >= daughters[last]
                  ? tx("Falta até a média dos touros", "Gap to the sires average", "Falta hasta el promedio de toros")
                  : tx("Filha já acima da média dos touros", "Daughter already above the sires average", "Hija ya por encima del promedio de toros")}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <b className="block text-lg font-bold leading-tight text-gray-900 tabular-nums">{signed(avgGain, fmt)}</b>
              <span className="text-[11px] leading-tight text-gray-500">{tx(`Ganho médio ${years[0]} a ${years[last]}`, `Average gain ${years[0]} to ${years[last]}`, `Ganancia media ${years[0]} a ${years[last]}`)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] tabular-nums">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-wide text-gray-500">
                  <th className="border-b border-gray-200 px-2 py-1.5 text-left">{tx("Touro (uso)", "Sire (use)", "Toro (uso)")}</th>
                  <th className="border-b border-gray-200 px-2 py-1.5 text-right">{traitLabel}</th>
                  <th className="border-b border-gray-200 px-2 py-1.5 text-right">{tx(`Filha ${years[last]}`, `Daughter ${years[last]}`, `Hija ${years[last]}`)}</th>
                  <th className="border-b border-gray-200 px-2 py-1.5 text-right">{tx("Ganho", "Gain", "Ganancia")}</th>
                </tr>
              </thead>
              <tbody>
                {tableBulls.map((b) => {
                  const d = (mothers[last] + b.value) / 2;
                  return (
                    <tr key={b.id}>
                      <td className="border-b border-gray-100 px-2 py-1.5 text-left">{b.name} ({Math.round(b.percent)}%)</td>
                      <td className="border-b border-gray-100 px-2 py-1.5 text-right">{fmt(b.value)}</td>
                      <td className="border-b border-gray-100 px-2 py-1.5 text-right">{fmt(d)}</td>
                      <td className="border-b border-gray-100 px-2 py-1.5 text-right">{signed(d - mothers[last], fmt)}</td>
                    </tr>
                  );
                })}
                <tr className="font-bold">
                  <td className="px-2 py-1.5 text-left">{tx("Média ponderada", "Weighted average", "Promedio ponderado")}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(bullsAvg as number)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(daughters[last])}</td>
                  <td className="px-2 py-1.5 text-right">{signed(lastGain, fmt)}</td>
                </tr>
              </tbody>
            </table>
            {wsum > 0 && bulls.filter((b) => b.percent > 0).length > MAX_BULL_LINES && (
              <p className="mt-1 text-[11px] text-gray-500">
                {tx(
                  `As linhas mostram os ${MAX_BULL_LINES} touros de maior uso; a tabela traz todos.`,
                  `The lines show the ${MAX_BULL_LINES} most-used sires; the table lists all of them.`,
                  `Las líneas muestran los ${MAX_BULL_LINES} toros de mayor uso; la tabla incluye todos.`
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
