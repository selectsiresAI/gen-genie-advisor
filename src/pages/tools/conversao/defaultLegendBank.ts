import { LegendEntry, normalizeKey } from "./utils";

const entries: Array<Omit<LegendEntry, "source">> = [
  { alias: "NM$", canonical: "NM$" },
  { alias: "nm$", canonical: "NM$" },
  { alias: "net merit", canonical: "NM$" },
  { alias: "mérito líquido", canonical: "NM$" },
  { alias: "merito liquido", canonical: "NM$" },
  { alias: "merito_liquido", canonical: "NM$" },
  { alias: "nm_dollar", canonical: "NM$" },
  { alias: "pta leite", canonical: "PTAM" },
  { alias: "pta milk", canonical: "PTAM" },
  { alias: "ptam", canonical: "PTAM" },
  { alias: "pta gordura", canonical: "PTAF" },
  { alias: "pta fat", canonical: "PTAF" },
  { alias: "ptaf", canonical: "PTAF" },
  { alias: "pta proteína", canonical: "PTAP" },
  { alias: "pta proteina", canonical: "PTAP" },
  { alias: "pta protein", canonical: "PTAP" },
  { alias: "ptap", canonical: "PTAP" },
  { alias: "dpr", canonical: "DPR" },
  { alias: "daughter pregnancy rate", canonical: "DPR" },
  { alias: "scs", canonical: "SCS" },
  { alias: "somatic cell score", canonical: "SCS" },
  { alias: "ptat", canonical: "PTAT" },
  { alias: "tipo", canonical: "PTAT" },
  { alias: "liv", canonical: "LIV" },
];

export const defaultLegendBank: LegendEntry[] = entries.map((entry) => ({
  ...entry,
  alias: normalizeKey(entry.alias),
  source: "default",
}));
