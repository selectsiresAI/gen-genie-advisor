export interface AliasSuggestion {
  alias_original: string;
  suggested_canonical_key: string;
  source_hint?: string;
  confidence?: number;
}

export type DetectionMethod = 'exact' | 'regex' | 'fuzzy' | 'unmapped';

export interface DetectionRow {
  alias_original: string;
  suggested: string;
  method: DetectionMethod;
  score: number;
  occurrences: string[];
}

export interface InventoryRow {
  sheet: string;
  columns: string;
}

export interface CanonicalColumn {
  canonical_key: string;
  label_pt?: string;
  label_en?: string;
  datatype?: 'number' | 'percent' | 'string' | 'date';
  unit?: string;
  category?: 'PTA' | 'indice' | 'meta' | 'sensor';
  required?: boolean;
}

export interface PreviewRow {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}
