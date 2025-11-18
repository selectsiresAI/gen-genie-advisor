/**
 * Normaliza códigos NAAB de touros seguindo a mesma lógica do banco de dados
 * Esta função deve estar sincronizada com a função normalize_naab() do Postgres
 */
export function normalizeNaabCode(code: string | null | undefined): string | null {
  if (!code || code.trim() === '') {
    return null;
  }

  // Remove espaços e hífens, converte para uppercase
  let normalized = code.trim().replace(/[\s-]/g, '').toUpperCase();
  
  // Remove caracteres não alfanuméricos
  normalized = normalized.replace(/[^0-9A-Z]/g, '');
  
  // Remove zeros à esquerda antes de dígitos seguidos de letras
  // Exemplo: 029HO21549 → 29HO21549, 007HO12345 → 7HO12345
  normalized = normalized.replace(/^0+([1-9]\d*[A-Z]+)/, '$1');
  normalized = normalized.replace(/^0+([A-Z]+)/, '$1');
  
  return normalized || null;
}

/**
 * Verifica se dois códigos NAAB são equivalentes após normalização
 */
export function naabCodesMatch(code1: string | null | undefined, code2: string | null | undefined): boolean {
  const normalized1 = normalizeNaabCode(code1);
  const normalized2 = normalizeNaabCode(code2);
  
  if (!normalized1 || !normalized2) {
    return false;
  }
  
  return normalized1 === normalized2;
}
