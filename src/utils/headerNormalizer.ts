/**
 * Normaliza cabeçalhos de planilhas importadas para chaves canônicas.
 *
 * O usuário pode enviar "Id Fazenda", "ID_Fazenda", "id fazenda", "idFazenda" etc.
 * Esta utilidade converte qualquer variação para a chave canônica esperada pelo sistema.
 *
 * Também fornece `parseUniversalSpreadsheet()` que lida com:
 *  - CSV com delimitador `;` ou `,` (auto-detectado)
 *  - Encoding ISO-8859-1 / Windows-1252 (auto-detectado)
 *  - XLSX / XLS / XLSM via xlsx library
 *  - Normalização automática dos cabeçalhos
 */
import * as XLSX from 'xlsx';

// Remove acentos, espaços extras, underscores, hifens e converte para minúscula
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[_\-./]+/g, ' ')         // separadores → espaço
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → espaço
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');             // espaços múltiplos → único
}

type AliasMap = Record<string, string[]>;

/**
 * Banco de aliases genérico.
 * Chave = nome canônico, valor = lista de variações normalizadas
 * que devem mapear para essa chave.
 */
const HEADER_ALIASES: AliasMap = {
  // ── Identificação (PedigreePredictor / Nexus1 / ToolSS) ──
  'idFazenda':           ['id fazenda', 'idfazenda', 'id farm', 'farm id', 'codigo fazenda', 'cod fazenda'],
  'Nome':                ['nome', 'name', 'nome animal', 'nome femea', 'nome touro'],
  'dataNascimento':      ['data nascimento', 'datanascimento', 'data nasc', 'data nasc.', 'data de nascimento', 'birth date', 'birthdate', 'dt nascimento', 'dt nasc', 'nascimento', 'dob'],
  'naabPai':             ['naab pai', 'naabpai', 'sire naab', 'sirenaab', 'sire', 'pai', 'naab do pai', 'naab sire', 'cod pai', 'codigo pai'],
  'naabAvoMaterno':      ['naab avo materno', 'naabavomaterno', 'mgs naab', 'mgsnaab', 'mgs', 'avo materno', 'naab avo', 'naab do avo materno', 'avo', 'avo mat', 'maternal grandsire', 'mat grandsire'],
  'naabBisavoMaterno':   ['naab bisavo materno', 'naabbisavomaterno', 'mmgs naab', 'mmgsnaab', 'mmgs', 'bisavo materno', 'naab bisavo', 'naab bis', 'naab do bisavo materno', 'bisavo', 'bis', 'maternal great grandsire'],

  // ── Identificação genérica (ToolSSApp) ──
  'Naab':                ['naab', 'naab code', 'codigo naab', 'cod naab', 'code'],
  'Brinco':              ['brinco', 'tag', 'ear tag', 'eartag', 'identificador', 'identifier', 'id'],
  'Pedigree':            ['pedigree', 'ped'],
  'Empresa':             ['empresa', 'company', 'central', 'centrais', 'fornecedor'],

  // ── Ordem de parto / categoria ──
  'OrdemParto':          ['ordem parto', 'ordem de parto', 'ordemparto', 'parity', 'parity order', 'paridade', 'lactacao', 'lactation'],
  'Categoria':           ['categoria', 'category', 'cat'],
  'Ano':                 ['ano', 'year', 'ano nasc'],

  // ── Pais (nomes) ──
  'NomePai':             ['nome pai', 'nomepai', 'sire name', 'sirename', 'pai nome'],

  // ── Índices econômicos ──
  'ID Fazenda':          ['id fazenda'],
  'HHP$®':               ['hhp$', 'hhp', 'hhp dollar', 'hhp$®'],
  'TPI':                 ['tpi'],
  'NM$':                 ['nm$', 'nm', 'net merit', 'merito liquido', 'nm dollar', 'nmdollar'],
  'CM$':                 ['cm$', 'cm', 'cm dollar'],
  'FM$':                 ['fm$', 'fm', 'fm dollar'],
  'GM$':                 ['gm$', 'gm', 'gm dollar', 'grazing merit'],
  'F SAV':               ['f sav', 'fsav', 'feed saved'],

  // ── Produção ──
  'PTAM':                ['ptam', 'pta milk', 'milk', 'leite'],
  'CFP':                 ['cfp'],
  'PTAF':                ['ptaf', 'pta fat', 'fat', 'gordura'],
  'PTAF%':               ['ptaf%', 'ptaf pct', '% fat', 'fat%', 'fat pct', 'gordura%'],
  'PTAP':                ['ptap', 'pta pro', 'pta protein', 'protein', 'proteina', 'proteína'],
  'PTAP%':               ['ptap%', 'ptap pct', '% pro', 'pro%', 'protein%', 'proteina%'],

  // ── Saúde / Longevidade ──
  'PL':                  ['pl', 'prod life', 'productive life'],
  'DPR':                 ['dpr', 'pta dpr'],
  'LIV':                 ['liv', 'pta liv', 'livability'],
  'SCS':                 ['scs', 'ccs', 'somatic cell'],
  'MAST':                ['mast', 'mastitis', 'mastite'],
  'MET':                 ['met', 'metritis', 'metrite'],
  'RP':                  ['rp', 'retained placenta', 'retencao placenta'],
  'DA':                  ['da', 'displaced abomasum', 'deslocamento abomaso'],
  'KET':                 ['ket', 'ketosis', 'cetose'],
  'MF':                  ['mf', 'milk fever'],
  'H LIV':               ['h liv', 'hliv', 'heifer livability', 'heifer liv'],

  // ── Conformação ──
  'PTAT':                ['ptat', 'pta type', 'tipo'],
  'UDC':                 ['udc'],
  'FLC':                 ['flc'],
  'BWC':                 ['bwc'],
  'STA':                 ['sta', 'stature'],
  'STR':                 ['str', 'strength'],
  'DFM':                 ['dfm', 'dairy form', 'df'],
  'RUA':                 ['rua', 'rump angle', 'ra'],
  'RLS':                 ['rls', 'rear legs side'],
  'RTP':                 ['rtp', 'rump width'],
  'FTL':                 ['ftl', 'teat length', 'tl'],
  'RW':                  ['rw', 'teat width', 'tw'],
  'RLR':                 ['rlr', 'rear legs rear'],
  'FTA':                 ['fta', 'foot angle', 'fa'],
  'FLS':                 ['fls', 'feet legs score'],
  'FUA':                 ['fua', 'fore udder attachment'],
  'RUH':                 ['ruh', 'rear udder height'],
  'RUW':                 ['ruw', 'rear udder width'],
  'UCL':                 ['ucl', 'udder cleft', 'uc'],
  'UDP':                 ['udp', 'udder depth', 'ud'],
  'FTP':                 ['ftp', 'front teat placement'],

  // ── Reprodução ──
  'SCE':                 ['sce', 'sire calving ease'],
  'DCE':                 ['dce', 'daughter calving ease'],
  'SSB':                 ['ssb', 'sire stillbirth'],
  'DSB':                 ['dsb', 'daughter stillbirth'],
  'CCR':                 ['ccr', 'cow conception rate'],
  'HCR':                 ['hcr', 'heifer conception rate'],
  'FI':                  ['fi', 'fertil index', 'fertility index'],
  'GL':                  ['gl', 'pta gl', 'gestation length'],
  'EFC':                 ['efc', 'early first calving'],

  // ── Eficiência ──
  'RFI':                 ['rfi', 'residual feed intake'],
  'GFI':                 ['gfi', 'feed effic', 'feed efficiency'],

  // ── Caseínas ──
  'Beta-Casein':         ['beta casein', 'betacasein', 'beta caseina', 'b casein', 'a2a2'],
  'Kappa-Casein':        ['kappa casein', 'kappacasein', 'kappa caseina', 'k casein'],

  // ── Milk (alias ToolSS) ──
  'Milk':                ['milk', 'leite'],
  'Fat':                 ['fat', 'gordura'],
  'Protein':             ['protein', 'proteina', 'proteína'],
};

