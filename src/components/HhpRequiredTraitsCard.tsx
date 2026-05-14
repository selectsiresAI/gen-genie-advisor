import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hhp_card_dismissed";

const requiredTraits = [
  { key: "PTAF", label: "PTA Fat (lbs)", category: "production" },
  { key: "PTAP", label: "PTA Protein (lbs)", category: "production" },
  { key: "PL", label: "Productive Life", category: "health" },
  { key: "LIV", label: "Livability", category: "health" },
  { key: "SCS", label: "Somatic Cell Score", category: "health" },
  { key: "DPR", label: "Daughter Pregnancy Rate", category: "fertility" },
  { key: "CCR", label: "Cow Conception Rate", category: "fertility" },
  { key: "RFI", label: "Residual Feed Intake", category: "efficiency" },
  { key: "MAST", label: "Mastitis Resistance", category: "health" },
  { key: "STA", label: "Stature", category: "type" },
  { key: "DF", label: "Dairy Form", category: "type" },
  { key: "RUW", label: "Rear Udder Width", category: "type" },
  { key: "UD", label: "Udder Depth", category: "type" },
  { key: "RTP", label: "Rear Teat Placement", category: "type" },
  { key: "TL", label: "Teat Length", category: "type" },
] as const;

const categoryColors: Record<string, string> = {
  production: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  health: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  fertility: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  efficiency: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  type: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
};

const categoryLabels: Record<string, string> = {
  production: "Produção",
  health: "Saúde",
  fertility: "Fertilidade",
  efficiency: "Eficiência",
  type: "Tipo / Linear",
};

interface HhpRequiredTraitsCardProps {
  /** When true, the card cannot be permanently dismissed (upload context) */
  inline?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function HhpRequiredTraitsCard({ inline = false, className = "" }: HhpRequiredTraitsCardProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (inline) return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (!inline) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  const grouped = requiredTraits.reduce<Record<string, typeof requiredTraits[number][]>>(
    (acc, trait) => {
      (acc[trait.category] ??= []).push(trait);
      return acc;
    },
    {},
  );

  return (
    <Card
      className={`relative border-border bg-card ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Traits obrigatórios para cálculo do HHP$
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Para calcular o índice <strong>HHP$</strong> (Holistic Health Profit), seu arquivo deve
          conter as <strong>15 traits</strong> abaixo. Traits ausentes resultam em HHP$ = vazio.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {Object.entries(grouped).map(([category, traits]) => (
          <div key={category}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryLabels[category] || category}
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {traits.map((trait) => (
                <Badge
                  key={trait.key}
                  variant="secondary"
                  className={`text-xs font-medium ${categoryColors[category] || ""}`}
                >
                  {trait.key}
                  <span className="ml-1 opacity-60">({trait.label})</span>
                </Badge>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p>
            <strong>Dica:</strong> No template CSV disponibilizado, todas as 15 colunas já estão
            presentes. Use os nomes exatos das colunas (ex: <code>PTAF</code>, <code>SCS</code>,{" "}
            <code>RTP</code>) para mapeamento automático.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
