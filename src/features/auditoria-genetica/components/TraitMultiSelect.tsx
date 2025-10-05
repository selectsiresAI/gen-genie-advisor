"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type TraitOption = {
  value: string;
  label: string;
};

interface TraitMultiSelectProps {
  options: TraitOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function TraitMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione PTAs",
  emptyMessage = "Nenhuma PTA disponível.",
}: TraitMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const selectedLabels = useMemo(() => {
    if (!value.length) return [];
    const labelByValue = new Map(options.map((option) => [option.value, option.label]));
    return value.map((item) => labelByValue.get(item) ?? item.toUpperCase());
  }, [options, value]);

  const toggleValue = useCallback(
    (trait: string) => {
      const isSelected = selectedSet.has(trait);
      const next = isSelected
        ? value.filter((item) => item !== trait)
        : [...value, trait];
      onChange(next);
    },
    [onChange, selectedSet, value]
  );

  const removeValue = useCallback(
    (trait: string) => {
      if (!selectedSet.has(trait)) return;
      onChange(value.filter((item) => item !== trait));
    },
    [onChange, selectedSet, value]
  );

  if (!options.length) {
    return <span className="text-sm text-muted-foreground">{emptyMessage}</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedLabels.length
                ? `${selectedLabels.length} selecionada${selectedLabels.length > 1 ? "s" : ""}`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar PTA..." />
            <CommandList>
              <CommandEmpty>Nenhuma PTA encontrada.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedSet.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.value} ${option.label}`}
                      onSelect={() => toggleValue(option.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((trait) => {
            const label =
              options.find((option) => option.value === trait)?.label ?? trait.toUpperCase();
            return (
              <Badge
                key={trait}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {label}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  onClick={() => removeValue(trait)}
                  aria-label={`Remover ${label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
