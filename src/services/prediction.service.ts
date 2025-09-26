import {
  NEXUS2_PTA_DEFINITIONS,
  NEXUS2_PTA_KEY_TO_LABEL
} from '@/constants/nexus2Ptas';
import type { BullsDenormSelection } from '@/supabase/queries/bulls';

export const GENETIC_WEIGHTS = {
  sire: 0.57,
  mgs: 0.28,
  mmgs: 0.15
} as const;

export const PREDICTION_TRAITS = NEXUS2_PTA_DEFINITIONS;

export type PredictionTraitKey = typeof PREDICTION_TRAITS[number]['key'];

export const SUMMARY_TRAITS = [
  'tpi',
  'nm_dollar',
  'hhp_dollar',
  'ptam',
  'ptaf'
] satisfies readonly PredictionTraitKey[];

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
    ptas[trait.key] = typeof value === 'number' ? value : value ?? null;
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

const formatTraitValue = (
  key: PredictionTraitKey,
  value: number | null | undefined
): string => {
  if (value == null) {
    return '—';
  }

  const label = NEXUS2_PTA_KEY_TO_LABEL[key];

  if (label?.includes('$') || label === 'HHP$®') {
    return Math.round(value).toString();
  }

  if (label?.includes('%')) {
    return value.toFixed(2);
  }

  return value.toFixed(2);
};

export function formatPredictionValue(
  key: PredictionTraitKey,
  value: number | null | undefined
): string {
  return formatTraitValue(key, value);
}

export function formatBullValue(
  key: PredictionTraitKey,
  value: number | null | undefined
): string {
  return formatTraitValue(key, value);
}
