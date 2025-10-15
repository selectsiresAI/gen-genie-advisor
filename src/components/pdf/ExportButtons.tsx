"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { exportMultipleChartsToPDF, exportSingleChartToPDF } from "@/lib/pdf/exportCharts";
import { useChartExport } from "./ChartExportProvider";
import { format } from "date-fns";

function buildSlug(source: string) {
  return source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function SingleExportButton({
  targetRef,
  step,
  title,
  slug,
}: {
  targetRef: React.RefObject<HTMLDivElement>;
  step: number;
  title: string;
  slug?: string;
}) {
  const { orientation } = useChartExport();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const fileSlug = useMemo(() => buildSlug(slug ?? title), [slug, title]);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="pdf-ignore h-8 px-3 text-xs font-medium border-[#ED1C24] text-[#ED1C24] hover:bg-[#ED1C24]/10"
      onClick={async () => {
        if (!targetRef.current) return;
        await exportSingleChartToPDF(targetRef.current, {
          filename: `AuditoriaGenetica_Step${step}_${fileSlug}_${today}.pdf`,
          orientation,
          format: "a4",
          pageMarginMm: 8,
        });
      }}
    >
      Exportar PDF
    </Button>
  );
}

export function BatchExportBar({ step }: { step: number }) {
  const { items, selectedIds, toggle, clear, orientation, setOrientation } = useChartExport();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const listForStep = useMemo(() => items.filter((i) => i.step === step), [items, step]);
  const selectedForStep = useMemo(
    () => listForStep.filter((item) => selectedIds.has(item.id)),
    [listForStep, selectedIds]
  );

  if (listForStep.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 mb-3 rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Selecionar para PDF (Step {step}):</span>
        {listForStep.map((i) => (
          <label key={i.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.has(i.id)}
              onChange={() => toggle(i.id)}
            />
            {i.title}
          </label>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <span>Orientação:</span>
            <Button
              type="button"
              variant={orientation === "l" ? "default" : "outline"}
              className={orientation === "l" ? "bg-[#ED1C24] hover:opacity-90 text-white" : ""}
              onClick={() => setOrientation("l")}
            >
              Landscape
            </Button>
            <Button
              type="button"
              variant={orientation === "p" ? "default" : "outline"}
              className={orientation === "p" ? "bg-[#ED1C24] hover:opacity-90 text-white" : ""}
              onClick={() => setOrientation("p")}
            >
              Portrait
            </Button>
          </div>
          <Button variant="outline" onClick={clear} disabled={selectedIds.size === 0}>
            Limpar
          </Button>
          <Button
            className="bg-[#ED1C24] hover:opacity-90 text-white"
            disabled={selectedForStep.length === 0}
            onClick={async () => {
              const els = selectedForStep
                .map((item) => item.ref.current)
                .filter((node): node is HTMLDivElement => Boolean(node));

              if (!els.length) return;

              await exportMultipleChartsToPDF(els, {
                filename: `AuditoriaGenetica_Step${step}_SELECIONADOS_${today}.pdf`,
                orientation,
                format: "a4",
                pageMarginMm: 8,
              });
            }}
          >
            Exportar PDF Selecionados ({selectedForStep.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
