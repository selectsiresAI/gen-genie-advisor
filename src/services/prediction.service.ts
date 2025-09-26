import type { BullsDenormSelection } from '@/supabase/queries/bulls';

export const GENETIC_WEIGHTS = {
  sire: 0.57,
  mgs: 0.28,
  mmgs: 0.15
} as const;

const FEMALE_PTA_LABELS: Record<string, string> = {
  hhp_dollar: 'HHP$®',
  tpi: 'TPI',
  nm_dollar: 'NM$',
  cm_dollar: 'CM$',
  fm_dollar: 'FM$',
  gm_dollar: 'GM$',
  ptam: 'PTAM',
  ptaf: 'PTAF',
  ptap: 'PTAP',
  cfp: 'CFP',
  pl: 'PL',
  dpr: 'DPR',
  scs: 'SCS',
  ptat: 'PTAT'
};

export const PREDICTION_TRAITS = [
  { key: 'hhp_dollar', label: FEMALE_PTA_LABELS.hhp_dollar },
  { key: 'tpi', label: FEMALE_PTA_LABELS.tpi },
  { key: 'nm_dollar', label: FEMALE_PTA_LABELS.nm_dollar },
  { key: 'cm_dollar', label: FEMALE_PTA_LABELS.cm_dollar },
  { key: 'fm_dollar', label: FEMALE_PTA_LABELS.fm_dollar },
  { key: 'gm_dollar', label: FEMALE_PTA_LABELS.gm_dollar },
  { key: 'f_sav', label: 'F SAV' },
  { key: 'ptam', label: FEMALE_PTA_LABELS.ptam },
  { key: 'cfp', label: FEMALE_PTA_LABELS.cfp },
  { key: 'ptaf', label: FEMALE_PTA_LABELS.ptaf },
  { key: 'ptaf_pct', label: 'PTAF%' },
  { key: 'ptap', label: FEMALE_PTA_LABELS.ptap },
  { key: 'ptap_pct', label: 'PTAP%' },
  { key: 'pl', label: FEMALE_PTA_LABELS.pl },
  { key: 'dpr', label: FEMALE_PTA_LABELS.dpr },
  { key: 'liv', label: 'LIV' },
  { key: 'scs', label: FEMALE_PTA_LABELS.scs },
  { key: 'mast', label: 'MAST' },
  { key: 'met', label: 'MET' },
  { key: 'rp', label: 'RP' },
  { key: 'da', label: 'DA' },
  { key: 'ket', label: 'KET' },
  { key: 'mf', label: 'MF' },
  { key: 'ptat', label: FEMALE_PTA_LABELS.ptat },
  { key: 'udc', label: 'UDC' },
  { key: 'flc', label: 'FLC' },
  { key: 'sce', label: 'SCE' },
  { key: 'dce', label: 'DCE' },
  { key: 'ssb', label: 'SSB' },
  { key: 'dsb', label: 'DSB' },
  { key: 'h_liv', label: 'H LIV' },
  { key: 'ccr', label: 'CCR' },
  { key: 'hcr', label: 'HCR' },
  { key: 'fi', label: 'FI' },
  { key: 'bwc', label: 'BWC' },
  { key: 'sta', label: 'STA' },
  { key: 'str', label: 'STR' },
  { key: 'dfm', label: 'DFM' },
  { key: 'rua', label: 'RUA' },
  { key: 'rls', label: 'RLS' },
  { key: 'rtp', label: 'RTP' },
  { key: 'ftl', label: 'FTL' },
  { key: 'rw', label: 'RW' },
  { key: 'rlr', label: 'RLR' },
  { key: 'fta', label: 'FTA' },
  { key: 'fls', label: 'FLS' },
  { key: 'fua', label: 'FUA' },
  { key: 'ruh', label: 'RUH' },
  { key: 'ruw', label: 'RUW' },
  { key: 'ucl', label: 'UCL' },
  { key: 'udp', label: 'UDP' },
  { key: 'ftp', label: 'FTP' },
  { key: 'rfi', label: 'RFI' },
  { key: 'gfi', label: 'GFI' }
] as const;

export const SUMMARY_TRAITS = [
  'tpi',
  'nm_dollar',
  'hhp_dollar',
  'ptam',
  'ptaf'
] as const satisfies readonly PredictionTraitKey[];

export type PredictionTraitKey = typeof PREDICTION_TRAITS[number]['key'];

export interface BullSummary {
  id: string;
  naab: string;
  name: string;
  company?: string | null;
  ptas: Partial<Record<PredictionTraitKey, number | null>>;
}

export type PredictionResult = Record<PredictionTraitKey, number | null>;

const toTwoDecimals = (value: number) => Math.round(value * 100) / 100;

export function mapBullRecord(record: BullsDenormSelection | null): BullSummary | null {
  if (!record || !record.code) {
    return null;
  }

  const naab = record.code.toUpperCase();

  const ptas: Partial<Record<PredictionTraitKey, number | null>> = {};

  for (const trait of PREDICTION_TRAITS) {
    const value = record[trait.key as keyof BullsDenormSelection];
    ptas[trait.key] = typeof value === 'number' ? value : null;
  }

  return {
    id: record.id ?? naab,
    naab,
    name: record.name ?? naab,
    company: record.company ?? null,
    ptas
  };
}

export function calculatePedigreePrediction({
  sire,
  mgs,
  mmgs
}: {
  sire: BullSummary | null;
  mgs: BullSummary | null;
  mmgs: BullSummary | null;
}): PredictionResult {
  const result: PredictionResult = {} as PredictionResult;

  for (const trait of PREDICTION_TRAITS) {
    const sireValue = sire?.ptas[trait.key];
    const mgsValue = mgs?.ptas[trait.key];
    const mmgsValue = mmgs?.ptas[trait.key];

    if (
      sireValue == null ||
      mgsValue == null ||
      mmgsValue == null
    ) {
      result[trait.key] = null;
      continue;
    }

    const predicted =
      sireValue * GENETIC_WEIGHTS.sire +
      mgsValue * GENETIC_WEIGHTS.mgs +
      mmgsValue * GENETIC_WEIGHTS.mmgs;

    result[trait.key] = toTwoDecimals(predicted);
  }

  return result;
}

export function formatPredictionValue(value: number | null | undefined): string {
  if (value == null) {
    return '—';
  }

  return value.toFixed(2);
}

export function formatBullValue(value: number | null | undefined): string {
  if (value == null) {
    return '—';
  }

  return value.toFixed(2);
}
