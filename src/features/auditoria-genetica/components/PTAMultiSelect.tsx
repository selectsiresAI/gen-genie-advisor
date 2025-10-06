"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PTAMultiSelectProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PTAMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecionar PTAs",
  disabled,
}: PTAMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () =>
      value
        .map((key) => options.find((option) => option.value === key))
        .filter((item): item is { value: string; label: string } => Boolean(item)),
    [options, value],
  );

  const toggleValue = (next: string) => {
    if (value.includes(next)) {
      onChange(value.filter((item) => item !== next));
    } else {
      onChange([...value, next]);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-[260px] justify-between"
            disabled={disabled}
          >
            <span className="truncate text-left">
              {value.length
                ? `${value.length} PTA${value.length > 1 ? "s" : ""} selecionada${
                    value.length > 1 ? "s" : ""
                  }`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar PTA..." />
            <CommandList>
              <CommandEmpty>Nenhuma PTA encontrada.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleValue(option.value)}
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
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

      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <Badge key={item.value} variant="secondary" className="flex items-center gap-1">
            <span>{item.label}</span>
            <button
              type="button"
              onClick={() => toggleValue(item.value)}
              className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={`Remover ${item.label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Nenhuma PTA selecionada.
          </span>
        )}
      </div>
    </div>
  );
}
