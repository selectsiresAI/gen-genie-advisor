// src/utils/ptaFormat.ts
import { parseNum } from "@/lib/number";

// 🔹 PTAs que DEVEM ficar com DUAS CASAS decimais
const DECIMAL_PTA_NAMES = [
  "PTAF%",
  "PTAP%",
  "SCS",
  "PL",
  "DPR",
  "LIV",
  "H LIV",
  "GL",
  "MF",
  "DA",
  "Ket",
  "Mast",
  "Met",
  "RP",
  "CCR",
  "HCR",
  "FI",
  "RFI",
  "EFC",
  "F SAV",
  "PTA Tipo",
  "PTAT",
  "UDC",
  "FLC",
  "BWC",
  "STA",
  "STR",
  "BD",
  "DFM",
  "RUA",
  "TW",
  "RLS",
  "RLR",
  "FA",
  "FUA",
  "FLS",
  "FTA",
  "RUH",
  "RUW",
  "RW",
  "UCL",
  "UD",
  "UDP",
  "FTP",
  "RTP",
  "FTL",
  "SCE",
  "DCE",
  "SSB",
  "DSB",
  "GFI",
];

// 🔹 PTAs que DEVEM ser ARREDONDADAS para INTEIRO
const INTEGER_PTA_NAMES = [
  "HHP$",
  "TPI",
  "NM$",
  "CM$",
  "FM$",
  "GM$",
  "PTAM",
  "PTAF",
  "CFP",
  "PTAP",
];

// Mapa de nomes de coluna do banco → label de display
const COLUMN_TO_LABEL: Record<string, string> = {
  hhp_dollar: "HHP$",
  tpi: "TPI",
  nm_dollar: "NM$",
  cm_dollar: "CM$",
  fm_dollar: "FM$",
  gm_dollar: "GM$",
  ptam: "PTAM",
  ptaf: "PTAF",
  cfp: "CFP",
  ptap: "PTAP",
  ptaf_pct: "PTAF%",
  ptap_pct: "PTAP%",
  scs: "SCS",
  pl: "PL",
  dpr: "DPR",
  liv: "LIV",
  h_liv: "H LIV",
  gl: "GL",
  mf: "MF",
  da: "DA",
  ket: "Ket",
  mast: "Mast",
  met: "Met",
  rp: "RP",
  ccr: "CCR",
  hcr: "HCR",
  fi: "FI",
  rfi: "RFI",
  f_sav: "F SAV",
  ptat: "PTAT",
  udc: "UDC",
  flc: "FLC",
  bwc: "BWC",
  sta: "STA",
  str: "STR",
  dfm: "DFM",
  rua: "RUA",
  rls: "RLS",
  rlr: "RLR",
  fua: "FUA",
  fls: "FLS",
  fta: "FTA",
  ruh: "RUH",
  ruw: "RUW",
  rw: "RW",
  ucl: "UCL",
  udp: "UDP",
  ftp: "FTP",
  rtp: "RTP",
  ftl: "FTL",
  sce: "SCE",
  dce: "DCE",
  ssb: "SSB",
  dsb: "DSB",
  gfi: "GFI",
};

// Normalização para evitar problemas com espaço, $ e %
function normalizePtaKey(name: string): string {
  // Se for um nome de coluna do banco, converte para label primeiro
  const label = COLUMN_TO_LABEL[name.toLowerCase()];
  if (label) return label.replace(/[\s$%®™©]/g, "").toUpperCase();
  return name.replace(/[\s$%®™©]/g, "").toUpperCase();
}

const DECIMAL_PTA_SET = new Set(DECIMAL_PTA_NAMES.map(normalizePtaKey));
const INTEGER_PTA_SET = new Set(INTEGER_PTA_NAMES.map(normalizePtaKey));

/**
 * Formata qualquer PTA de acordo com a lista oficial:
 *  - Se estiver na lista de decimais → 2 casas
 *  - Se estiver na lista de inteiros → arredonda para inteiro
 *  - Se estiver fora das listas → retorna o valor original (sem forçar regra)
 */
export function formatPtaValue(
  fieldName: string,
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "-";

  const num = parseNum(value);
  if (Number.isNaN(num)) return String(value);

  const key = normalizePtaKey(fieldName);

  if (DECIMAL_PTA_SET.has(key)) {
    return num.toFixed(2);
  }

  if (INTEGER_PTA_SET.has(key)) {
    return Math.round(num).toString();
  }

  // Fora das listas: mantém como está (sem padronizar)
  return String(value);
}
