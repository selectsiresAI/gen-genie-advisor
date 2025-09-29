import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useBullsSearch } from '@/hooks/useBullsSearch';
import { getBullByNaab, type BullsSelection } from '@/supabase/queries/bulls';

export interface BullChipData {
  id: string;
  code: string;
  name: string;
  company?: string | null;
  registry?: string | null;
  record?: BullsSelection;
}

interface BullMultiSelectorProps {
  className?: string;
  farmId?: string;
  initialSelection?: BullChipData[];
  selectionLimit?: number;
  onConfirm: (bulls: BullsSelection[]) => Promise<void> | void;
  onClear?: () => void;
}

const generateId = () => `bull-${Math.random().toString(36).slice(2, 10)}`;

export function BullMultiSelector({
  className,
  farmId,
  initialSelection = [],
  selectionLimit = 5,
  onConfirm,
  onClear
}: BullMultiSelectorProps) {
  const { query, setQuery, results, isLoading, error, hasSearched } = useBullsSearch({
    farmId,
    limit: selectionLimit * 5
  });

  const [selected, setSelected] = useState<BullChipData[]>(initialSelection);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setSelected(initialSelection);
  }, [initialSelection]);

  const remainingSlots = selectionLimit - selected.length;

  const availableResults = useMemo(() => {
    if (!results.length) return [];
    const existingCodes = new Set(selected.map((bull) => bull.code.toUpperCase()));
    return results.filter((item) => !existingCodes.has((item.code ?? '').toUpperCase()));
  }, [results, selected]);

  const handleAdd = (record: BullsSelection) => {
    if (!record.code) return;
    if (selected.find((bull) => bull.code.toUpperCase() === record.code!.toUpperCase())) {
      return;
    }
    if (selected.length >= selectionLimit) {
      return;
    }

    setSelected((prev) => [
      ...prev,
      {
        id: record.id ?? record.code ?? generateId(),
        code: record.code ?? '',
        name: record.name ?? '',
        company: record.company,
        registry: record.registration,
        record
      }
    ]);
    setQuery('');
  };

  const handleRemove = (code: string) => {
    setSelected((prev) => prev.filter((bull) => bull.code.toUpperCase() !== code.toUpperCase()));
    setActionError(null);
  };

  const handleClear = () => {
    setSelected([]);
    setQuery('');
    setActionError(null);
    onClear?.();
  };

  const handleConfirm = async () => {
    if (!selected.length) {
      setActionError('Selecione ao menos um touro.');
      return;
    }

    setIsConfirming(true);
    setActionError(null);

    try {
      const resolved = await Promise.all(
        selected.map(async (item) => {
          if (item.record) {
            return item.record;
          }

          const fetched = await getBullByNaab(item.code, { farmId });
          if (fetched) {
            return fetched;
          }

          throw new Error(`Touro ${item.code} não encontrado no banco.`);
        })
      );

      await onConfirm(resolved);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível confirmar a seleção.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Selecionar touros</p>
            <p className="text-xs text-muted-foreground">
              Busque por NAAB, nome ou registro. Resultados limitados a {selectionLimit} touros por vez.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {selected.length}/{selectionLimit} selecionados
          </Badge>
        </div>
        <div className="mt-3">
          <Command className="rounded-lg border">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={remainingSlots > 0 ? 'Buscar touros por nome, NAAB ou registro' : 'Limite atingido'}
                disabled={remainingSlots <= 0}
              />
            </div>
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandEmpty>
                {hasSearched ? (
                  <div className="py-6 text-center text-sm">
                    <p className="font-medium">Nenhum touro encontrado.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tente: NAAB completo (ex. 29HO12345) ou parte do nome/registro.
                    </p>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Digite ao menos 2 caracteres para iniciar a busca.
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup heading="Resultados">
                {isLoading && (
                  <CommandItem disabled>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando touros...
                    </span>
                  </CommandItem>
                )}
                {availableResults.map((item) => (
                  <CommandItem
                    key={`${item.code}-${item.id ?? item.name ?? generateId()}`}
                    onSelect={() => handleAdd(item)}
                    className="flex flex-col items-start"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {item.code}
                      {item.company && (
                        <span className="text-xs font-normal text-muted-foreground">{item.company}</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.name || 'Nome não informado'}
                    </span>
                    {item.registration && (
                      <span className="text-[10px] text-muted-foreground">Registro: {item.registration}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">Touros selecionados</p>
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((bull) => (
              <Badge
                key={bull.code}
                variant="secondary"
                className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
              >
                <span className="font-semibold">{bull.code}</span>
                <span className="text-muted-foreground">{bull.name || 'Sem nome'}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(bull.code)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                  aria-label={`Remover ${bull.code}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum touro selecionado ainda. Utilize a busca acima para adicionar.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleConfirm} disabled={isConfirming || !selected.length}>
          {isConfirming ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirmando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Confirmar seleção
            </span>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={handleClear} disabled={!selected.length || isConfirming}>
          Limpar
        </Button>
        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}
        {remainingSlots <= 0 && (
          <p className="text-xs text-muted-foreground">Limite de seleção atingido. Remova um touro para adicionar outro.</p>
        )}
      </div>
    </div>
  );
}
