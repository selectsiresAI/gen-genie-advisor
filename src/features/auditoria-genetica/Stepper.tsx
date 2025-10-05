"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const steps = [
  "Parentesco",
  "Top Pais/Avós",
  "Quartis (Overview)",
  "Média Linear",
  "Progressão Genética",
  "Comparação de Progressão",
  "Quartis – Índices",
  "Genetic Benchmark",
  "Distribuição",
];

export function AGStepper({
  active,
  onChange,
}: {
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {steps.map((label, i) => (
        <Button
          key={i}
          variant={active === i ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(i)}
          className={cn("rounded-full")}
        >
          {i + 1}. {label}
        </Button>
      ))}
    </div>
  );
}
