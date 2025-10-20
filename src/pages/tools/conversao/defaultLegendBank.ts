import { LegendEntry, normalizeKey } from "./utils";

const entries: Array<Omit<LegendEntry, "source">> = [
  // Identificação e informações básicas
  { alias: "naab code", canonical: "code" },
  { alias: "code", canonical: "code" },
  { alias: "name", canonical: "name" },
  { alias: "nome", canonical: "name" },
  { alias: "company", canonical: "company" },
  { alias: "birth date", canonical: "birth_date" },
  { alias: "data de nascimento", canonical: "birth_date" },
  { alias: "data_nascimento", canonical: "birth_date" },
  
  // Caseínas
  { alias: "beta casein", canonical: "beta_casein" },
  { alias: "beta-casein", canonical: "beta_casein" },
  { alias: "kappa casein", canonical: "kappa_casein" },
  { alias: "kappa-casein", canonical: "kappa_casein" },
  
  // Índices econômicos
  { alias: "tpi", canonical: "TPI" },
  { alias: "tpi®", canonical: "TPI" },
  
  { alias: "net merit", canonical: "NM$" },
  { alias: "nm$", canonical: "NM$" },
  { alias: "nm$®", canonical: "NM$" },
  { alias: "nm", canonical: "NM$" },
  { alias: "mn", canonical: "NM$" },
  { alias: "mn$", canonical: "NM$" },
  { alias: "net_merit", canonical: "NM$" },
  { alias: "mérito liquido", canonical: "NM$" },
  { alias: "mérito líquido", canonical: "NM$" },
  { alias: "merito liquido", canonical: "NM$" },
  
  { alias: "cm$", canonical: "CM$" },
  { alias: "cm$®", canonical: "CM$" },
  { alias: "cm", canonical: "CM$" },
  { alias: "mq", canonical: "CM$" },
  { alias: "mq$", canonical: "CM$" },
  { alias: "mérito queijo", canonical: "CM$" },
  { alias: "cheese merit", canonical: "CM$" },
  
  { alias: "fm$", canonical: "FM$" },
  { alias: "fm$®", canonical: "FM$" },
  { alias: "fm", canonical: "FM$" },
  { alias: "mf", canonical: "FM$" },
  { alias: "mf$", canonical: "FM$" },
  { alias: "mérito volume", canonical: "FM$" },
  { alias: "mérito fluído", canonical: "FM$" },
  { alias: "fluid merit", canonical: "FM$" },
  
  { alias: "grazing merit", canonical: "GM$" },
  { alias: "gm$", canonical: "GM$" },
  { alias: "gm$®", canonical: "GM$" },
  { alias: "gm", canonical: "GM$" },
  { alias: "mg", canonical: "GM$" },
  { alias: "mg$", canonical: "GM$" },
  { alias: "mérito pasto", canonical: "GM$" },
  
  // Produção
  { alias: "pta milk", canonical: "PTAM" },
  { alias: "ptam", canonical: "PTAM" },
  { alias: "milk", canonical: "PTAM" },
  { alias: "leite (lbs)", canonical: "PTAM" },
  { alias: "gpta milk", canonical: "PTAM" },
  { alias: "leite", canonical: "PTAM" },
  { alias: "milk_production", canonical: "PTAM" },
  { alias: "produção de leite", canonical: "PTAM" },
  { alias: "milk production", canonical: "PTAM" },
  { alias: "pta leite", canonical: "PTAM" },
  
  { alias: "pta fat", canonical: "PTAF" },
  { alias: "ptaf", canonical: "PTAF" },
  { alias: "f (lbs)", canonical: "PTAF" },
  { alias: "ptag", canonical: "PTAF" },
  { alias: "g (lbs)", canonical: "PTAF" },
  { alias: "gordura (lbs)", canonical: "PTAF" },
  { alias: "gord", canonical: "PTAF" },
  { alias: "gord (lbs)", canonical: "PTAF" },
  { alias: "fat (lbs)", canonical: "PTAF" },
  { alias: "%_fat", canonical: "PTAF" },
  { alias: "fat.(lbs)", canonical: "PTAF" },
  { alias: "gord. (lbs.)", canonical: "PTAF" },
  { alias: "fat", canonical: "PTAF" },
  { alias: "gordura", canonical: "PTAF" },
  { alias: "quantidade de gordura no leite", canonical: "PTAF" },
  { alias: "pta gordura", canonical: "PTAF" },
  
  { alias: "% fat", canonical: "PTAF%" },
  { alias: "ptaf%", canonical: "PTAF%" },
  { alias: "f %", canonical: "PTAF%" },
  { alias: "gordura %", canonical: "PTAF%" },
  { alias: "g%", canonical: "PTAF%" },
  { alias: "fat.(%)", canonical: "PTAF%" },
  { alias: "% gordura", canonical: "PTAF%" },
  
  { alias: "pta pro", canonical: "PTAP" },
  { alias: "ptap", canonical: "PTAP" },
  { alias: "p (lbs)", canonical: "PTAP" },
  { alias: "proteína (lbs)", canonical: "PTAP" },
  { alias: "prot", canonical: "PTAP" },
  { alias: "prot lbs", canonical: "PTAP" },
  { alias: "prot.(lbs)", canonical: "PTAP" },
  { alias: "prot. (lbs.)", canonical: "PTAP" },
  { alias: "quantidade de proteína no leite", canonical: "PTAP" },
  { alias: "protein", canonical: "PTAP" },
  { alias: "proteína", canonical: "PTAP" },
  { alias: "pta proteina", canonical: "PTAP" },
  { alias: "pta proteína", canonical: "PTAP" },
  
  { alias: "% pro", canonical: "PTAP%" },
  { alias: "ptap%", canonical: "PTAP%" },
  { alias: "p %", canonical: "PTAP%" },
  { alias: "proteína %", canonical: "PTAP%" },
  { alias: "prot.(%)", canonical: "PTAP%" },
  { alias: "% prot", canonical: "PTAP%" },
  { alias: "% proteína", canonical: "PTAP%" },
  
  { alias: "cfp", canonical: "CFP" },
  { alias: "cgp", canonical: "CFP" },
  
  // Saúde e fertilidade
  { alias: "scs", canonical: "SCS" },
  { alias: "ccs", canonical: "SCS" },
  { alias: "somatic cells", canonical: "SCS" },
  { alias: "células somáticas", canonical: "SCS" },
  { alias: "somatic cell score", canonical: "SCS" },
  
  { alias: "pl", canonical: "PL" },
  { alias: "vp", canonical: "PL" },
  { alias: "vida produtiva", canonical: "PL" },
  { alias: "productive life", canonical: "PL" },
  
  { alias: "pta dpr", canonical: "DPR" },
  { alias: "dpr", canonical: "DPR" },
  { alias: "tpf", canonical: "DPR" },
  { alias: "taxa de prenhez das filhas", canonical: "DPR" },
  { alias: "daughter pregnancy rate", canonical: "DPR" },
  
  { alias: "pta liv", canonical: "LIV" },
  { alias: "liv", canonical: "LIV" },
  { alias: "ptaliv", canonical: "LIV" },
  { alias: "sobrevivência", canonical: "LIV" },
  { alias: "sobrevivênvia de vaca", canonical: "LIV" },
  { alias: "cow livability", canonical: "LIV" },
  { alias: "livability", canonical: "LIV" },
  
  { alias: "pta gl", canonical: "GL" },
  { alias: "gl", canonical: "GL" },
  
  { alias: "milk fever", canonical: "MF" },
  { alias: "mfv", canonical: "MF" },
  { alias: "hipoc", canonical: "MF" },
  { alias: "hipocalcemia", canonical: "MF" },
  { alias: "febre do leite", canonical: "MF" },
  
  { alias: "displaced abomasum", canonical: "DA" },
  { alias: "da", canonical: "DA" },
  { alias: "dab", canonical: "DA" },
  { alias: "cdcb_da", canonical: "DA" },
  { alias: "desl.abom.", canonical: "DA" },
  { alias: "deslocamento de abomaso", canonical: "DA" },
  
  { alias: "ketosis", canonical: "KET" },
  { alias: "ket", canonical: "KET" },
  { alias: "cdcb_ket", canonical: "KET" },
  { alias: "cdcb_cet", canonical: "KET" },
  { alias: "cetose", canonical: "KET" },
  
  { alias: "mastitis", canonical: "MAST" },
  { alias: "mast", canonical: "MAST" },
  { alias: "cdcb_mast", canonical: "MAST" },
  { alias: "mastite", canonical: "MAST" },
  
  { alias: "metritis", canonical: "MET" },
  { alias: "met", canonical: "MET" },
  { alias: "cdcb_met", canonical: "MET" },
  { alias: "metrite", canonical: "MET" },
  
  { alias: "retained placenta", canonical: "RP" },
  { alias: "rp", canonical: "RP" },
  { alias: "cdcb_rp", canonical: "RP" },
  
  { alias: "ccr", canonical: "CCR" },
  { alias: "tcv", canonical: "CCR" },
  { alias: "cow conception rate", canonical: "CCR" },
  { alias: "taxa de concepção de vacas", canonical: "CCR" },
  
  { alias: "hcr", canonical: "HCR" },
  { alias: "tcn", canonical: "HCR" },
  { alias: "heifer conception rate", canonical: "HCR" },
  { alias: "taxa de concepção de novilhas", canonical: "HCR" },
  
  { alias: "fertil index", canonical: "FI" },
  { alias: "fi", canonical: "FI" },
  { alias: "fert. index", canonical: "FI" },
  { alias: "índice de fertilidade", canonical: "FI" },
  
  { alias: "heifer livability", canonical: "H_LIV" },
  { alias: "h liv", canonical: "H_LIV" },
  { alias: "hliv", canonical: "H_LIV" },
  { alias: "h livability", canonical: "H_LIV" },
  { alias: "pta hliv", canonical: "H_LIV" },
  { alias: "sobrevivênvia de novilha", canonical: "H_LIV" },
  
  { alias: "rfi", canonical: "RFI" },
  
  { alias: "feed saved", canonical: "F_SAV" },
  { alias: "f sav", canonical: "F_SAV" },
  { alias: "fs", canonical: "F_SAV" },
  
  // Tipo e conformação
  { alias: "pta type", canonical: "PTAT" },
  { alias: "ptat", canonical: "PTAT" },
  { alias: "ptatype", canonical: "PTAT" },
  { alias: "pta tipo", canonical: "PTAT" },
  { alias: "type", canonical: "PTAT" },
  { alias: "tipo", canonical: "PTAT" },
  { alias: "classificação final para tipo", canonical: "PTAT" },
  
  { alias: "udc", canonical: "UDC" },
  { alias: "cu", canonical: "UDC" },
  { alias: "udder composite", canonical: "UDC" },
  { alias: "composto do úbere", canonical: "UDC" },
  
  { alias: "flc", canonical: "FLC" },
  { alias: "cpp", canonical: "FLC" },
  { alias: "feet and leg composite", canonical: "FLC" },
  { alias: "composto de pernas e pés", canonical: "FLC" },
  
  { alias: "bwc", canonical: "BWC" },
  { alias: "bc", canonical: "BWC" },
  { alias: "body composite", canonical: "BWC" },
  { alias: "composto corporal", canonical: "BWC" },
  
  { alias: "sta", canonical: "STA" },
  { alias: "est", canonical: "STA" },
  { alias: "stature", canonical: "STA" },
  { alias: "estatura", canonical: "STA" },
  
  { alias: "str", canonical: "STR" },
  { alias: "strength", canonical: "STR" },
  { alias: "força", canonical: "STR" },
  
  { alias: "df", canonical: "DFM" },
  { alias: "dfm", canonical: "DFM" },
  { alias: "forma leiteira", canonical: "DFM" },
  { alias: "dairy form", canonical: "DFM" },
  
  { alias: "ra", canonical: "RUA" },
  { alias: "rua", canonical: "RUA" },
  { alias: "rump angle", canonical: "RUA" },
  { alias: "ângulo da garupa", canonical: "RUA" },
  
  { alias: "tw", canonical: "RW" },
  { alias: "rw", canonical: "RW" },
  { alias: "rtw", canonical: "RW" },
  { alias: "thurl width", canonical: "RW" },
  { alias: "largura da garupa", canonical: "RW" },
  
  { alias: "rls", canonical: "RLS" },
  { alias: "rear legs side", canonical: "RLS" },
  { alias: "pernas vista lateral", canonical: "RLS" },
  
  { alias: "rlr", canonical: "RLR" },
  { alias: "rear legs rear", canonical: "RLR" },
  { alias: "pernas vista posterior", canonical: "RLR" },
  
  { alias: "fa", canonical: "FTA" },
  { alias: "fta", canonical: "FTA" },
  { alias: "ângulo dos cascos", canonical: "FTA" },
  { alias: "foot angle", canonical: "FTA" },
  
  { alias: "fls", canonical: "FLS" },
  
  { alias: "fua", canonical: "FUA" },
  { alias: "fore udder attachment", canonical: "FUA" },
  { alias: "inserção anterior do úbere", canonical: "FUA" },
  
  { alias: "ruh", canonical: "RUH" },
  { alias: "rear udder height", canonical: "RUH" },
  { alias: "altura do úbere posterior", canonical: "RUH" },
  
  { alias: "ruw", canonical: "RUW" },
  { alias: "rear udder width", canonical: "RUW" },
  { alias: "largura do úbere", canonical: "RUW" },
  
  { alias: "uc", canonical: "UCL" },
  { alias: "ucl", canonical: "UCL" },
  { alias: "udder cleft", canonical: "UCL" },
  { alias: "ligamento médio", canonical: "UCL" },
  
  { alias: "ud", canonical: "UDP" },
  { alias: "udp", canonical: "UDP" },
  { alias: "udder depth", canonical: "UDP" },
  { alias: "profundidade do úbere", canonical: "UDP" },
  
  { alias: "ftp", canonical: "FTP" },
  { alias: "front teat placement", canonical: "FTP" },
  { alias: "colocação dos tetos anterior", canonical: "FTP" },
  
  { alias: "rtp", canonical: "RTP" },
  { alias: "rear teat placement", canonical: "RTP" },
  { alias: "colocação dos tetos posterior", canonical: "RTP" },
  
  { alias: "tl", canonical: "FTL" },
  { alias: "ftl", canonical: "FTL" },
  { alias: "teat length", canonical: "FTL" },
  { alias: "comprimento dos tetos", canonical: "FTL" },
  
  // Facilidade de parto
  { alias: "sce", canonical: "SCE" },
  { alias: "fpt", canonical: "SCE" },
  { alias: "sire calving ease", canonical: "SCE" },
  { alias: "calving ease (sire)", canonical: "SCE" },
  { alias: "facilidade de parto (touro)", canonical: "SCE" },
  
  { alias: "dce", canonical: "DCE" },
  { alias: "fpf", canonical: "DCE" },
  { alias: "daughter calving ease", canonical: "DCE" },
  { alias: "calving ease (daughter)", canonical: "DCE" },
  { alias: "calving ease (female)", canonical: "DCE" },
  { alias: "facilidade de parto (fêmea)", canonical: "DCE" },
  
  { alias: "ssb", canonical: "SSB" },
  { alias: "int", canonical: "SSB" },
  { alias: "sire stillbirth rate", canonical: "SSB" },
  { alias: "stillbirth rate (sire)", canonical: "SSB" },
  { alias: "índice de natimorto (touro)", canonical: "SSB" },
  
  { alias: "dsb", canonical: "DSB" },
  { alias: "inf", canonical: "DSB" },
  { alias: "daughter stillbirth rate", canonical: "DSB" },
  { alias: "female stillbirth rate", canonical: "DSB" },
  { alias: "stillbirth rate (female)", canonical: "DSB" },
  { alias: "índice de natimorto (fêmea)", canonical: "DSB" },
];

export const defaultLegendBank: LegendEntry[] = entries.map((entry) => ({
  ...entry,
  alias: normalizeKey(entry.alias),
  source: "default",
}));
