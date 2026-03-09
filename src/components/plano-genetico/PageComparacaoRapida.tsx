import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, FileDown, ArrowUpDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BullRecord {
  id: string;
  name: string;
  company?: string | null;
  naab_code?: string | null;
  hhp_dollar?: number | null;
  tpi?: number | null;
  nm_dollar?: number | null;
  pl?: number | null;
  dpr?: number | null;
  ptat?: number | null;
  udc?: number | null;
  flc?: number | null;
  scs?: number | null;
  [key: string]: unknown;
}

interface CompareColumn {
  key: keyof BullRecord;
  label: string;
}

type SortDir = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COMPARE_COLUMNS: CompareColumn[] = [
  { key: "hhp_dollar", label: "HHP$" },
  { key: "tpi", label: "TPI" },
  { key: "nm_dollar", label: "NM$" },
  { key: "pl", label: "PL" },
  { key: "dpr", label: "DPR" },
  { key: "ptat", label: "PTAT" },
  { key: "udc", label: "UDC" },
  { key: "flc", label: "FLC" },
  { key: "scs", label: "SCS" },
];

const MAX_BULLS = 5;
const MIN_BULLS = 2;
const MAX_SEARCH_RESULTS = 10;
const MIN_SEARCH_CHARS = 2;

const sectionStyle: React.CSSProperties = {
  background: "#F2F2F2",
  border: "1px solid #D9D9D9",
  borderRadius: 14,
  padding: 16,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function numVal(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function columnExtreme(
  bulls: BullRecord[],
  key: string,
  mode: "max" | "min",
): number | null {
  const vals = bulls.map((b) => numVal(b[key])).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return mode === "max" ? Math.max(...vals) : Math.min(...vals);
}

function columnAvg(bulls: BullRecord[], key: string): number | null {
  const vals = bulls.map((b) => numVal(b[key])).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function formatNum(v: number | null): string {
  if (v === null) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/* ------------------------------------------------------------------ */
/*  PDF export (html2canvas + jsPDF via CDN)                           */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf?: { jsPDF: new (o?: string, u?: string, f?: number[]) => JsPDFInstance };
  }
}

interface JsPDFInstance {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFontSize: (s: number) => void;
  setFont: (f: string, style?: string) => void;
  text: (t: string, x: number, y: number, opts?: Record<string, unknown>) => void;
  addImage: (
    data: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  save: (name: string) => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensurePdfLibs(): Promise<{
  html2canvas: NonNullable<Window["html2canvas"]>;
  jsPDF: NonNullable<Window["jspdf"]>["jsPDF"];
}> {
  await Promise.all([
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js"),
  ]);

  const h2c = window.html2canvas;
  const jpdf = window.jspdf;
  if (!h2c || !jpdf) throw new Error("Falha ao carregar bibliotecas de PDF.");
  return { html2canvas: h2c, jsPDF: jpdf.jsPDF };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PageComparacaoRapida() {
  /* ----- state ----- */
  const [allBulls, setAllBulls] = useState<BullRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<BullRecord[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [exporting, setExporting] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  /* ----- load bulls on mount ----- */
  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .rpc("get_bulls_denorm")
        .order("tpi", { ascending: false })
        .limit(200);

      if (!cancelled) {
        if (error) {
          console.error("Erro ao carregar touros:", error.message);
        }
        setAllBulls((data as BullRecord[] | null) ?? []);
        setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----- close dropdown on outside click ----- */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ----- filtered search results ----- */
  const searchResults = useMemo(() => {
    if (searchTerm.length < MIN_SEARCH_CHARS) return [];
    const q = searchTerm.toLowerCase();
    const selectedIds = new Set(selected.map((b) => b.id));
    return allBulls
      .filter((b) => {
        if (selectedIds.has(b.id)) return false;
        const name = (b.name ?? "").toLowerCase();
        const code = (b.naab_code ?? "").toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, MAX_SEARCH_RESULTS);
  }, [searchTerm, allBulls, selected]);

  /* ----- sorted selected bulls ----- */
  const sortedSelected = useMemo(() => {
    if (!sortKey) return selected;
    return [...selected].sort((a, b) => {
      const va = numVal(a[sortKey]);
      const vb = numVal(b[sortKey]);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [selected, sortKey, sortDir]);

  /* ----- actions ----- */
  const addBull = useCallback(
    (bull: BullRecord) => {
      if (selected.length >= MAX_BULLS) return;
      if (selected.some((b) => b.id === bull.id)) return;
      setSelected((prev) => [...prev, bull]);
      setSearchTerm("");
      setDropdownOpen(false);
    },
    [selected],
  );

  const removeBull = useCallback((id: string) => {
    setSelected((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const exportPdf = useCallback(async () => {
    if (!tableRef.current) return;
    setExporting(true);
    try {
      const { html2canvas, jsPDF } = await ensurePdfLibs();
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", [297, 210]);
      const pageW = pdf.internal.pageSize.getWidth();

      const dateStr = new Date().toLocaleDateString("pt-BR");

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Comparação de Touros", pageW / 2, 14, { align: "center" });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(dateStr, pageW / 2, 20, { align: "center" });

      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 26, imgW, imgH);

      const footerY = Math.min(26 + imgH + 8, pdf.internal.pageSize.getHeight() - 8);
      pdf.setFontSize(8);
      pdf.text("Gerado pelo ToolSS V2", pageW / 2, footerY, { align: "center" });

      pdf.save(`comparacao-touros-${dateStr.replace(/\//g, "-")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  /* ----- render helpers ----- */
  const canCompare = selected.length >= MIN_BULLS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
          Comparação Rápida de Touros
        </h2>
        {canCompare && (
          <Button
            onClick={exportPdf}
            disabled={exporting}
            style={{ background: "#BE1E2D", color: "#fff", border: "none" }}
          >
            <FileDown size={16} style={{ marginRight: 6 }} />
            {exporting ? "Gerando…" : "Exportar PDF"}
          </Button>
        )}
      </div>

      {/* Search section */}
      <div style={sectionStyle}>
        <div
          ref={searchContainerRef}
          style={{ position: "relative", maxWidth: 480 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={18} color="#888" />
            <Input
              placeholder={
                loading
                  ? "Carregando touros…"
                  : "Buscar por nome ou código NAAB (mín. 2 caracteres)"
              }
              value={searchTerm}
              disabled={loading || selected.length >= MAX_BULLS}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              style={{ flex: 1 }}
            />
          </div>

          {/* Dropdown */}
          {dropdownOpen && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 50,
                background: "#fff",
                border: "1px solid #D9D9D9",
                borderRadius: 8,
                marginTop: 4,
                maxHeight: 320,
                overflowY: "auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {searchResults.map((bull) => (
                <button
                  key={bull.id}
                  type="button"
                  onClick={() => addBull(bull)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    border: "none",
                    borderBottom: "1px solid #eee",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{bull.name}</span>
                  {bull.company && (
                    <span style={{ color: "#666", marginLeft: 8, fontSize: 12 }}>
                      {bull.company}
                    </span>
                  )}
                  {bull.naab_code && (
                    <span style={{ color: "#999", marginLeft: 8, fontSize: 12 }}>
                      ({bull.naab_code})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Capacity badge */}
        <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
          {selected.length}/{MAX_BULLS} touros selecionados
          {selected.length > 0 && selected.length < MIN_BULLS && (
            <span style={{ marginLeft: 8, color: "#BE1E2D" }}>
              (mínimo {MIN_BULLS} para comparar)
            </span>
          )}
        </div>

        {/* Selected bulls cards */}
        {selected.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
            }}
          >
            {selected.map((bull) => (
              <div
                key={bull.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  border: "1px solid #D9D9D9",
                  borderRadius: 10,
                  padding: "8px 14px",
                }}
              >
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{bull.name}</div>
                  {bull.company && (
                    <div style={{ fontSize: 11, color: "#888" }}>{bull.company}</div>
                  )}
                  {bull.naab_code && (
                    <div style={{ fontSize: 11, color: "#999" }}>NAAB: {bull.naab_code}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeBull(bull.id)}
                  aria-label={`Remover ${bull.name}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    color: "#BE1E2D",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison table */}
      {canCompare ? (
        <div style={sectionStyle}>
          <div ref={tableRef} style={{ background: "#fff", borderRadius: 10, padding: 12 }}>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderBottom: "2px solid #D9D9D9",
                        whiteSpace: "nowrap",
                        color: "#333",
                      }}
                    >
                      Touro
                    </th>
                    {COMPARE_COLUMNS.map((col) => (
                      <th
                        key={col.key as string}
                        onClick={() => toggleSort(col.key as string)}
                        style={{
                          textAlign: "right",
                          padding: "10px 12px",
                          borderBottom: "2px solid #D9D9D9",
                          cursor: "pointer",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                          color:
                            sortKey === col.key ? "#BE1E2D" : "#333",
                          fontWeight: sortKey === col.key ? 700 : 600,
                        }}
                      >
                        {col.label}
                        <ArrowUpDown
                          size={13}
                          style={{
                            marginLeft: 4,
                            verticalAlign: "middle",
                            opacity: sortKey === col.key ? 1 : 0.35,
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSelected.map((bull, idx) => (
                    <tr
                      key={bull.id}
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "#fafafa",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid #eee",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{bull.name}</div>
                        {bull.company && (
                          <div style={{ fontSize: 11, color: "#888" }}>
                            {bull.company}
                          </div>
                        )}
                      </td>
                      {COMPARE_COLUMNS.map((col) => {
                        const v = numVal(bull[col.key as string]);
                        const maxV = columnExtreme(selected, col.key as string, "max");
                        const minV = columnExtreme(selected, col.key as string, "min");
                        const isMax = v !== null && maxV !== null && v === maxV && maxV !== minV;
                        const isMin = v !== null && minV !== null && v === minV && maxV !== minV;

                        return (
                          <td
                            key={col.key as string}
                            style={{
                              textAlign: "right",
                              padding: "10px 12px",
                              borderBottom: "1px solid #eee",
                              fontWeight: isMax ? 700 : 400,
                              color: isMax
                                ? "#16a34a"
                                : isMin
                                  ? "#dc2626"
                                  : "#333",
                            }}
                          >
                            {formatNum(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #D9D9D9" }}>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontStyle: "italic",
                        color: "#888",
                        fontWeight: 600,
                      }}
                    >
                      Média
                    </td>
                    {COMPARE_COLUMNS.map((col) => (
                      <td
                        key={col.key as string}
                        style={{
                          textAlign: "right",
                          padding: "10px 12px",
                          fontStyle: "italic",
                          color: "#888",
                        }}
                      >
                        {formatNum(columnAvg(selected, col.key as string))}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            ...sectionStyle,
            textAlign: "center",
            padding: 40,
            color: "#888",
            fontSize: 15,
          }}
        >
          Busque e adicione touros acima para iniciar a comparação
        </div>
      )}
    </div>
  );
}
