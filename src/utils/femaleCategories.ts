/**
 * Lógica centralizada de categorização de fêmeas
 * Esta é a ÚNICA fonte de verdade para cálculo de categorias
 * Baseada na lógica da página HerdPage
 */

export type FemaleCategory = 'Bezerra' | 'Novilha' | 'Primípara' | 'Secundípara' | 'Multípara' | 'Indefinida';
export type FemaleCategoryLower = 'bezerra' | 'novilha' | 'primipara' | 'secundipara' | 'multipara' | 'todas';

/**
 * Calcula a categoria de uma fêmea baseado em data de nascimento e ordem de parto
 * 
 * Regras:
 * 1. Se tem ordem de parto > 0, usa ela:
 *    - parity_order = 1 → Primípara
 *    - parity_order = 2 → Secundípara  
 *    - parity_order >= 3 → Multípara
 * 
 * 2. Se não tem ordem de parto, usa idade em meses:
 *    - 0-12 meses → Bezerra
 *    - 13-23 meses → Novilha
 *    - 24-36 meses → Primípara
 *    - 37-48 meses → Secundípara
 *    - 49+ meses → Multípara
 */
export function getAutomaticCategory(birthDate?: string | null, parityOrder?: number | null): FemaleCategory {
  if (!birthDate) return 'Indefinida';
  
  const birth = new Date(birthDate);
  const today = new Date();
  const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

  // Se tem ordem de parto definida (maior que 0), usa ela
  if (parityOrder && parityOrder > 0) {
    if (parityOrder === 1) return 'Primípara';
    if (parityOrder === 2) return 'Secundípara';
    if (parityOrder >= 3) return 'Multípara';
  }

  // Se não tem ordem de parto, usa idade em meses
  if (ageInMonths <= 12) return 'Bezerra';
  if (ageInMonths <= 23) return 'Novilha';
  if (ageInMonths <= 36) return 'Primípara';
  if (ageInMonths <= 48) return 'Secundípara';
  return 'Multípara';
}

/**
 * Versão lowercase da categoria para uso em filtros da Auditoria Genética
 */
export function getAutomaticCategoryLower(birthDate?: string | null, parityOrder?: number | null): FemaleCategoryLower {
  const category = getAutomaticCategory(birthDate, parityOrder);
  
  switch (category) {
    case 'Bezerra': return 'bezerra';
    case 'Novilha': return 'novilha';
    case 'Primípara': return 'primipara';
    case 'Secundípara': return 'secundipara';
    case 'Multípara': return 'multipara';
    default: return 'novilha'; // fallback
  }
}

/**
 * Calcula as contagens de categorias para um array de fêmeas
 */
export interface CategoryCounts {
  total: number;
  bezerras: number;
  novilhas: number;
  primiparas: number;
  secundiparas: number;
  multiparas: number;
}

export function calculateCategoryCounts(females: Array<{ birth_date?: string | null; parity_order?: number | null }>): CategoryCounts {
  const counts: CategoryCounts = {
    total: females.length,
    bezerras: 0,
    novilhas: 0,
    primiparas: 0,
    secundiparas: 0,
    multiparas: 0
  };

  females.forEach(female => {
    const category = getAutomaticCategory(female.birth_date, female.parity_order);
    switch (category) {
      case 'Bezerra':
        counts.bezerras++;
        break;
      case 'Novilha':
        counts.novilhas++;
        break;
      case 'Primípara':
        counts.primiparas++;
        break;
      case 'Secundípara':
        counts.secundiparas++;
        break;
      case 'Multípara':
        counts.multiparas++;
        break;
    }
  });

  return counts;
}
