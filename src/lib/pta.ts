export const PTA_LABELS: Record<string, string> = {
  hhp_dollar: "HHP$®",
  tpi: "TPI",
  nm_dollar: "NM$",
  cm_dollar: "CM$",
  fm_dollar: "FM$",
  gm_dollar: "GM$",
  ptam: "PTAM",
  ptaf: "PTAF",
  ptaf_pct: "PTAF%",
  ptap: "PTAP",
  ptap_pct: "PTAP%",
  cfp: "CFP",
  dpr: "DPR",
  pl: "PL",
  liv: "LIV",
  scs: "SCS",
  mast: "MAST",
  met: "MET",
  rp: "RP",
  da: "DA",
  ket: "KET",
  ccr: "CCR",
  hcr: "HCR",
  fi: "FI",
  sce: "SCE",
  dce: "DCE",
  ssb: "SSB",
  dsb: "DSB",
  h_liv: "H LIV",
  gl: "GL",
  efc: "EFC",
  rfi: "RFI",
  gfi: "GFI",
  mf: "MF",
  ptat: "PTAT",
  udc: "UDC",
  flc: "FLC",
  bwc: "BWC",
  sta: "STA",
  str: "STR",
  dfm: "DFM",
  rua: "RUA",
  rls: "RLS",
  rtp: "RTP",
  ftl: "FTL",
  rw: "RW",
  rlr: "RLR",
  fta: "FTA",
  fls: "FLS",
  fua: "FUA",
  ruh: "RUH",
  ruw: "RUW",
  ucl: "UCL",
  udp: "UDP",
  ftp: "FTP",
};

export const LINEAR_TRAITS = [
  "sta",
  "str",
  "dfm",
  "rua",
  "rls",
  "rtp",
  "ftl",
  "rw",
  "rlr",
  "fta",
  "fls",
  "fua",
  "ruh",
  "ruw",
  "ucl",
  "udp",
  "ftp",
] as const;

export const DEFAULT_DASH_TRAITS = ["ptam", "ptaf", "ptap", "dpr", "pl", "scs"] as const;

export type PTACat = {
  key: string;
  label: string;
  group: "Índices" | "Produção" | "Composição" | "Saúde" | "Fertilidade" | "Tipo" | "Outros";
  defaultStep5?: boolean;
  preferOrder?: number;
};

export const PTA_CATALOG: PTACat[] = [
  // Índices
  { key: "hhp_dollar", label: PTA_LABELS.hhp_dollar, group: "Índices", defaultStep5: true, preferOrder: 1 },
  { key: "tpi", label: PTA_LABELS.tpi, group: "Índices", defaultStep5: true, preferOrder: 2 },
  { key: "nm_dollar", label: PTA_LABELS.nm_dollar, group: "Índices", defaultStep5: true, preferOrder: 3 },
  { key: "cm_dollar", label: PTA_LABELS.cm_dollar, group: "Índices" },
  { key: "fm_dollar", label: PTA_LABELS.fm_dollar, group: "Índices" },
  { key: "gm_dollar", label: PTA_LABELS.gm_dollar, group: "Índices" },

  // Produção / Composição
  { key: "ptam", label: PTA_LABELS.ptam, group: "Produção", defaultStep5: true, preferOrder: 4 },
  { key: "ptaf", label: PTA_LABELS.ptaf, group: "Produção", defaultStep5: true, preferOrder: 5 },
  { key: "ptaf_pct", label: PTA_LABELS.ptaf_pct, group: "Composição" },
  { key: "ptap", label: PTA_LABELS.ptap, group: "Produção", defaultStep5: true, preferOrder: 6 },
  { key: "ptap_pct", label: PTA_LABELS.ptap_pct, group: "Composição" },
  { key: "cfp", label: PTA_LABELS.cfp, group: "Produção" },

  // Saúde / Longevidade
  { key: "pl", label: PTA_LABELS.pl, group: "Saúde" },
  { key: "dpr", label: PTA_LABELS.dpr, group: "Fertilidade" },
  { key: "liv", label: PTA_LABELS.liv, group: "Saúde" },
  { key: "scs", label: PTA_LABELS.scs, group: "Saúde" },
  { key: "mast", label: PTA_LABELS.mast, group: "Saúde" },
  { key: "met", label: PTA_LABELS.met, group: "Saúde" },
  { key: "rp", label: PTA_LABELS.rp, group: "Saúde" },
  { key: "da", label: PTA_LABELS.da, group: "Saúde" },
  { key: "ket", label: PTA_LABELS.ket, group: "Saúde" },

  // Fertilidade
  { key: "ccr", label: PTA_LABELS.ccr, group: "Fertilidade" },
  { key: "hcr", label: PTA_LABELS.hcr, group: "Fertilidade" },
  { key: "fi", label: PTA_LABELS.fi, group: "Fertilidade" },

  // Calving
  { key: "sce", label: PTA_LABELS.sce, group: "Outros" },
  { key: "dce", label: PTA_LABELS.dce, group: "Outros" },
  { key: "ssb", label: PTA_LABELS.ssb, group: "Outros" },
  { key: "dsb", label: PTA_LABELS.dsb, group: "Outros" },

  // Outras
  { key: "h_liv", label: PTA_LABELS.h_liv, group: "Saúde" },
  { key: "gl", label: PTA_LABELS.gl, group: "Outros" },
  { key: "efc", label: PTA_LABELS.efc, group: "Outros" },
  { key: "rfi", label: PTA_LABELS.rfi, group: "Outros" },
  { key: "gfi", label: PTA_LABELS.gfi, group: "Outros" },
  { key: "mf", label: PTA_LABELS.mf, group: "Outros" },

  // Tipo (lineares / compostos)
  { key: "ptat", label: PTA_LABELS.ptat, group: "Tipo" },
  { key: "udc", label: PTA_LABELS.udc, group: "Tipo" },
  { key: "flc", label: PTA_LABELS.flc, group: "Tipo" },
  { key: "bwc", label: PTA_LABELS.bwc, group: "Tipo" },
  { key: "sta", label: PTA_LABELS.sta, group: "Tipo" },
  { key: "str", label: PTA_LABELS.str, group: "Tipo" },
  { key: "dfm", label: PTA_LABELS.dfm, group: "Tipo" },
  { key: "rua", label: PTA_LABELS.rua, group: "Tipo" },
  { key: "rw", label: PTA_LABELS.rw, group: "Tipo" },
  { key: "rls", label: PTA_LABELS.rls, group: "Tipo" },
  { key: "rlr", label: PTA_LABELS.rlr, group: "Tipo" },
  { key: "fua", label: PTA_LABELS.fua, group: "Tipo" },
  { key: "ruh", label: PTA_LABELS.ruh, group: "Tipo" },
  { key: "ruw", label: PTA_LABELS.ruw, group: "Tipo" },
  { key: "ucl", label: PTA_LABELS.ucl, group: "Tipo" },
  { key: "udp", label: PTA_LABELS.udp, group: "Tipo" },
  { key: "fta", label: PTA_LABELS.fta, group: "Tipo" },
  { key: "ftp", label: PTA_LABELS.ftp, group: "Tipo" },
  { key: "rtp", label: PTA_LABELS.rtp, group: "Tipo" },
  { key: "ftl", label: PTA_LABELS.ftl, group: "Tipo" },
  { key: "fls", label: PTA_LABELS.fls, group: "Tipo" },
];
