import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string | null;
  direction: SortDirection;
}

const DEFAULT_SORT: SortConfig = { column: null, direction: 'asc' };

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return null;
  }

  // Try numeric parse first (US format: comma = thousands, dot = decimal)
  // so we don't misinterpret strings like "3,167" as a date.
  const cleaned = stringValue.replace(/\s+/g, '').replace(/[^0-9.,-]/g, '');
  if (cleaned && /[0-9]/.test(cleaned)) {
    let normalized = cleaned;
    const hasDot = cleaned.includes('.');
    const hasComma = cleaned.includes(',');
    if (hasComma && hasDot) {
      // Assume comma = thousands, dot = decimal
      normalized = cleaned.replace(/,/g, '');
    } else if (hasComma) {
      const parts = cleaned.split(',');
      const looksLikeThousands = parts.length > 1 && parts.slice(1).every(p => /^\d{3}$/.test(p));
      normalized = looksLikeThousands ? cleaned.replace(/,/g, '') : cleaned.replace(',', '.');
    }
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  // Fallback: try parsing as date only when string contains date separators
  if (/[\/\-]/.test(stringValue)) {
    const timestamp = Date.parse(stringValue);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return null;
}

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function useAnimalTableSort<T>(
  items: T[],
  getValue: (item: T, column: string) => unknown,
  initialConfig: SortConfig = DEFAULT_SORT
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialConfig);

  const sortedItems = useMemo(() => {
    if (!sortConfig.column) {
      return items;
    }

    const { column, direction } = sortConfig;
    return [...items].sort((a, b) => {
      const aValue = getValue(a, column);
      const bValue = getValue(b, column);

      const aNumber = parseNumericValue(aValue);
      const bNumber = parseNumericValue(bValue);

      if (aNumber !== null && bNumber !== null) {
        if (aNumber === bNumber) {
          return 0;
        }
        return direction === 'asc' ? aNumber - bNumber : bNumber - aNumber;
      }

      const aString = normalizeString(aValue);
      const bString = normalizeString(bValue);
      if (aString === bString) {
        return 0;
      }
      return direction === 'asc'
        ? collator.compare(aString, bString)
        : collator.compare(bString, aString);
    });
  }, [items, sortConfig, getValue]);

  const requestSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        column,
        direction: 'asc'
      };
    });
  }, []);

  return {
    sortedItems,
    sortConfig,
    requestSort
  };
}
