// Nome amigável em PT/EN/ES para cada chave canônica (sigla).
// Usado na tabela de mapeamento para ajudar o usuário a entender a sigla.

type Names = { pt: string; en: string; es: string };

export const TRAIT_FRIENDLY_NAMES: Record<string, Names> = {
  // Identificação
  identifier: { pt: "Identificador (Brinco)", en: "Identifier (Tag)", es: "Identificador (Arete)" },
  name: { pt: "Nome do animal", en: "Animal name", es: "Nombre del animal" },
  cdcb_id: { pt: "Código internacional (CDCB)", en: "International code (CDCB)", es: "Código internacional (CDCB)" },
  birth_date: { pt: "Data de nascimento", en: "Birth date", es: "Fecha de nacimiento" },
  category: { pt: "Categoria", en: "Category", es: "Categoría" },
  parity_order: { pt: "Ordem de parto", en: "Parity order", es: "Orden de parto" },
  sire_naab: { pt: "NAAB do Pai", en: "Sire NAAB", es: "NAAB del Padre" },
  mgs_naab: { pt: "NAAB do Avô Materno", en: "MGS NAAB", es: "NAAB del Abuelo Materno" },
  mmgs_naab: { pt: "NAAB do Bisavô Materno", en: "MGGS NAAB", es: "NAAB del Bisabuelo Materno" },

  // Índices econômicos
  "HHP$": { pt: "Vaca Saudável Altamente Produtiva", en: "Healthy Highly Productive Cow", es: "Vaca Saludable Altamente Productiva" },
  TPI: { pt: "Índice de Mérito Total", en: "Total Performance Index", es: "Índice de Mérito Total" },
  "NM$": { pt: "Mérito Líquido", en: "Net Merit", es: "Mérito Neto" },
  "CM$": { pt: "Mérito Queijo", en: "Cheese Merit", es: "Mérito Queso" },
  "FM$": { pt: "Mérito Fluido", en: "Fluid Merit", es: "Mérito Fluido" },
  "GM$": { pt: "Mérito Pasto", en: "Grazing Merit", es: "Mérito Pastoreo" },
  "F SAV": { pt: "Alimento Economizado", en: "Feed Saved", es: "Alimento Ahorrado" },

  // Produção
  PTAM: { pt: "Produção de Leite", en: "Milk Production", es: "Producción de Leche" },
  CFP: { pt: "Gordura + Proteína Combinadas", en: "Combined Fat + Protein", es: "Grasa + Proteína Combinadas" },
  PTAF: { pt: "Quantidade de Gordura (lbs)", en: "Fat (lbs)", es: "Cantidad de Grasa (lbs)" },
  "PTAF%": { pt: "% de Gordura", en: "Fat %", es: "% de Grasa" },
  PTAP: { pt: "Quantidade de Proteína (lbs)", en: "Protein (lbs)", es: "Cantidad de Proteína (lbs)" },
  "PTAP%": { pt: "% de Proteína", en: "Protein %", es: "% de Proteína" },

  // Saúde / fertilidade
  PL: { pt: "Vida Produtiva", en: "Productive Life", es: "Vida Productiva" },
  DPR: { pt: "Taxa de Prenhez das Filhas", en: "Daughter Pregnancy Rate", es: "Tasa de Preñez de Hijas" },
  LIV: { pt: "Sobrevivência da Vaca", en: "Cow Livability", es: "Supervivencia de la Vaca" },
  "H LIV": { pt: "Sobrevivência da Novilha", en: "Heifer Livability", es: "Supervivencia de la Novilla" },
  SCS: { pt: "Escore de Células Somáticas", en: "Somatic Cell Score", es: "Puntaje de Células Somáticas" },
  MAST: { pt: "Mastite", en: "Mastitis", es: "Mastitis" },
  MET: { pt: "Metrite", en: "Metritis", es: "Metritis" },
  RP: { pt: "Retenção de Placenta", en: "Retained Placenta", es: "Retención de Placenta" },
  DA: { pt: "Deslocamento de Abomaso", en: "Displaced Abomasum", es: "Desplazamiento de Abomaso" },
  KET: { pt: "Cetose", en: "Ketosis", es: "Cetosis" },
  MF: { pt: "Febre do Leite (Hipocalcemia)", en: "Milk Fever", es: "Fiebre de la Leche" },
  CCR: { pt: "Taxa de Concepção de Vacas", en: "Cow Conception Rate", es: "Tasa de Concepción de Vacas" },
  HCR: { pt: "Taxa de Concepção de Novilhas", en: "Heifer Conception Rate", es: "Tasa de Concepción de Novillas" },
  FI: { pt: "Índice de Fertilidade", en: "Fertility Index", es: "Índice de Fertilidad" },
  GL: { pt: "Duração da Gestação", en: "Gestation Length", es: "Duración de la Gestación" },
  EFC: { pt: "Idade ao Primeiro Parto", en: "Early First Calving", es: "Edad al Primer Parto" },
  RFI: { pt: "Eficiência Alimentar Residual", en: "Residual Feed Intake", es: "Consumo Alimenticio Residual" },

  // Tipo / conformação
  PTAT: { pt: "Classificação Final para Tipo", en: "Type", es: "Tipo" },
  UDC: { pt: "Composto do Úbere", en: "Udder Composite", es: "Compuesto de Ubre" },
  FLC: { pt: "Composto de Pernas e Pés", en: "Feet & Leg Composite", es: "Compuesto de Patas y Pezuñas" },
  BWC: { pt: "Composto Corporal", en: "Body Composite", es: "Compuesto Corporal" },
  STA: { pt: "Estatura", en: "Stature", es: "Estatura" },
  STR: { pt: "Força", en: "Strength", es: "Fuerza" },
  DFM: { pt: "Forma Leiteira", en: "Dairy Form", es: "Forma Lechera" },
  BD: { pt: "Bobby Depth (Profundidade do Torso)", en: "Bobby Depth (Body Depth)", es: "Bobby Depth (Profundidad del Tórax)" },
  RUA: { pt: "Ângulo da Garupa", en: "Rump Angle", es: "Ángulo de la Grupa" },
  RLS: { pt: "Pernas (vista lateral)", en: "Rear Legs Side", es: "Patas (vista lateral)" },
  RLR: { pt: "Pernas (vista posterior)", en: "Rear Legs Rear", es: "Patas (vista trasera)" },
  RW: { pt: "Largura da Garupa", en: "Rump/Thurl Width", es: "Ancho de Grupa" },
  FTA: { pt: "Ângulo dos Cascos", en: "Foot Angle", es: "Ángulo de Pezuñas" },
  FLS: { pt: "Escore de Patas e Pés", en: "Feet & Legs Score", es: "Puntaje de Patas y Pezuñas" },
  FUA: { pt: "Inserção Anterior do Úbere", en: "Fore Udder Attachment", es: "Inserción Anterior de Ubre" },
  RUH: { pt: "Altura do Úbere Posterior", en: "Rear Udder Height", es: "Altura de Ubre Posterior" },
  RUW: { pt: "Largura do Úbere", en: "Rear Udder Width", es: "Ancho de Ubre" },
  UCL: { pt: "Ligamento Médio", en: "Udder Cleft", es: "Ligamento Medio" },
  UDP: { pt: "Profundidade do Úbere", en: "Udder Depth", es: "Profundidad de Ubre" },
  FTP: { pt: "Colocação dos Tetos Anteriores", en: "Front Teat Placement", es: "Colocación de Pezones Anteriores" },
  RTP: { pt: "Colocação dos Tetos Posteriores", en: "Rear Teat Placement", es: "Colocación de Pezones Posteriores" },
  FTL: { pt: "Comprimento dos Tetos", en: "Teat Length", es: "Longitud de Pezones" },

  // Parto / natimorto
  SCE: { pt: "Facilidade de Parto (Touro)", en: "Sire Calving Ease", es: "Facilidad de Parto (Toro)" },
  DCE: { pt: "Facilidade de Parto (Filha)", en: "Daughter Calving Ease", es: "Facilidad de Parto (Hija)" },
  SSB: { pt: "Natimorto (Touro)", en: "Sire Stillbirth", es: "Natimuerto (Toro)" },
  DSB: { pt: "Natimorto (Filha)", en: "Daughter Stillbirth", es: "Natimuerto (Hija)" },

  // Genética / caseína
  GFI: { pt: "Índice de Fertilidade Genética", en: "Genetic Fertility Index", es: "Índice de Fertilidad Genética" },
  "Beta-Casein": { pt: "Beta-Caseína", en: "Beta-Casein", es: "Beta-Caseína" },
  "Kappa-Casein": { pt: "Kappa-Caseína", en: "Kappa-Casein", es: "Kappa-Caseína" },

  Fonte: { pt: "Fonte do dado", en: "Data source", es: "Fuente del dato" },
};

const normalize = (s: string) => s.trim().toLowerCase();

const LOOKUP: Record<string, Names> = (() => {
  const m: Record<string, Names> = {};
  for (const [k, v] of Object.entries(TRAIT_FRIENDLY_NAMES)) {
    m[normalize(k)] = v;
  }
  return m;
})();

export function getTraitFriendlyName(canonical: string, locale: string): string | undefined {
  if (!canonical) return undefined;
  const entry = LOOKUP[normalize(canonical)];
  if (!entry) return undefined;
  if (locale === "en-US") return entry.en;
  if (locale === "es") return entry.es;
  return entry.pt;
}
