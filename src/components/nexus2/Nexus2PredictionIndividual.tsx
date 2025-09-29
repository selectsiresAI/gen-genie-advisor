import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { getBullByNaab, searchBulls } from '@/supabase/queries/bulls';
import {
  BullSummary,
  PREDICTION_TRAITS,
  SUMMARY_TRAITS,
  calculatePedigreePrediction,
  formatBullValue,
  formatPredictionValue,
  mapBullRecord,
  type PredictionResult
} from '@/services/prediction.service';

const MIN_SEARCH_LENGTH = 2;

type NaabFieldController = ReturnType<typeof useNaabField>;

function useNaabField() {
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState<BullSummary | null>(null);
  const [suggestions, setSuggestions] = useState<BullSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      if (selected) {
        setSelected(null);
      }
      setIsSearching(false);
      return;
    }

    if (selected && trimmed.toUpperCase() === selected.naab) {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const records = await searchBulls(trimmed, { limit: 8 });
        const bulls = records
          .map(mapBullRecord)
          .filter((bull): bull is BullSummary => Boolean(bull));

        setSuggestions(bulls);
        setIsOpen(bulls.length > 0);
        setActiveIndex(bulls.length > 0 ? 0 : -1);
      } catch (error) {
        console.error('Erro ao buscar touros:', error);
        setSuggestions([]);
        setIsOpen(false);
        setActiveIndex(-1);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, selected]);

  const handleChange = (value: string) => {
    setInputValue(value.toUpperCase());
    setError(null);
  };

  const reset = () => {
    setInputValue('');
    setSelected(null);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError(null);
    setIsSearching(false);
  };

  return {
    inputValue,
    setInputValue: handleChange,
    selected,
    setSelected,
    suggestions,
    setSuggestions,
    isSearching,
    isConfirming,
    setIsConfirming,
    error,
    setError,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    reset
  };
}

interface NaabFieldProps {
  id: string;
  label: string;
  placeholder: string;
  controller: NaabFieldController;
  onConfirm: () => Promise<BullSummary | null>;
}

const NaabField: React.FC<NaabFieldProps> = ({ id, label, placeholder, controller, onConfirm }) => {
  const handleSelect = (bull: BullSummary) => {
    controller.setSelected(bull);
    controller.setInputValue(bull.naab);
    controller.setSuggestions([]);
    controller.setIsOpen(false);
    controller.setActiveIndex(-1);
    controller.setError(null);
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!controller.isOpen) {
        controller.setIsOpen(controller.suggestions.length > 0);
        return;
      }
      controller.setActiveIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= controller.suggestions.length) {
          return 0;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!controller.isOpen) {
        controller.setIsOpen(controller.suggestions.length > 0);
        return;
      }
      controller.setActiveIndex((prev) => {
        if (prev <= 0) {
          return controller.suggestions.length - 1;
        }
        return prev - 1;
      });
      return;
    }

    if (event.key === 'Enter') {
      if (controller.isOpen && controller.activeIndex >= 0) {
        event.preventDefault();
        const bull = controller.suggestions[controller.activeIndex];
        if (bull) {
          handleSelect(bull);
        }
        return;
      }

      event.preventDefault();
      await onConfirm();
      return;
    }

    if (event.key === 'Escape') {
      controller.setIsOpen(false);
      controller.setActiveIndex(-1);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={controller.inputValue}
            placeholder={placeholder}
            onChange={(event) => controller.setInputValue(event.target.value)}
            onFocus={() => {
              if (controller.suggestions.length > 0) {
                controller.setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-controls={`${id}-listbox`}
            aria-expanded={controller.isOpen}
            aria-activedescendant={
              controller.isOpen && controller.activeIndex >= 0
                ? `${id}-option-${controller.activeIndex}`
                : undefined
            }
            className={cn(
              controller.selected ? 'pr-10' : '',
              controller.error ? 'border-destructive focus-visible:ring-destructive' : ''
            )}
          />
          {controller.isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {controller.selected && !controller.isSearching && (
            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
          )}

          {controller.isOpen && (
            <div
              id={`${id}-listbox`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover shadow-lg"
            >
              {controller.suggestions.length === 0 && !controller.isSearching ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  {t('nexus2.naab.noResults')}
                </div>
              ) : (
                controller.suggestions.map((bull, index) => (
                  <button
                    key={bull.id}
                    id={`${id}-option-${index}`}
                    role="option"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(bull)}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors',
                      controller.activeIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                    )}
                    aria-selected={controller.activeIndex === index}
                  >
                    <span className="font-medium">{bull.naab}</span>
                    <span className="text-xs text-muted-foreground">{bull.name}</span>
                  </button>
                ))
              )}
              {controller.isSearching && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('nexus2.naab.loading')}
                </div>
              )}
            </div>
          )}
        </div>
        <Button type="button" onClick={onConfirm} disabled={controller.isConfirming}>
          {controller.isConfirming ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('nexus2.naab.loading')}
            </span>
          ) : (
            t('nexus2.naab.confirm')
          )}
        </Button>
      </div>
      {controller.error && (
        <p className="text-sm text-destructive">{controller.error}</p>
      )}
    </div>
  );
};

const summaryTraitLabels: Record<string, string> = PREDICTION_TRAITS.reduce((acc, trait) => {
  acc[trait.key] = trait.label;
  return acc;
}, {} as Record<string, string>);