// Pré-computa lookup: normalizado → canônico
const _lookupCache = new Map<string, string>();

function buildLookup(): Map<string, string> {
  if (_lookupCache.size > 0) return _lookupCache;
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    // A própria chave canônica normalizada deve resolver para si
    _lookupCache.set(normalize(canonical), canonical);
    for (const alias of aliases) {
      _lookupCache.set(alias, canonical); // aliases já estão normalizados
    }
  }
  return _lookupCache;
}

/**
 * Dado um cabeçalho qualquer, retorna a chave canônica correspondente.
 * Se não encontrar, devolve o cabeçalho original inalterado.
 */
export function resolveHeader(header: string): string {
  const lookup = buildLookup();
  const n = normalize(header);
  return lookup.get(n) ?? header;
}

/**
 * Remapeia todas as chaves de um objeto (linha da planilha)
 * usando o banco de aliases.
 *
 * Exemplo:
 *   { "Id Fazenda": "F01", "Naab Pai": "007HO..." }
 *   → { "idFazenda": "F01", "naabPai": "007HO..." }
 */
export function normalizeRowHeaders<T extends Record<string, any>>(row: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const canonical = resolveHeader(key);
    // Se já existe (duas colunas mapearam para o mesmo canônico), manter o primeiro não-vazio
    if (result[canonical] === undefined || result[canonical] === '' || result[canonical] === null) {
      result[canonical] = value;
    }
  }
  return result;
}

