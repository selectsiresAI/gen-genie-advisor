import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GlossaryTerm {
  id: string;
  term_key: string;
  category: string;
  pt_br: string;
  en_us: string | null;
  description: string | null;
  context: string | null;
  is_translatable: boolean;
  created_at: string;
  updated_at: string;
}

export function useGlossary() {
  const queryClient = useQueryClient();

  const { data: terms, isLoading, error } = useQuery({
    queryKey: ['technical_glossary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technical_glossary')
        .select('*')
        .order('category', { ascending: true })
        .order('term_key', { ascending: true });

      if (error) throw error;
      return data as GlossaryTerm[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['technical_glossary'] });
  };

  const getTerm = (termKey: string, locale: 'pt-BR' | 'en-US'): string | null => {
    if (!terms) return null;
    
    const term = terms.find(t => t.term_key === termKey);
    if (!term) return null;

    // If not translatable, always return pt_br
    if (!term.is_translatable) return term.pt_br;

    // Return translation based on locale
    return locale === 'en-US' ? (term.en_us || term.pt_br) : term.pt_br;
  };

  return {
    terms: terms || [],
    isLoading,
    error,
    invalidate,
    getTerm,
  };
}