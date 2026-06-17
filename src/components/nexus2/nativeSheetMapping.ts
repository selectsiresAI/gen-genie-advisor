import { normalizeKey, jaroWinkler } from '@/pages/tools/conversao/utils';

export type NativeTargetKey =
  | 'idFazenda'
  | 'nome'
  | 'dataNascimento'
  | 'naabPai'
  | 'naabAvoMaterno'
  | 'naabBisavoMaterno';

export interface NativeTarget {
  key: NativeTargetKey;
  /** Header canônico usado no CSV gerado para o parser existente */
  canonicalHeader: string;
  labelPt: string;
  labelEn: string;
  labelEs: string;
  required: boolean;
  /** Aliases normalizados (já passados por normalizeKey) */
  aliases: string[];
  /** Regex aplicado ao header normalizado para detecção secundária */
  regex?: RegExp[];
}

const norm = (s: string) => normalizeKey(s);

export const NATIVE_TARGETS: NativeTarget[] = [
  {
    key: 'idFazenda',
    canonicalHeader: 'ID_Fazenda',
    labelPt: 'ID Fazenda',
    labelEn: 'Farm ID',
    labelEs: 'ID Granja',
    required: false,
    aliases: [
      'id_fazenda', 'id fazenda', 'idfazenda',
      'id_farm', 'farm_id', 'farmid',
      'codigo_fazenda', 'cod_fazenda', 'cod fazenda',
      'numero', 'num', 'n', 'no',
      'id', 'codigo', 'cod', 'code',
      'brinco', 'tag', 'rfid',
      'matricula', 'registro',
      'id_animal', 'id animal', 'idanimal', 'animal_id', 'animalid',
      'codigo_animal', 'cod_animal',
      'id_granja', 'id granja', 'idgranja',
    ].map(norm),
  },
  {
    key: 'nome',
    canonicalHeader: 'Nome',
    labelPt: 'Nome',
    labelEn: 'Name',
    labelEs: 'Nombre',
    required: false,
    aliases: [
      'nome', 'name', 'nombre',
      'nome_animal', 'nome animal', 'nomeanimal',
      'nome_femea', 'nome femea',
      'animal_name', 'animalname',
      'descricao', 'descripcion', 'description',
    ].map(norm),
  },
  {
    key: 'dataNascimento',
    canonicalHeader: 'Data_de_Nascimento',
    labelPt: 'Data de Nascimento',
    labelEn: 'Birth Date',
    labelEs: 'Fecha de Nacimiento',
    required: false,
    aliases: [
      'data_de_nascimento', 'data de nascimento', 'datadenascimento',
      'data_nascimento', 'data nascimento', 'datanascimento',
      'data_nasc', 'datanasc', 'dt_nasc', 'dtnasc',
      'nascimento', 'nasc',
      'dn', 'd_n',
      'birth_date', 'birth date', 'birthdate', 'birth',
      'dob', 'date_of_birth', 'date of birth',
      'fecha_de_nacimiento', 'fecha de nacimiento', 'fechadenacimiento',
      'fecha_nacimiento', 'fecha nacimiento', 'fechanacimiento',
      'fnac', 'f_nac',
    ].map(norm),
    regex: [/(^|_)d_?n($|_)/, /nasc/, /birth/, /dob/, /fec.*nac/],
  },
  {
    key: 'naabPai',
    canonicalHeader: 'naab_pai',
    labelPt: 'NAAB do Pai',
    labelEn: 'Sire NAAB',
    labelEs: 'NAAB del Padre',
    required: true,
    aliases: [
      'naab_pai', 'naab pai', 'naabpai',
      'pai_naab', 'pai naab', 'painaab',
      'naab_do_pai', 'naab_sire',
      'sire_naab', 'sire naab', 'sirenaab',
      'pai', 'sire', 'padre', 'father',
      'codigo_pai', 'cod_pai', 'codigopai',
      'reprodutor', 'touro', 'touro_pai',
      'sire_code', 'cod_sire',
      'naab_padre', 'codigo_padre',
    ].map(norm),
    regex: [/^pai/, /^sire/, /^padre/, /sire.*naab/, /naab.*pai/, /naab.*sire/, /naab.*padre/],
  },
  {
    key: 'naabAvoMaterno',
    canonicalHeader: 'naab_avo_materno',
    labelPt: 'NAAB do Avô Materno',
    labelEn: 'MGS NAAB',
    labelEs: 'NAAB del Abuelo Materno',
    required: false,
    aliases: [
      'naab_avo_materno', 'naab avo materno', 'naabavomaterno',
      'naab_avo', 'naab avo', 'naabavo',
      'avo_materno_naab', 'avo materno naab',
      'mgs_naab', 'mgs naab', 'mgsnaab',
      'mgs', 'avo', 'avo_mat', 'avo_materno', 'avo materno',
      'maternal_grandsire', 'mat_grandsire', 'grandsire',
      'codigo_avo_materno', 'cod_avo_mat',
      'abuelo_materno', 'abuelo materno', 'abuelomaterno',
      'naab_abuelo_materno', 'naab_abuelo',
    ].map(norm),
    regex: [/^mgs/, /mgs.*naab/, /naab.*mgs/, /avo.*mat/, /mat.*avo/, /grandsire/, /abuelo/],
  },
  {
    key: 'naabBisavoMaterno',
    canonicalHeader: 'naab_bisavo_materno',
    labelPt: 'NAAB do Bisavô Materno',
    labelEn: 'MGGS NAAB',
    labelEs: 'NAAB del Bisabuelo Materno',
    required: false,
    aliases: [
      'naab_bisavo_materno', 'naab bisavo materno', 'naabbisavomaterno',
      'naab_bisavo', 'naab bisavo', 'naabbisavo',
      'naab_bis', 'naab bis',
      'bisavo_materno_naab',
      'mmgs_naab', 'mmgs naab', 'mmgsnaab',
      'mmgs', 'mggs', 'mggs_naab',
      'bis', 'bisavo', 'bisavo_materno', 'bisavo materno', 'bisavo_mat',
      'maternal_great_grandsire', 'great_grandsire',
      'codigo_bisavo_materno', 'cod_bisavo_mat',
      'bisabuelo_materno', 'bisabuelo materno', 'bisabuelomaterno',
      'naab_bisabuelo_materno', 'naab_bisabuelo',
    ].map(norm),
    regex: [/^mmgs/, /^mggs/, /mmgs.*naab/, /naab.*mmgs/, /bisavo/, /great.*grandsire/, /bisabuelo/],
  },
];

