// Catálogo canônico de PTAs disponíveis no females_denorm
// Ajuste/expanda aqui se houver mais colunas no seu banco.

export type PTACat = {
  key: string; // nome da coluna no females_denorm
  label: string; // rótulo exibido
  group: "Índices" | "Produção" | "Composição" | "Saúde" | "Fertilidade" | "Tipo" | "Outros";
  defaultStep5?: boolean; // aparece por padrão no Step 5
  preferOrder?: number; // ordenação sugerida no Step 5 (menor = mais à esquerda)
};

export const PTA_CATALOG: PTACat[] = [
  // Índices
  { key: "hhp_dollar", label: "HHP$®", group: "Índices", defaultStep5: true, preferOrder: 1 },
  { key: "tpi", label: "TPI", group: "Índices", defaultStep5: true, preferOrder: 2 },
  { key: "nm_dollar", label: "NM$", group: "Índices", defaultStep5: true, preferOrder: 3 },
  { key: "cm_dollar", label: "CM$", group: "Índices" },
  { key: "fm_dollar", label: "FM$", group: "Índices" },
  { key: "gm_dollar", label: "GM$", group: "Índices" },

  // Produção / Composição
  { key: "ptam", label: "PTAM", group: "Produção", defaultStep5: true, preferOrder: 4 },
  { key: "ptaf", label: "PTAF", group: "Produção", defaultStep5: true, preferOrder: 5 },
  { key: "ptaf_pct", label: "PTAF%", group: "Composição" },
  { key: "ptap", label: "PTAP", group: "Produção", defaultStep5: true, preferOrder: 6 },
  { key: "ptap_pct", label: "PTAP%", group: "Composição" },
  { key: "cfp", label: "CFP", group: "Produção" },

  // Saúde / Longevidade
  { key: "pl", label: "PL", group: "Saúde" },
  { key: "dpr", label: "DPR", group: "Fertilidade" },
  { key: "liv", label: "LIV", group: "Saúde" },
  { key: "scs", label: "SCS", group: "Saúde" },
  { key: "mast", label: "MAST", group: "Saúde" },
  { key: "met", label: "MET", group: "Saúde" },
  { key: "rp", label: "RP", group: "Saúde" },
  { key: "da", label: "DA", group: "Saúde" },
  { key: "ket", label: "KET", group: "Saúde" },

  // Fertilidade
  { key: "ccr", label: "CCR", group: "Fertilidade" },
  { key: "hcr", label: "HCR", group: "Fertilidade" },
  { key: "fi", label: "FI", group: "Fertilidade" },

  // Calving
  { key: "sce", label: "SCE", group: "Outros" },
  { key: "dce", label: "DCE", group: "Outros" },
  { key: "ssb", label: "SSB", group: "Outros" },
  { key: "dsb", label: "DSB", group: "Outros" },

  // Outras
  { key: "h_liv", label: "H LIV", group: "Saúde" },
  { key: "gl", label: "GL", group: "Outros" },
  { key: "efc", label: "EFC", group: "Outros" },
  { key: "rfi", label: "RFI", group: "Outros" },
  { key: "gfi", label: "GFI", group: "Outros" },
  { key: "mf", label: "MF", group: "Outros" },

  // Tipo (lineares / compostos)
  { key: "ptat", label: "PTAT", group: "Tipo" },
  { key: "udc", label: "UDC", group: "Tipo" },
  { key: "flc", label: "FLC", group: "Tipo" },
  { key: "bwc", label: "BWC", group: "Tipo" },
  { key: "sta", label: "Stature", group: "Tipo" },
  { key: "str", label: "Strength", group: "Tipo" },
  { key: "dfm", label: "Dairy Form", group: "Tipo" },
  { key: "rw", label: "Rump Width", group: "Tipo" },
  { key: "rls", label: "Rear Leg Side View", group: "Tipo" },
  { key: "rlr", label: "Rear Leg Rear View", group: "Tipo" },
  { key: "fua", label: "Fore Udder Attachment", group: "Tipo" },
  { key: "ruh", label: "Rear Udder Height", group: "Tipo" },
  { key: "ruw", label: "Rear Udder Width", group: "Tipo" },
  { key: "ucl", label: "Udder Cleft", group: "Tipo" },
  { key: "udp", label: "Udder Depth", group: "Tipo" },
  { key: "fta", label: "Front Teat Attachment", group: "Tipo" },
  { key: "ftp", label: "Front Teat Placement", group: "Tipo" },
  { key: "rtp", label: "Rear Teat Placement", group: "Tipo" },
  { key: "ftl", label: "Front Teat Length", group: "Tipo" },
  { key: "fls", label: "Foot Angle", group: "Tipo" },
];