/**
 * Dado um array de linhas (saída de XLSX.utils.sheet_to_json),
 * normaliza os cabeçalhos de todas as linhas.
 */
export function normalizeAllRows(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(normalizeRowHeaders);
}

// ─── Detecção de encoding ────────────────────────────────────────────────────

/**
 * Verifica se um ArrayBuffer contém bytes > 127 que não são UTF-8 válido.
 * Se sim, re-decodifica como Windows-1252 (latin1).
 */
function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Tenta UTF-8 primeiro
  const utf8 = new TextDecoder('utf-8', { fatal: true });
  try {
    return utf8.decode(bytes);
  } catch {
    // Fallback para Windows-1252 (cobre ISO-8859-1 + chars extras)
    const latin = new TextDecoder('windows-1252');
    return latin.decode(bytes);
  }
}

// ─── CSV parser robusto ──────────────────────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === delimiter) { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

function parseCSVText(text: string): Record<string, any>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line, delimiter);
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = cols[i]?.trim() ?? '';
    });
    return obj;
  });
}

// ─── Parser universal ────────────────────────────────────────────────────────

function isCSVFile(fileName: string): boolean {
  return /\.(csv|tsv|txt)$/i.test(fileName);
}

/**
 * Lê qualquer arquivo de planilha (CSV, XLSX, XLS, XLSM) e retorna
 * um array de objetos com cabeçalhos já normalizados.
 *
 * Resolve automaticamente:
 *  - Encoding (UTF-8 / ISO-8859-1 / Windows-1252)
 *  - Delimitador CSV (; ou , ou tab)
 *  - Mapeamento de cabeçalhos via banco de aliases
 */
export async function parseUniversalSpreadsheet(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer();

  let rawRows: Record<string, any>[];

  if (isCSVFile(file.name)) {
    // CSV: decodifica texto com detecção de encoding e parse manual
    const text = decodeText(buffer);
    rawRows = parseCSVText(text);
  } else {
    // XLSX / XLS / XLSM: usa a biblioteca xlsx
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
  }

  // Normaliza cabeçalhos
  return rawRows.map(normalizeRowHeaders);
}
