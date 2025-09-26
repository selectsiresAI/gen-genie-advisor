export interface Nexus2PtaDefinition {
  label: string;
  key: string;
}

export const NEXUS2_PTA_DEFINITIONS: readonly Nexus2PtaDefinition[] = [
  { label: 'HHP$®', key: 'hhp_dollar' },
  { label: 'TPI', key: 'tpi' },
  { label: 'NM$', key: 'nm_dollar' },
  { label: 'CM$', key: 'cm_dollar' },
  { label: 'FM$', key: 'fm_dollar' },
  { label: 'GM$', key: 'gm_dollar' },
  { label: 'F SAV', key: 'f_sav' },
  { label: 'PTAM', key: 'ptam' },
  { label: 'CFP', key: 'cfp' },
  { label: 'PTAF', key: 'ptaf' },
  { label: 'PTAF%', key: 'ptaf_pct' },
  { label: 'PTAP', key: 'ptap' },
  { label: 'PTAP%', key: 'ptap_pct' },
  { label: 'PL', key: 'pl' },
  { label: 'DPR', key: 'dpr' },
  { label: 'LIV', key: 'liv' },
  { label: 'SCS', key: 'scs' },
  { label: 'MAST', key: 'mast' },
  { label: 'MET', key: 'met' },
  { label: 'RP', key: 'rp' },
  { label: 'DA', key: 'da' },
  { label: 'KET', key: 'ket' },
  { label: 'MF', key: 'mf' },
  { label: 'PTAT', key: 'ptat' },
  { label: 'UDC', key: 'udc' },
  { label: 'FLC', key: 'flc' },
  { label: 'SCE', key: 'sce' },
  { label: 'DCE', key: 'dce' },
  { label: 'SSB', key: 'ssb' },
  { label: 'DSB', key: 'dsb' },
  { label: 'H LIV', key: 'h_liv' },
  { label: 'CCR', key: 'ccr' },
  { label: 'HCR', key: 'hcr' },
  { label: 'FI', key: 'fi' },
  { label: 'GL', key: 'gl' },
  { label: 'EFC', key: 'efc' },
  { label: 'BWC', key: 'bwc' },
  { label: 'STA', key: 'sta' },
  { label: 'STR', key: 'str' },
  { label: 'DFM', key: 'dfm' },
  { label: 'RUA', key: 'rua' },
  { label: 'RLS', key: 'rls' },
  { label: 'RTP', key: 'rtp' },
  { label: 'FTL', key: 'ftl' },
  { label: 'RW', key: 'rw' },
  { label: 'RLR', key: 'rlr' },
  { label: 'FTA', key: 'fta' },
  { label: 'FLS', key: 'fls' },
  { label: 'FUA', key: 'fua' },
  { label: 'RUH', key: 'ruh' },
  { label: 'RUW', key: 'ruw' },
  { label: 'UCL', key: 'ucl' },
  { label: 'UDP', key: 'udp' },
  { label: 'FTP', key: 'ftp' },
  { label: 'RFI', key: 'rfi' },
  { label: 'GFI', key: 'gfi' }
] as const;

export const NEXUS2_PTA_LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  NEXUS2_PTA_DEFINITIONS.map((definition) => [definition.label, definition.key])
);

export const NEXUS2_PTA_KEY_TO_LABEL: Record<string, string> = Object.fromEntries(
  NEXUS2_PTA_DEFINITIONS.map((definition) => [definition.key, definition.label])
);

export const NEXUS2_PTA_LABELS = NEXUS2_PTA_DEFINITIONS.map((definition) => definition.label);
export const NEXUS2_PTA_KEYS = NEXUS2_PTA_DEFINITIONS.map((definition) => definition.key);
