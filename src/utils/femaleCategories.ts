/**
 * Lógica centralizada de categorização de fêmeas
 * Esta é a ÚNICA fonte de verdade para cálculo de categorias
 * 
 * NOVA REGRA (padronizada):
 * 1. Calcula deliveries = days_alive / 365 (sem bissexto)
 * 2. Mapeia deliveries para parity_order:
 *    - 0,00-1,00 → 0 (bezerra)
 *    - 1,01-1,99 → 0.1 (novilha)
 *    - 2,00-2,99 → 1 (primípara)
 *    - 3,00-3,99 → 2 (secundípara)
 *    - ≥4,00 → 3 (multípara)
 */

export type FemaleCategory = 'Bezerra' | 'Novilha' | 'Primípara' | 'Secundípara' | 'Multípara' | 'Indefinida';
export type FemaleCategoryLower = 'bezerra' | 'novilha' | 'primipara' | 'secundipara' | 'multipara' | 'todas';

/**
 * Calcula deliveries (número de partos estimado) baseado na data de nascimento
 */
export function calculateDeliveries(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  // Validar data no futuro
  if (birth.getTime() > today.getTime()) return null;
  
  const daysAlive = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  const deliveries = daysAlive / 365;
  
  return deliveries;
}

/**
 * Calcula parity_order baseado em deliveries
 * Mapeamento:
 * - 0,00-1,00 → 0
 * - 1,01-1,99 → 0.1
 * - 2,00-2,99 → 1
 * - 3,00-3,99 → 2
 * - ≥4,00 → 3
 */
export function calculateParityOrder(deliveries: number | null): number | null {
  if (deliveries === null) return null;
  
  if (deliveries <= 1.00) return 0;
  if (deliveries < 2.00) return 0.1;
  if (deliveries < 3.00) return 1;
  if (deliveries < 4.00) return 2;
  return 3;
}

/**
 * Mapeia parity_order para categoria
 */
export function parityOrderToCategory(parityOrder: number | null): FemaleCategory {
  if (parityOrder === null) return 'Indefinida';
  
  if (parityOrder === 0) return 'Bezerra';
  if (parityOrder === 0.1) return 'Novilha';
  if (parityOrder === 1) return 'Primípara';
  if (parityOrder === 2) return 'Secundípara';
  if (parityOrder >= 3) return 'Multípara';
  
  return 'Indefinida';
}

/**
 * Calcula a categoria de uma fêmea baseado APENAS em data de nascimento
 * Esta é a função principal que deve ser usada em toda a aplicação
 */
export function getAutomaticCategory(birthDate?: string | null, _parityOrder?: number | null): FemaleCategory {
  const deliveries = calculateDeliveries(birthDate);
  const parityOrder = calculateParityOrder(deliveries);
  return parityOrderToCategory(parityOrder);
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
