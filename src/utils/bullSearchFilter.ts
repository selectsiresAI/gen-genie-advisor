/**
 * Builds a PostgREST OR filter string for bull search.
 * Handles NAAB normalization, breed variant expansion (H↔HO, J↔JE, B↔BS, A↔AY),
 * and searches across code, name, and registration fields.
 */
export function buildBullSearchFilter(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const escape = (s: string) => s.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const escaped = escape(trimmed);

  // Always search name and registration with the raw term
  const filters: string[] = [
    `name.ilike.%${escaped}%`,
    `code.ilike.%${escaped}%`,
  ];

  // Normalize: uppercase, strip spaces/hyphens, strip leading zeros
  const normalized = trimmed
    .replace(/[\s\-]+/g, '')
    .toUpperCase()
    .replace(/^0+([1-9]\d*[A-Z])/, '$1');

  const escapedNorm = escape(normalized);

  // Add normalized variant if different from raw
  if (escapedNorm.toUpperCase() !== escaped.toUpperCase()) {
    filters.push(`code.ilike.%${escapedNorm}%`);
  }

  // Breed expansion: H↔HO, J↔JE, B↔BS, A↔AY
  // Only the first matching expansion applies
  const expansions: [RegExp, string][] = [
    [/^(\d*)H(\d+)$/, '$1HO$2'],
    [/^(\d*)HO(\d+)$/, '$1H$2'],
    [/^(\d*)J(\d+)$/, '$1JE$2'],
    [/^(\d*)JE(\d+)$/, '$1J$2'],
    [/^(\d*)B(\d+)$/, '$1BS$2'],
    [/^(\d*)BS(\d+)$/, '$1B$2'],
    [/^(\d*)A(\d+)$/, '$1AY$2'],
    [/^(\d*)AY(\d+)$/, '$1A$2'],
  ];

  for (const [pattern, replacement] of expansions) {
    if (pattern.test(escapedNorm)) {
      const variant = escapedNorm.replace(pattern, replacement);
      filters.push(`code.ilike.%${variant}%`);
      break;
    }
  }

  return filters.join(',');
}
