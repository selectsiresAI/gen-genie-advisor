import type { CanonicalColumn } from './types';

export const KNOWN_CANONICAL_COLUMNS: CanonicalColumn[] = [
  { canonical_key: 'nm_dollar', label_pt: 'NM$', label_en: 'Net Merit', datatype: 'number', category: 'indice' },
  { canonical_key: 'hhp_dollar', label_pt: 'HHP$', label_en: 'Herd Health Profit', datatype: 'number', category: 'indice' },
  { canonical_key: 'tpi', label_pt: 'TPI', label_en: 'Total Performance Index', datatype: 'number', category: 'indice' },
  { canonical_key: 'ptam', label_pt: 'PTAM', label_en: 'PTA Milk', datatype: 'number', category: 'PTA', unit: 'lb' },
  { canonical_key: 'ptaf_percent', label_pt: 'PTAF%', label_en: 'PTA Fat %', datatype: 'percent', category: 'PTA', unit: '%' },
  { canonical_key: 'ptap_percent', label_pt: 'PTAP%', label_en: 'PTA Protein %', datatype: 'percent', category: 'PTA', unit: '%' },
  { canonical_key: 'scs', label_pt: 'SCS', label_en: 'Somatic Cell Score', datatype: 'number', category: 'indice' },
  { canonical_key: 'dpr', label_pt: 'DPR', label_en: 'Daughter Pregnancy Rate', datatype: 'percent', category: 'meta', unit: '%' },
  { canonical_key: 'birth_date', label_pt: 'Data de Nascimento', label_en: 'Birth Date', datatype: 'date', category: 'sensor' },
];

export const CONFIDENCE_BADGE_MAP = {
  high: 0.95,
  medium: 0.88,
};
