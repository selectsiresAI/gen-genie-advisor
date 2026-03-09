import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const BULL_SELECT_FIELDS =
  "id, code, name, company, hhp_dollar, tpi, nm_dollar, cm_dollar, fm_dollar, gm_dollar, f_sav, ptam, cfp, ptaf, ptaf_pct, ptap, ptap_pct, pl, dpr, liv, scs, mast, met, rp, da, ket, mf, ptat, udc, flc, sce, dce, ssb, dsb, h_liv, ccr, hcr, fi, bwc, sta, str, dfm, rua, rls, rtp, ftl, rw, rlr, fta, fls, fua, ruh, ruw, ucl, udp, ftp, rfi, gfi, gl, beta_casein, kappa_casein, pedigree";

/** Maps PTA display labels to database column names */
export const BULL_FIELD_MAP: Record<string, string> = {
  "HHP$": "hhp_dollar",
  "HHP$®": "hhp_dollar",
  TPI: "tpi",
  "NM$": "nm_dollar",
  "CM$": "cm_dollar",
  "FM$": "fm_dollar",
  "GM$": "gm_dollar",
  "F SAV": "f_sav",
  PTAM: "ptam",
  Milk: "ptam",
  CFP: "cfp",
  PTAF: "ptaf",
  Fat: "ptaf",
  "PTAF%": "ptaf_pct",
  "Fat%": "ptaf_pct",
  PTAP: "ptap",
  Protein: "ptap",
  "PTAP%": "ptap_pct",
  "Protein%": "ptap_pct",
  PL: "pl",
  DPR: "dpr",
  LIV: "liv",
  SCS: "scs",
  MAST: "mast",
  MET: "met",
  RP: "rp",
  DA: "da",
  KET: "ket",
  MF: "mf",
  PTAT: "ptat",
  UDC: "udc",
  FLC: "flc",
  SCE: "sce",
  DCE: "dce",
  SSB: "ssb",
  DSB: "dsb",
  "H LIV": "h_liv",
  CCR: "ccr",
  HCR: "hcr",
  FI: "fi",
  BWC: "bwc",
  STA: "sta",
  STR: "str",
  DFM: "dfm",
  RUA: "rua",
  RLS: "rls",
  RTP: "rtp",
  FTL: "ftl",
  RW: "rw",
  RLR: "rlr",
  FTA: "fta",
  FLS: "fls",
  FUA: "fua",
  RUH: "ruh",
  RUW: "ruw",
  UCL: "ucl",
  UDP: "udp",
  FTP: "ftp",
  RFI: "rfi",
  GFI: "gfi",
  GL: "gl",
  "Beta Caseína": "beta_casein",
  "Kappa Caseína": "kappa_casein",
};

export interface BullSearchResult {
  id: string;
  code: string;
  name: string;
  company?: string;
  [key: string]: any;
}

interface BullSelectorProps {
  label?: string;
  placeholder?: string;
  value?: BullSearchResult | null;
  onChange: (bull: BullSearchResult | null) => void;
  disabled?: boolean;
  showPTAs?: boolean;
  className?: string;
}

export function BullSelector({
  label = "Selecionar Touro",
  placeholder = "Digite o nome ou código NAAB do touro...",
  value,
  onChange,
  disabled = false,
  className = "",
}: BullSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BullSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchBulls = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bulls")
        .select(BULL_SELECT_FIELDS)
        .or(`code.ilike.%${term}%,name.ilike.%${term}%`)
        .order("tpi", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Erro na busca de touros:", error);
        setResults([]);
      } else {
        setResults(data || []);
      }
      setIsOpen(true);
    } catch (err) {
      console.error("Erro na busca de touros:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchBulls(val), 300);
  };

  const handleSelect = (bull: BullSearchResult) => {
    onChange(bull);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term || term.length < 2) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "#fef08a", padding: 0, borderRadius: 2 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const displayValue = value ? `${value.code} — ${value.name}` : "";

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {label && <Label>{label}</Label>}

      <div style={{ position: "relative" }}>
        {/* Search input or selected display */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search
            style={{
              position: "absolute",
              left: 10,
              width: 16,
              height: 16,
              color: "#9ca3af",
              pointerEvents: "none",
            }}
          />
          <Input
            ref={inputRef}
            value={value ? displayValue : query}
            onChange={value ? undefined : handleInputChange}
            onFocus={() => {
              if (!value && query.length >= 2) setIsOpen(true);
            }}
            readOnly={!!value}
            disabled={disabled}
            placeholder={placeholder}
            style={{
              paddingLeft: 34,
              paddingRight: value ? 40 : loading ? 40 : 12,
              background: value ? "#f0fdf4" : undefined,
              cursor: value ? "default" : undefined,
            }}
          />
          {loading && !value && (
            <Loader2
              style={{
                position: "absolute",
                right: 10,
                width: 16,
                height: 16,
                color: "#9ca3af",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              style={{ position: "absolute", right: 2, width: 32, height: 32 }}
            >
              <X style={{ width: 16, height: 16 }} />
            </Button>
          )}
        </div>

        {/* Dropdown results */}
        {isOpen && !value && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: 4,
              maxHeight: 320,
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #D9D9D9",
              borderRadius: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {results.length === 0 && !loading && query.length >= 2 && (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: 13,
                }}
              >
                Nenhum touro encontrado para "{query}"
              </div>
            )}
            {results.map((bull) => (
              <div
                key={bull.id}
                onClick={() => handleSelect(bull)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f3f4f6",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {highlightMatch(bull.code, query)} — {highlightMatch(bull.name, query)}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                  {bull.company || "Sem empresa"}
                  {bull.tpi != null && (
                    <span style={{ marginLeft: 8, color: "#3b82f6" }}>TPI: {bull.tpi}</span>
                  )}
                  {bull.hhp_dollar != null && (
                    <span style={{ marginLeft: 8, color: "#16a34a" }}>HHP$: {bull.hhp_dollar}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Extract a PTA value from a raw bull database row using the label-to-field map */
export function getBullFieldValue(bull: Record<string, any>, ptaLabel: string): number {
  const fieldName = BULL_FIELD_MAP[ptaLabel] ?? ptaLabel.toLowerCase();
  const val = bull[fieldName];
  if (val === null || val === undefined) return 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}
