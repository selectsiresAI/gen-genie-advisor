// src/utils/ptaFormat.ts

// 🔹 PTAs que DEVEM ficar com DUAS CASAS decimais
const DECIMAL_PTA_NAMES = [
  "PTAF%",
  "PTAP%",
  "SCS",
  "PL",
  "DPR",
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
  "F SAV",
  "PTA Tipo",
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
  "FLS",
  "FTA",
  "RUH",
  "RW",
  "UCL",
  "UD",
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

// Normalização para evitar problemas com espaço, $ e %
function normalizePtaKey(name: string): string {
  return name.replace(/[\s$%]/g, "").toUpperCase();
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

  const num = Number(value);
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
