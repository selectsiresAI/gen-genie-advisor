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
  production: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  health: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  fertility: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  efficiency: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  type: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
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

  const grouped = requiredTraits.reduce<Record<string, typeof requiredTraits[number][]>>((acc, trait) => {
    (acc[trait.category] ??= []).push(trait);
    return acc;
  }, {});

  return (
    <Card className={`relative border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-5 w-5 text-amber-600" />
          Traits obrigatórios para cálculo do HHP$
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Para calcular o índice <strong>HHP$</strong> (Holistic Health Profit), seu arquivo deve conter as <strong>15 traits</strong> abaixo. Traits ausentes resultam em HHP$ = vazio.
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

        <div className="mt-2 flex items-start gap-2 rounded-md bg-white/60 dark:bg-white/5 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p><strong>Dica:</strong> No template CSV disponibilizado, todas as 15 colunas já estão presentes.
            Use os nomes exatos das colunas (ex: <code>PTAF</code>, <code>SCS</code>, <code>RTP</code>) para mapeamento automático.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