export type MappingMethod = 'alias' | 'regex' | 'fuzzy' | 'none';

export interface DetectedField {
  target: NativeTarget;
  detectedHeader: string | null;
  method: MappingMethod;
  confidence: number;
}

const FUZZY_MIN = 0.82;

export function detectNativeMapping(headers: string[]): DetectedField[] {
  const used = new Set<string>();
  const normalizedHeaders = headers.map((h) => ({ original: h, key: norm(h), fuzzy: norm(h, true) }));

  const result: DetectedField[] = [];

  // Pass 1: alias exact match (high priority)
  for (const target of NATIVE_TARGETS) {
    const aliasSet = new Set(target.aliases);
    const hit = normalizedHeaders.find((h) => !used.has(h.original) && aliasSet.has(h.key));
    if (hit) {
      used.add(hit.original);
      result.push({ target, detectedHeader: hit.original, method: 'alias', confidence: 1 });
    } else {
      result.push({ target, detectedHeader: null, method: 'none', confidence: 0 });
    }
  }

  // Pass 2: regex (for unmatched targets)
  for (const detected of result) {
    if (detected.detectedHeader) continue;
    const regexes = detected.target.regex;
    if (!regexes?.length) continue;
    const hit = normalizedHeaders.find(
      (h) => !used.has(h.original) && regexes.some((re) => re.test(h.key))
    );
    if (hit) {
      used.add(hit.original);
      detected.detectedHeader = hit.original;
      detected.method = 'regex';
      detected.confidence = 0.95;
    }
  }

  // Pass 3: fuzzy on aliases (for still-unmatched targets)
  for (const detected of result) {
    if (detected.detectedHeader) continue;
    let bestScore = 0;
    let bestHeader: string | null = null;
    for (const h of normalizedHeaders) {
      if (used.has(h.original)) continue;
      for (const alias of detected.target.aliases) {
        const aliasFuzzy = norm(alias, true);
        const score = jaroWinkler(h.fuzzy, aliasFuzzy);
        if (score > bestScore) {
          bestScore = score;
          bestHeader = h.original;
        }
      }
    }
    if (bestHeader && bestScore >= FUZZY_MIN) {
      used.add(bestHeader);
      detected.detectedHeader = bestHeader;
      detected.method = 'fuzzy';
      detected.confidence = bestScore;
    }
  }

  return result;
}

export function targetLabel(target: NativeTarget, locale: string): string {
  if (locale === 'es') return target.labelEs;
  if (locale === 'en-US') return target.labelEn;
  return target.labelPt;
}
