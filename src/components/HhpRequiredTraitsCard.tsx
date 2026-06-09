import { useState } from "react";
import { X, FlaskConical, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

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

const CATEGORY_LABEL_KEYS: Record<string, [string, string, string]> = {
  production: ["Produção", "Production", "Producción"],
  health: ["Saúde", "Health", "Salud"],
  fertility: ["Fertilidade", "Fertility", "Fertilidad"],
  efficiency: ["Eficiência", "Efficiency", "Eficiencia"],
  type: ["Tipo / Linear", "Type / Linear", "Tipo / Lineal"],
};

interface HhpRequiredTraitsCardProps {
  /** When true, the card cannot be permanently dismissed (upload context) */
  inline?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function HhpRequiredTraitsCard({ inline = false, className = "" }: HhpRequiredTraitsCardProps) {
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";
  const categoryLabels = Object.fromEntries(
    Object.entries(CATEGORY_LABEL_KEYS).map(([k, [pt, en, es]]) => [k, isEs ? es : isEn ? en : pt])
  );
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
        className="absolute right-1 top-1 z-10 h-6 w-6 rounded-full bg-background/80 p-0 text-muted-foreground hover:text-foreground shadow-sm"
        onClick={handleDismiss}
        aria-label="Fechar"
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <CardHeader className="pb-1 pt-4 pr-8">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          {isEs ? "Traits requeridos para HHP$" : isEn ? "Required traits for HHP$" : "Traits obrigatórios para HHP$"}
        </CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isEs
            ? <>El archivo debe contener los <strong>15 traits</strong> siguientes. Faltantes = HHP$ vacío.</>
            : isEn
            ? <>File must contain the <strong>15 traits</strong> below. Missing = HHP$ empty.</>
            : <>O arquivo deve conter as <strong>15 traits</strong> abaixo. Ausentes = HHP$ vazio.</>
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-2 pt-0 pb-3">
        {Object.entries(grouped).map(([category, traits]) => (
          <div key={category}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryLabels[category] || category}
            </span>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {traits.map((trait) => (
                <Badge
                  key={trait.key}
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 font-medium ${categoryColors[category] || ""}`}
                >
                  {trait.key}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-1 flex items-start gap-1.5 rounded-md bg-white/60 dark:bg-white/5 p-2 text-[10px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p>{isEs
              ? <>Use nombres exactos de columnas (<code>PTAF</code>, <code>SCS</code>, <code>RTP</code>) para mapeo automático.</>
              : isEn
              ? <>Use exact column names (<code>PTAF</code>, <code>SCS</code>, <code>RTP</code>) for automatic mapping.</>
              : <>Use nomes exatos das colunas (<code>PTAF</code>, <code>SCS</code>, <code>RTP</code>) para mapeamento automático.</>
            }</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
