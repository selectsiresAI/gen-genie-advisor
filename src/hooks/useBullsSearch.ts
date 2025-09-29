import { useEffect, useMemo, useRef, useState } from 'react';
import { searchBulls, type BullsSelection } from '@/supabase/queries/bulls';

const DEFAULT_DEBOUNCE = 300;

export interface UseBullsSearchOptions {
  farmId?: string;
  limit?: number;
  debounceMs?: number;
}

interface UseBullsSearchState {
  query: string;
  setQuery: (value: string) => void;
  results: BullsSelection[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export function useBullsSearch(options: UseBullsSearchOptions = {}): UseBullsSearchState {
  const { farmId, limit = 25, debounceMs = DEFAULT_DEBOUNCE } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BullsSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const activeRequest = useRef(0);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!normalizedQuery) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    if (normalizedQuery.length < 2) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    const requestId = ++activeRequest.current;
    const handler = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await searchBulls(normalizedQuery, { farmId, limit });

        if (activeRequest.current === requestId) {
          setResults(data);
          setHasSearched(true);
        }
      } catch (err) {
        if (activeRequest.current === requestId) {
          setError(err instanceof Error ? err.message : 'Erro ao buscar touros');
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (activeRequest.current === requestId) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => window.clearTimeout(handler);
  }, [debounceMs, farmId, limit, normalizedQuery]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasSearched
  };
}
