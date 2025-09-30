import type { InventoryRow } from './types';

export const CONFIDENCE_BADGE_MAP = {
  high: 0.95,
  medium: 0.85,
  low: 0.6,
};

export const KNOWN_CANONICAL_COLUMNS: Array<InventoryRow & { description?: string }> = [
  {
    canonical_key: 'farm_name',
    label: 'Nome da Fazenda',
    category: 'identificacao',
    description: 'Identifica a fazenda de origem do registro.',
    synonyms: ['fazenda', 'propriedade', 'nome_fazenda'],
  },
  {
    canonical_key: 'animal_id',
    label: 'Identificador do Animal',
    category: 'identificacao',
    description: 'Código único utilizado para o animal.',
    synonyms: ['animal', 'brinco', 'id_animal', 'registro'],
  },
  {
    canonical_key: 'lactation_number',
    label: 'Número da Lactação',
    category: 'PTA',
    description: 'Número sequencial de lactações do animal.',
    synonyms: ['lactacao', 'n_lactacao', 'lact'],
  },
  {
    canonical_key: 'milk_yield',
    label: 'Produção de Leite',
    category: 'PTA',
    description: 'Quantidade de leite produzida na coleta.',
    synonyms: ['producao_leite', 'kg_leite', 'leite'],
  },
  {
    canonical_key: 'collection_date',
    label: 'Data da Coleta',
    category: 'indice',
    description: 'Data de referência do registro.',
    synonyms: ['data', 'dt_coleta', 'data_coleta'],
  },
];

export const REQUIRED_CANONICAL_KEYS = ['farm_name', 'animal_id'];
