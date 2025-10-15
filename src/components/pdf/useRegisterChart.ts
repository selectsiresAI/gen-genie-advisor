"use client";

import { useEffect } from "react";
import { useChartExport } from "./ChartExportProvider";

export function useRegisterChart(
  id: string,
  step: number,
  title: string,
  ref: React.RefObject<HTMLDivElement>
) {
  const { register, unregister } = useChartExport();
  useEffect(() => {
    register({ id, step, title, ref });
    return () => unregister(id);
  }, [id, step, title, ref, register, unregister]);
}
