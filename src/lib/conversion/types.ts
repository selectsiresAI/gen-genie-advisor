export interface AliasSuggestion {
  alias_original: string;
  suggested_canonical_key: string;
  source_hint?: string;
  confidence?: number;
}

export interface InventoryRow {
  canonical_key: string;
  label: string;
  category: string;
  synonyms?: string[];
  description?: string;
}

export type DetectionMethod = 'exact' | 'regex' | 'fuzzy' | 'unmapped';

export interface DetectionRow {
  alias_original: string;
  suggested: string;
  method: DetectionMethod;
  score: number;
  occurrences: string[];
  source_hint?: string;
}

export interface DetectOptions {
  inventory?: InventoryRow[];
  externalMappings?: AliasSuggestion[];
}

export interface PreviewRow {
  before: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface UploadResult {
  fileName: string;
  headers: string[];
  inventory: InventoryRow[];
  previewRows: PreviewRow[];
  workbookData: ArrayBuffer;
  primarySheetName?: string;
}
