"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ChartMeta = {
  id: string;
  step: number;
  title: string;
  ref: React.RefObject<HTMLDivElement>;
};

type Orientation = "p" | "l";

type ChartExportContextValue = {
  register: (meta: ChartMeta) => void;
  unregister: (id: string) => void;
  items: ChartMeta[];
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
  orientation: Orientation;
  setOrientation: (orientation: Orientation) => void;
};

const ChartExportCtx = createContext<ChartExportContextValue | null>(null);

export function ChartExportProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ChartMeta[]>([]);
  const [selectedIds, setSelected] = useState<Set<string>>(new Set());
  const [orientation, setOrientation] = useState<Orientation>("l");

  const register = useCallback((meta: ChartMeta) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === meta.id);
      if (existing) {
        return prev.map((item) => (item.id === meta.id ? { ...item, ...meta } : item));
      }
      return [...prev, meta];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const value = useMemo(
    () => ({ register, unregister, items, selectedIds, toggle, clear, orientation, setOrientation }),
    [register, unregister, items, selectedIds, toggle, clear, orientation, setOrientation]
  );

  return <ChartExportCtx.Provider value={value}>{children}</ChartExportCtx.Provider>;
}

export function useChartExport() {
  const ctx = useContext(ChartExportCtx);
  if (!ctx) throw new Error("useChartExport must be used within ChartExportProvider");
  return ctx;
}
