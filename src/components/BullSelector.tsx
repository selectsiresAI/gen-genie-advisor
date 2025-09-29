import React, { useMemo, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useBullsSearch } from '@/hooks/useBullsSearch';
import type { BullsSelection } from '@/supabase/queries/bulls';

export interface BullSearchResult {
  id: string;
  code: string;
  name: string;
  company?: string | null;
  registry?: string | null;
  hhp_dollar?: number | null;
  tpi?: number | null;
  nm_dollar?: number | null;
  record?: BullsSelection;
}

interface BullSelectorProps {
  label?: string;
  placeholder?: string;
  value?: BullSearchResult | null;
  onChange: (bull: BullSearchResult | null) => void;
  disabled?: boolean;
  showPTAs?: boolean;
  className?: string;
  farmId?: string;
}

const generateFallbackId = () => `bull-${Math.random().toString(36).slice(2, 10)}`;

export function BullSelector({
  label = 'Selecionar Touro',
  placeholder = 'Digite o código NAAB ou selecione da lista',
  value,
  onChange,
  disabled = false,
  showPTAs = false,
  className = '',
  farmId
}: BullSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { query, setQuery, results, isLoading, error, hasSearched } = useBullsSearch({
    farmId,
    limit: 50
  });

  const convertedResults = useMemo(
    () =>
      results.map((bull) => ({
        id: bull.id ?? bull.code ?? generateFallbackId(),
        code: bull.code ?? '',
        name: bull.name ?? '',
        company: bull.company ?? null,
        registry: bull.registration ?? null,
        hhp_dollar: bull.hhp_dollar ?? null,
        tpi: bull.tpi ?? null,
        nm_dollar: bull.nm_dollar ?? null,
        record: bull
      })),
    [results]
  );

  const handleSelectBull = (bull: BullSearchResult) => {
    onChange(bull);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label>{label}</Label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={value ? 'secondary' : 'outline'}
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-start text-left font-normal"
            disabled={disabled}
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {value
              ? `${value.code} — ${value.name || 'Sem nome'}`
              : isLoading
                ? 'Buscando touros...'
                : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start" side="bottom">
          <Command>
            <CommandInput
              placeholder="Buscar touro (mín. 2 caracteres)"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {hasSearched
                  ? 'Nenhum touro encontrado. Tente o NAAB completo ou parte do nome/registro.'
                  : 'Digite ao menos 2 caracteres para buscar.'}
              </CommandEmpty>
              <CommandGroup heading="Resultados">
                {isLoading && (
                  <CommandItem disabled value="carregando" className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando touros...
                  </CommandItem>
                )}
                {convertedResults.map((bull) => (
                  <CommandItem
                    key={bull.id}
                    value={`${bull.code} ${bull.name}`}
                    onSelect={() => handleSelectBull(bull)}
                    className="flex flex-col items-start gap-1"
                  >
                    <span className="font-medium">{bull.code} — {bull.name || 'Sem nome'}</span>
                    <span className="text-xs text-muted-foreground">
                      {bull.company || 'Sem empresa'}
                      {bull.registry ? ` · Registro: ${bull.registry}` : ''}
                    </span>
                    {showPTAs && (bull.tpi || bull.hhp_dollar || bull.nm_dollar) && (
                      <span className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        {bull.hhp_dollar != null && <span>HHP$: {bull.hhp_dollar}</span>}
                        {bull.tpi != null && <span>TPI: {bull.tpi}</span>}
                        {bull.nm_dollar != null && <span>NM$: {bull.nm_dollar}</span>}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {error && <div className="border-t bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        </PopoverContent>
      </Popover>

      {value && (
        <Card>
          <CardContent className="flex items-start justify-between gap-3 p-3">
            <div className="space-y-1">
              <div className="font-medium">{value.code} — {value.name}</div>
              {(value.company || value.registry) && (
                <div className="text-xs text-muted-foreground">
                  {value.company}
                  {value.company && value.registry ? ' · ' : ''}
                  {value.registry}
                </div>
              )}
              {showPTAs && (
                <div className="flex flex-wrap gap-2">
                  {value.hhp_dollar != null && (
                    <Badge variant="secondary">HHP$: {value.hhp_dollar}</Badge>
                  )}
                  {value.tpi != null && <Badge variant="secondary">TPI: {value.tpi}</Badge>}
                  {value.nm_dollar != null && <Badge variant="secondary">NM$: {value.nm_dollar}</Badge>}
                </div>
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleClear} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
