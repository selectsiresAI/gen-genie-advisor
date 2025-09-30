import suggestionsJson from '../../../data/column_alias_suggestions.json';
import suggestionsCsvRaw from '../../../data/column_alias_suggestions.csv?raw';
import { KNOWN_CANONICAL_COLUMNS } from './constants';
import type { AliasSuggestion, DetectOptions, DetectionRow, InventoryRow } from './types';

interface SuggestionPayload {
  mappings?: AliasSuggestion[];
}

const parsedJson = ((suggestionsJson as SuggestionPayload)?.mappings ?? []).filter(
  (entry) => entry.alias_original && entry.suggested_canonical_key,
);

const parsedCsv: AliasSuggestion[] = suggestionsCsvRaw
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [alias = '', canonical = '', source_hint = '', confidence = ''] = line.split(',');
    return {
      alias_original: alias.trim(),
      suggested_canonical_key: canonical.trim(),
      source_hint: source_hint.trim() || undefined,
      confidence: confidence ? Number(confidence) : undefined,
    } satisfies AliasSuggestion;
  })
  .filter((entry) => entry.alias_original && entry.suggested_canonical_key);

const dedupeKey = (entry: AliasSuggestion) =>
  `${normalizeAlias(entry.alias_original)}::${normalizeAlias(entry.suggested_canonical_key)}`;

const suggestionMap = new Map<string, AliasSuggestion>();
[...parsedJson, ...parsedCsv].forEach((entry) => {
  const key = dedupeKey(entry);
  if (!suggestionMap.has(key)) {
    suggestionMap.set(key, entry);
  }
});

export const SUGGESTIONS: AliasSuggestion[] = Array.from(suggestionMap.values());

const CANONICAL_NORMALIZED_LOOKUP = buildCanonicalLookup();

interface RegexPattern {
  pattern: RegExp;
  canonical: string;
}

const REGEX_PATTERNS: RegexPattern[] = buildRegexPatterns();

function buildCanonicalLookup() {
  const map = new Map<string, string>();
  for (const column of KNOWN_CANONICAL_COLUMNS) {
    map.set(normalizeAlias(column.canonical_key), column.canonical_key);
    map.set(normalizeAlias(column.label), column.canonical_key);
    for (const synonym of column.synonyms ?? []) {
      map.set(normalizeAlias(synonym), column.canonical_key);
    }
  }
  return map;
}

function buildRegexPatterns(): RegexPattern[] {
  const patterns: RegexPattern[] = [];
  for (const column of KNOWN_CANONICAL_COLUMNS) {
    for (const synonym of column.synonyms ?? []) {
      const escaped = escapeRegExp(normalizeAlias(synonym).replace(/\s+/g, ' '));
      if (!escaped) continue;
      const regex = new RegExp(`(^|[^a-z0-9])${escaped.replace(/\s+/g, '[_\s-]*')}([^a-z0-9]|$)`);
      patterns.push({ pattern: regex, canonical: column.canonical_key });
    }
  }
  return patterns;
}

export function normalizeAlias(input: string): string {
  return input
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildOccurrences(inventory?: InventoryRow[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  if (!inventory) return map;

  for (const item of inventory) {
    const values = new Set<string>([
      item.canonical_key,
      item.label,
      ...(item.synonyms ?? []),
    ]);

    for (const value of values) {
      const normalized = normalizeAlias(value);
      if (!map[normalized]) map[normalized] = [];
      map[normalized].push(item.canonical_key);
    }
  }

  return map;
}

function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const matchA: boolean[] = new Array(a.length).fill(false);
  const matchB: boolean[] = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (matchB[j]) continue;
      if (a[i] !== b[j]) continue;
      matchA[i] = true;
      matchB[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  const aMatches: string[] = [];
  const bMatches: string[] = [];
  for (let i = 0; i < a.length; i++) if (matchA[i]) aMatches.push(a[i]);
  for (let j = 0; j < b.length; j++) if (matchB[j]) bMatches.push(b[j]);

  let transpositions = 0;
  for (let i = 0; i < aMatches.length; i++) {
    if (aMatches[i] !== bMatches[i]) transpositions++;
  }

  const jaro =
    (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;

  let prefix = 0;
  const maxPrefix = 4;
  for (; prefix < Math.min(maxPrefix, a.length, b.length); prefix++) {
    if (a[prefix] !== b[prefix]) break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

export function detectAliasesFromHeaders(headers: string[], options: DetectOptions = {}): DetectionRow[] {
  const occurrenceMap = buildOccurrences(options.inventory);

  const BASE_SUGGESTIONS: AliasSuggestion[] = [
    ...(options.externalMappings ?? []),
    ...SUGGESTIONS,
  ];

  const results: DetectionRow[] = [];

  for (const header of headers) {
    const normalizedHeader = normalizeAlias(header);
    const occurrences = occurrenceMap[normalizedHeader] ?? [];
    let best: DetectionRow | null = null;

    const canonicalDirect = CANONICAL_NORMALIZED_LOOKUP.get(normalizedHeader);
    if (canonicalDirect) {
      best = { alias_original: header, suggested: canonicalDirect, method: 'exact', score: 0.99, occurrences };
    }

    if (!best) {
      const exactMatch = BASE_SUGGESTIONS.find((s) => normalizeAlias(s.alias_original) === normalizedHeader);
      if (exactMatch) {
        best = {
          alias_original: header,
          suggested: exactMatch.suggested_canonical_key,
          method: 'exact',
          score: exactMatch.confidence ?? 0.99,
          occurrences,
          source_hint: exactMatch.source_hint,
        };
      }
    }

    if (!best) {
      const regexMatch = REGEX_PATTERNS.find((entry) => entry.pattern.test(normalizedHeader));
      if (regexMatch) {
        best = { alias_original: header, suggested: regexMatch.canonical, method: 'regex', score: 0.92, occurrences };
      }
    }

    if (!best) {
      const fuzzyCandidates = BASE_SUGGESTIONS
        .map((s) => ({ s, score: jaroWinkler(normalizedHeader, normalizeAlias(s.alias_original)) }))
        .filter((x) => x.score >= 0.88)
        .sort((a, b) => b.score - a.score);

      if (fuzzyCandidates.length > 0) {
        const top = fuzzyCandidates[0];
        best = {
          alias_original: header,
          suggested: top.s.suggested_canonical_key,
          method: 'fuzzy',
          score: top.score,
          occurrences,
          source_hint: top.s.source_hint,
        };
      }
    }

    if (!best) {
      best = { alias_original: header, suggested: '', method: 'unmapped', score: 0, occurrences };
    }

    results.push(best);
  }

  return results;
}
