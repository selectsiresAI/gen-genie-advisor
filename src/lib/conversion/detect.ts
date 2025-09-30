import rawSuggestions from '../../../data/column_alias_suggestions.json?raw';
import rawSuggestionsCsv from '../../../data/column_alias_suggestions.csv?raw';
import { normalizeAlias } from './normalize';
import type { AliasSuggestion, DetectionRow, InventoryRow } from './types';

const parsedJson = (() => {
  try {
    const parsed = JSON.parse(rawSuggestions);
    if (Array.isArray(parsed?.mappings)) {
      return parsed.mappings as AliasSuggestion[];
    }
  } catch (error) {
    console.warn('[conversion] Não foi possível interpretar JSON de aliases.', error);
  }
  return [] as AliasSuggestion[];
})();

const parsedCsv = (() => {
  try {
    return rawSuggestionsCsv
      .split(/\r?\n/)
      .slice(1)
      .filter(Boolean)
      .map((line) => {
        const [alias_original, suggested_canonical_key, source_hint, confidence] = line.split(',');
        return {
          alias_original: alias_original?.trim() ?? '',
          suggested_canonical_key: suggested_canonical_key?.trim() ?? '',
          source_hint: source_hint?.trim(),
          confidence: confidence ? Number.parseFloat(confidence) : undefined,
        } satisfies AliasSuggestion;
      });
  } catch (error) {
    console.warn('[conversion] Não foi possível interpretar CSV de aliases.', error);
    return [] as AliasSuggestion[];
  }
})();

const SUGGESTIONS = [...parsedJson, ...parsedCsv].reduce<AliasSuggestion[]>((acc, current) => {
  if (!current.alias_original || !current.suggested_canonical_key) {
    return acc;
  }
  const exists = acc.find(
    (item) =>
      normalizeAlias(item.alias_original) === normalizeAlias(current.alias_original) &&
      item.suggested_canonical_key === current.suggested_canonical_key,
  );
  if (!exists) {
    acc.push(current);
  }
  return acc;
}, []);

const REGEX_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /^nm(\$)?$/, canonical: 'nm_dollar' },
  { pattern: /^net[\s_-]?merit$/, canonical: 'nm_dollar' },
  { pattern: /^m[ée]rito[\s_-]?l[ií]quido$/, canonical: 'nm_dollar' },
  { pattern: /^hhp(\$)?$/, canonical: 'hhp_dollar' },
  { pattern: /^tpi$/, canonical: 'tpi' },
  { pattern: /^pta[mn]$/, canonical: 'ptam' },
  { pattern: /^ptaf(\s|_|-)?%?$/, canonical: 'ptaf_percent' },
  { pattern: /^ptap(\s|_|-)?%?$/, canonical: 'ptap_percent' },
  { pattern: /^scs$/, canonical: 'scs' },
  { pattern: /^dpr$/, canonical: 'dpr' },
  { pattern: /^birth(_|\s)?date$/, canonical: 'birth_date' },
];

function jaroDistance(s1: string, s2: string): number {
  const str1 = s1.toLowerCase();
  const str2 = s2.toLowerCase();

  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0 && len2 === 0) return 1;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const str1Matches = new Array<boolean>(len1).fill(false);
  const str2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (str2Matches[j]) continue;
      if (str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) /
    3;
  return jaro;
}

function jaroWinkler(s1: string, s2: string, prefixScaling = 0.1): number {
  const jaro = jaroDistance(s1, s2);
  const maxPrefix = 4;
  let prefix = 0;

  for (let i = 0; i < Math.min(maxPrefix, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaro + prefix * prefixScaling * (1 - jaro);
}

function buildOccurrences(inventory?: InventoryRow[]): Record<string, string[]> {
  const occurrenceMap: Record<string, string[]> = {};
  if (!inventory) return occurrenceMap;

  for (const row of inventory) {
    const columns = row.columns.split(',').map((column) => column.trim()).filter(Boolean);
    for (const column of columns) {
      const normalized = normalizeAlias(column);
      if (!occurrenceMap[normalized]) {
        occurrenceMap[normalized] = [];
      }
      occurrenceMap[normalized].push(`${row.sheet}/${column}`);
    }
  }

  return occurrenceMap;
}

export interface DetectOptions {
  inventory?: InventoryRow[];
}

export function detectAliasesFromHeaders(headers: string[], options: DetectOptions = {}): DetectionRow[] {
  const occurrenceMap = buildOccurrences(options.inventory);
  const results: DetectionRow[] = [];

  for (const header of headers) {
    const normalizedHeader = normalizeAlias(header);
    const occurrences = occurrenceMap[normalizedHeader] ?? [];

    let best: DetectionRow | null = null;

    const exactMatch = SUGGESTIONS.find(
      (suggestion) => normalizeAlias(suggestion.alias_original) === normalizedHeader,
    );

    if (exactMatch) {
      best = {
        alias_original: header,
        suggested: exactMatch.suggested_canonical_key,
        method: 'exact',
        score: exactMatch.confidence ?? 0.99,
        occurrences,
      };
    }

    if (!best) {
      const regexMatch = REGEX_PATTERNS.find((entry) => entry.pattern.test(normalizedHeader));
      if (regexMatch) {
        best = {
          alias_original: header,
          suggested: regexMatch.canonical,
          method: 'regex',
          score: 0.92,
          occurrences,
        };
      }
    }

    if (!best) {
      const fuzzyCandidates = SUGGESTIONS.map((suggestion) => ({
        suggestion,
        score: jaroWinkler(normalizedHeader, normalizeAlias(suggestion.alias_original)),
      }))
        .filter((entry) => entry.score >= 0.88)
        .sort((a, b) => b.score - a.score);

      if (fuzzyCandidates.length > 0) {
        const topCandidate = fuzzyCandidates[0];
        best = {
          alias_original: header,
          suggested: topCandidate.suggestion.suggested_canonical_key,
          method: 'fuzzy',
          score: topCandidate.score,
          occurrences,
        };
      }
    }

    if (!best) {
      best = {
        alias_original: header,
        suggested: '',
        method: 'unmapped',
        score: 0,
        occurrences,
      };
    }

    results.push(best);
  }

  return results;
}