const Nexus2PredictionIndividual: React.FC = () => {
  const sireField = useNaabField();
  const mgsField = useNaabField();
  const mmgsField = useNaabField();
  const { toast } = useToast();

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleConfirmField = async (
    controller: NaabFieldController,
    requiredMessage: string,
    notFoundMessage: string
  ) => {
    const previousId = controller.selected?.id ?? null;
    const value = controller.inputValue.trim();

    if (!value) {
      controller.setError(requiredMessage);
      controller.setSelected(null);
      return null;
    }

    controller.setIsConfirming(true);

    try {
      const record = await getBullByNaab(value);
      const bull = mapBullRecord(record);

      if (!bull) {
        controller.setError(notFoundMessage);
        controller.setSelected(null);
        return null;
      }

      controller.setSelected(bull);
      controller.setInputValue(bull.naab);
      controller.setSuggestions([]);
      controller.setIsOpen(false);
      controller.setActiveIndex(-1);
      controller.setError(null);

      if (bull.id !== previousId) {
        setPrediction(null);
      }

      return bull;
    } catch (error) {
      console.error('Erro ao confirmar NAAB:', error);
      controller.setError(notFoundMessage);
      controller.setSelected(null);
      return null;
    } finally {
      controller.setIsConfirming(false);
    }
  };

  const confirmSire = () =>
    handleConfirmField(
      sireField,
      t('nexus2.error.requiredSire'),
      t('nexus2.error.sireNotFound')
    );

  const confirmMgs = () =>
    handleConfirmField(
      mgsField,
      t('nexus2.error.requiredMgs'),
      t('nexus2.error.mgsNotFound')
    );

  const confirmMmgs = () =>
    handleConfirmField(
      mmgsField,
      t('nexus2.error.requiredMmgs'),
      t('nexus2.error.mmgsNotFound')
    );

  const handleCalculate = async () => {
    setIsCalculating(true);

    try {
      const sire = sireField.selected ?? (await confirmSire());
      if (!sire) {
        return;
      }

      const mgs = mgsField.selected ?? (await confirmMgs());
      if (!mgs) {
        return;
      }

      const mmgs = mmgsField.selected ?? (await confirmMmgs());
      if (!mmgs) {
        return;
      }

      const result = calculatePedigreePrediction({ sire, mgs, mmgs });
      setPrediction(result);
      toast({
        title: t('nexus2.individual.toast.success')
      });
    } catch (error) {
      console.error('Erro ao calcular predição individual:', error);
      toast({
        variant: 'destructive',
        title: t('nexus2.individual.toast.error')
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    sireField.reset();
    mgsField.reset();
    mmgsField.reset();
    setPrediction(null);
  };

  const canCalculate = useMemo(
    () => Boolean(sireField.selected && mgsField.selected && mmgsField.selected),
    [sireField.selected, mgsField.selected, mmgsField.selected]
  );

  const selectedBulls = useMemo(
    () => [
      { label: t('nexus2.individual.naab.sire'), bull: sireField.selected },
      { label: t('nexus2.individual.naab.mgs'), bull: mgsField.selected },
      { label: t('nexus2.individual.naab.mmgs'), bull: mmgsField.selected }
    ],
    [sireField.selected, mgsField.selected, mmgsField.selected]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t('nexus2.tabs.individual')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <NaabField
            id="nexus2-sire-naab"
            label={t('nexus2.individual.naab.sire')}
            placeholder={t('nexus2.naab.placeholder')}
            controller={sireField}
            onConfirm={confirmSire}
          />
          <NaabField
            id="nexus2-mgs-naab"
            label={t('nexus2.individual.naab.mgs')}
            placeholder={t('nexus2.naab.placeholder')}
            controller={mgsField}
            onConfirm={confirmMgs}
          />
          <NaabField
            id="nexus2-mmgs-naab"
            label={t('nexus2.individual.naab.mmgs')}
            placeholder={t('nexus2.naab.placeholder')}
            controller={mmgsField}
            onConfirm={confirmMmgs}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleCalculate} disabled={isCalculating || !canCalculate}>
            {isCalculating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('nexus2.individual.actions.calculating')}
              </span>
            ) : (
              t('nexus2.individual.actions.calculate')
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            {t('nexus2.individual.actions.clear')}
          </Button>
          {prediction && (
            <Badge variant="secondary" className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {t('nexus2.individual.result.ready')}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('nexus2.summary.title')}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {selectedBulls.map(({ label, bull }) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bull ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold">{bull.naab}</p>
                        <p className="text-sm text-muted-foreground">{bull.name}</p>
                        {bull.company && (
                          <p className="text-xs text-muted-foreground">{bull.company}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {SUMMARY_TRAITS.map((trait) => (
                          <div key={trait} className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase">
                              {summaryTraitLabels[trait]}
                            </span>
                            <span className="font-medium">
                              {formatBullValue(bull.ptas[trait])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('nexus2.summary.empty')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('nexus2.results.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('nexus2.results.description')}
            </p>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('nexus2.results.trait')}</TableHead>
                  <TableHead>{t('nexus2.results.sire')}</TableHead>
                  <TableHead>{t('nexus2.results.mgs')}</TableHead>
                  <TableHead>{t('nexus2.results.mmgs')}</TableHead>
                  <TableHead>{t('nexus2.results.prediction')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PREDICTION_TRAITS.map((trait) => (
                  <TableRow key={trait.key}>
                    <TableCell className="font-medium">{trait.label}</TableCell>
                    <TableCell>{formatBullValue(sireField.selected?.ptas[trait.key])}</TableCell>
                    <TableCell>{formatBullValue(mgsField.selected?.ptas[trait.key])}</TableCell>
                    <TableCell>{formatBullValue(mmgsField.selected?.ptas[trait.key])}</TableCell>
                    <TableCell>{formatPredictionValue(prediction?.[trait.key] ?? null)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Nexus2PredictionIndividual;
