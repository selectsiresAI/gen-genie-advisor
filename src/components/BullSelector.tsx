import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useBullsSearch } from '@/hooks/useBullsSearch';
import { getBullByNaab, type BullsSelection } from '@/supabase/queries/bulls';

export interface BullSearchResult {
  id: string;
  code: string;
  name: string;
  company?: string;
  ptas?: any;
  hhp_dollar?: number | null;
  tpi?: number | null;
  nm_dollar?: number | null;
}

interface BullSelectorProps {
  label?: string;
  placeholder?: string;
  value?: BullSearchResult | null;
  onChange: (bull: BullSearchResult | null) => void;
  disabled?: boolean;
  showPTAs?: boolean;
  className?: string;
}

const generateFallbackId = () => `bull-${Math.random().toString(36).slice(2, 10)}`;

export function BullSelector({
  label = "Selecionar Touro",
  placeholder = "Digite o código NAAB ou selecione da lista",
  value,
  onChange,
  disabled = false,
  showPTAs = false,
  className = ""
}: BullSelectorProps) {
  const [naabInput, setNaabInput] = useState("");
  const [searchMode, setSearchMode] = useState<'dropdown' | 'naab'>('dropdown');
  const [isOpen, setIsOpen] = useState(false);
  const [naabValidation, setNaabValidation] = useState<{
    isValid: boolean;
    message: string;
    bull?: BullSearchResult;
  } | null>(null);
  const [isValidatingNaab, setIsValidatingNaab] = useState(false);

  const { query, setQuery, results, isLoading, error, hasSearched } = useBullsSearch({ limit: 50 });

  const convertedResults = useMemo(() => {
    const toResult = (bull: BullsSelection): BullSearchResult => ({
      id: bull.id ?? bull.code ?? generateFallbackId(),
      code: bull.code ?? '',
      name: bull.name ?? '',
      company: bull.company ?? undefined,
      ptas: (bull as any).ptas,
      hhp_dollar: bull.hhp_dollar ?? null,
      tpi: bull.tpi ?? null,
      nm_dollar: bull.nm_dollar ?? null
    });

    return results.map(toResult);
  }, [results]);

  // Filter bulls based on search term
  const filteredBulls = useMemo(() => {
    if (!query) {
      return convertedResults;
    }

    const normalized = query.toLowerCase();
    return convertedResults.filter((bull) =>
      bull.name.toLowerCase().includes(normalized) ||
      bull.code.toLowerCase().includes(normalized) ||
      (bull.company && bull.company.toLowerCase().includes(normalized))
    );
  }, [convertedResults, query]);

  // Validate NAAB code
  const validateNaab = async (naab: string) => {
    if (!naab.trim()) {
      setNaabValidation(null);
      return;
    }

    try {
      setIsValidatingNaab(true);
      const bull = await getBullByNaab(naab.trim());

      if (bull) {
        setNaabValidation({
          isValid: true,
          message: 'Código NAAB válido',
          bull: {
            id: bull.id ?? bull.code ?? generateFallbackId(),
            code: bull.code ?? naab.trim(),
            name: bull.name ?? '',
            company: bull.company ?? undefined,
            ptas: (bull as any).ptas,
            hhp_dollar: bull.hhp_dollar ?? null,
            tpi: bull.tpi ?? null,
            nm_dollar: bull.nm_dollar ?? null
          }
        });
      } else {
        setNaabValidation({
          isValid: false,
          message: 'Código NAAB não encontrado'
        });
      }
    } catch (error) {
      console.error('Erro ao validar NAAB:', error);
      setNaabValidation({
        isValid: false,
        message: 'Erro ao validar código NAAB'
      });
    } finally {
      setIsValidatingNaab(false);
    }
  };

  // Handle NAAB input change with debounce
  useEffect(() => {
    if (searchMode !== 'naab') return;
    
    const timer = setTimeout(() => {
      validateNaab(naabInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [naabInput, searchMode]);

  const handleSelectBull = (bull: BullSearchResult) => {
    onChange(bull);
    setIsOpen(false);
    setQuery('');
  };

  const handleNaabSubmit = () => {
    if (naabValidation && naabValidation.isValid && naabValidation.bull) {
      onChange(naabValidation.bull);
      setNaabInput("");
      setNaabValidation(null);
    }
  };

  const clearSelection = () => {
    onChange(null);
    setQuery('');
    setNaabInput("");
    setNaabValidation(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>{label}</Label>
        
        {/* Mode selector */}
        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            variant={searchMode === 'dropdown' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchMode('dropdown')}
          >
            Lista de Touros
          </Button>
          <Button
            type="button"
            variant={searchMode === 'naab' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchMode('naab')}
          >
            Buscar por NAAB
          </Button>
        </div>

        {/* Current selection display */}
        {value && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{value.code} - {value.name}</div>
                  {value.company && (
                    <div className="text-sm text-muted-foreground">{value.company}</div>
                  )}
                  {showPTAs && (
                    <div className="flex gap-2 mt-2">
                      {value.hhp_dollar && (
                        <Badge variant="secondary">HHP$: {value.hhp_dollar}</Badge>
                      )}
                      {value.tpi && (
                        <Badge variant="secondary">TPI: {value.tpi}</Badge>
                      )}
                      {value.nm_dollar && (
                        <Badge variant="secondary">NM$: {value.nm_dollar}</Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dropdown mode */}
        {searchMode === 'dropdown' && !value && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-start text-left font-normal"
                disabled={disabled}
              >
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                {isLoading ? "Buscando touros..." : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
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
                  <CommandGroup>
                    {isLoading && (
                      <CommandItem disabled value="carregando">
                        Buscando touros...
                      </CommandItem>
                    )}
                    {filteredBulls.map((bull) => (
                      <CommandItem
                        key={bull.id}
                        value={`${bull.code} ${bull.name} ${bull.company || ''}`}
                        onSelect={() => handleSelectBull(bull)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {bull.code} - {bull.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bull.company || "Sem empresa"}
                            {showPTAs && bull.tpi && (
                              <span className="ml-2">TPI: {bull.tpi}</span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {error && (
                <div className="border-t bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* NAAB input mode */}
        {searchMode === 'naab' && !value && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código NAAB (ex: 200HO12345)"
                value={naabInput}
                onChange={(e) => setNaabInput(e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleNaabSubmit}
                disabled={!naabValidation?.isValid || isValidatingNaab}
              >
                Selecionar
              </Button>
            </div>

            {/* NAAB validation feedback */}
            {naabValidation && (
              <div
                className={`text-sm p-2 rounded ${
                  naabValidation.isValid
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {naabValidation.message}
                {naabValidation.isValid && naabValidation.bull && (
                  <div className="mt-1 font-medium">
                    {naabValidation.bull.code} - {naabValidation.bull.name}
                    {naabValidation.bull.company && (
                      <span className="text-xs ml-2">({naabValidation.bull.company})</span>
                    )}
                  </div>
                )}
              </div>
            )}
            {isValidatingNaab && (
              <div className="text-xs text-muted-foreground">Validando código NAAB...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}