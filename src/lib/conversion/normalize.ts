const ACCENTS_MAP: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a',
  Á: 'a', À: 'a', Â: 'a', Ã: 'a', Ä: 'a', Å: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e', É: 'e', È: 'e', Ê: 'e', Ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i', Í: 'i', Ì: 'i', Î: 'i', Ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o', Ó: 'o', Ò: 'o', Ô: 'o', Õ: 'o', Ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u', Ú: 'u', Ù: 'u', Û: 'u', Ü: 'u',
  ç: 'c', Ç: 'c', ñ: 'n', Ñ: 'n',
};

const SYMBOL_SUBSTITUTIONS: Record<string, string> = {
  '$': ' dollar ',
  '%': ' percent ',
  '#': ' number ',
  '+': ' plus ',
  '&': ' and ',
  '/': ' ',
  '\\': ' ',
  '-': ' ',
  '.': ' ',
};

export function normalizeAlias(input: string): string {
  if (!input) {
    return '';
  }

  let normalized = input.trim();

  normalized = normalized
    .split('')
    .map((char) => ACCENTS_MAP[char] ?? char)
    .join('');

  for (const [symbol, replacement] of Object.entries(SYMBOL_SUBSTITUTIONS)) {
    normalized = normalized.replace(new RegExp(`\\${symbol}`, 'g'), replacement);
  }

  normalized = normalized
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  normalized = normalized.replace(/[^a-z0-9]+/g, '_');

  return normalized.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}
