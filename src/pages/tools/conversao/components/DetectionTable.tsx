import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { normalizeKey } from "../utils";
import { useTranslation } from "@/hooks/useTranslation";
import { getTraitFriendlyName } from "../traitNames";

export type MappingMethod = "legend" | "regex" | "fuzzy" | undefined;

export interface MappingRow {
  original: string;
  normalizedOriginal: string;
  suggestion?: string;
  method?: MappingMethod;
  legendSource?: "default" | "user";
  confidence?: number;
  approved: boolean;
  selectedCanonical?: string;
  manual?: boolean;
  exclude?: boolean;
}

interface DetectionTableProps {
  rows: MappingRow[];
  canonicalOptions: string[];
  onSelectCanonical: (original: string, value: string | undefined, manual: boolean) => void;
  onToggleApproved: (original: string, approved: boolean) => void;
}

const renderMethodBadge = (method: MappingMethod, legendSource?: "default" | "user", isExcluded?: boolean, isEn?: boolean, isEs?: boolean) => {
  if (isExcluded) {
    return <Badge variant="destructive">{isEs ? "Será excluida" : isEn ? "Will be excluded" : "Será excluída"}</Badge>;
  }

  if (!method) {
    return <Badge variant="outline">{isEs ? "No mapeado" : isEn ? "Not mapped" : "Não mapeado"}</Badge>;
  }

  if (method === "legend") {
    return <Badge>{legendSource === "user" ? (isEs ? "Banco (usuario)" : isEn ? "Bank (user)" : "Banco (usuário)") : (isEs ? "Banco (seed)" : isEn ? "Bank (seed)" : "Banco (seed)")}</Badge>;
  }

  if (method === "regex") {
    return <Badge variant="secondary">Regex</Badge>;
  }

  if (method === "fuzzy") {
    return <Badge variant="outline" className="bg-primary/10 text-primary">
      Fuzzy
    </Badge>;
  }

  return null;
};

const renderConfidence = (confidence?: number, isEn?: boolean, isEs?: boolean) => {
  if (confidence === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const percentage = Math.round(confidence * 1000) / 10;
  const strength = confidence >= 0.95
    ? (isEs ? "Excelente" : isEn ? "Excellent" : "Excelente")
    : confidence >= 0.88
    ? (isEs ? "Buena" : isEn ? "Good" : "Boa")
    : (isEs ? "Moderada" : isEn ? "Moderate" : "Moderada");

  return (
    <div className="flex flex-col">
      <span className="font-medium">{percentage.toFixed(1)}%</span>
      <span className="text-xs text-muted-foreground">{strength}</span>
    </div>
  );
};

export const DetectionTable: React.FC<DetectionTableProps> = ({
  rows,
  canonicalOptions,
  onSelectCanonical,
  onToggleApproved,
}) => {
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        {isEs ? "Cargue los archivos para ver sugerencias de mapeo." : isEn ? "Upload files to view mapping suggestions." : "Faça o upload dos arquivos para visualizar sugestões de mapeamento."}
      </div>
    );
  }

  const sortedRows = [...rows].sort((a, b) => a.original.localeCompare(b.original));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">{isEs ? "Encabezado original" : isEn ? "Original header" : "Cabeçalho original"}</TableHead>
            <TableHead>{isEs ? "Método" : isEn ? "Method" : "Método"}</TableHead>
            <TableHead>{isEs ? "Confianza" : isEn ? "Confidence" : "Confiança"}</TableHead>
            <TableHead className="w-[280px]">{isEs ? "Nombre sugerido" : isEn ? "Suggested name" : "Nome sugerido"}</TableHead>
            <TableHead className="w-[100px]">{isEs ? "Excluir" : isEn ? "Exclude" : "Excluir"}</TableHead>
            <TableHead className="w-[140px]">{isEs ? "Aprobado" : isEn ? "Approved" : "Aprovado"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => {
            const normalizedSelected = normalizeKey(row.selectedCanonical ?? "");
            const normalizedSuggestion = normalizeKey(row.suggestion ?? "");
            const isSuggestionChanged =
              !!row.selectedCanonical && row.suggestion && normalizedSelected !== normalizedSuggestion;

            return (
              <TableRow key={row.original} className={cn((!row.suggestion && !row.exclude) && "opacity-70", row.exclude && "bg-destructive/5")}> 
                <TableCell>
                  <div className="font-medium">{row.original}</div>
                  {row.manual && (
                    <span className="text-xs text-muted-foreground">{isEs ? "Ajuste manual" : isEn ? "Manual adjustment" : "Ajuste manual"}</span>
                  )}
                </TableCell>
                <TableCell>{renderMethodBadge(row.method, row.legendSource, row.exclude, isEn, isEs)}</TableCell>
                <TableCell>{renderConfidence(row.confidence, isEn, isEs)}</TableCell>
                <TableCell>
                  <Select
                    value={row.selectedCanonical ? row.selectedCanonical : "none"}
                    disabled={row.exclude}
                    onValueChange={(value) => {
                      if (value === "none") {
                        onSelectCanonical(row.original, undefined, true);
                        return;
                      }
                      onSelectCanonical(row.original, value, value !== row.suggestion);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isEs ? "Seleccione una clave" : isEn ? "Select a key" : "Selecione uma chave"}>
                        {row.selectedCanonical ? (
                          <span className="flex items-center gap-2 truncate">
                            <span className="font-medium">{row.selectedCanonical}</span>
                            {getTraitFriendlyName(row.selectedCanonical, locale) && (
                              <span className="text-xs text-muted-foreground truncate">
                                — {getTraitFriendlyName(row.selectedCanonical, locale)}
                              </span>
                            )}
                          </span>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isEs ? "— Ninguno —" : isEn ? "— None —" : "— Nenhum —"}</SelectItem>
                      {canonicalOptions.map((option) => {
                        const friendly = getTraitFriendlyName(option, locale);
                        return (
                          <SelectItem key={option} value={option}>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{option}</span>
                              {friendly && (
                                <span className="text-xs text-muted-foreground">— {friendly}</span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {isSuggestionChanged && !row.exclude && (
                    <p className="mt-1 text-xs text-amber-600">
                      {isEs ? "Diferente de la sugerencia automática." : isEn ? "Different from the automatic suggestion." : "Diferente da sugestão automática."}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={row.exclude || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectCanonical(row.original, "exclude", true);
                        } else {
                          // Restaura a sugestão original ou deixa vazio
                          onSelectCanonical(row.original, row.suggestion, false);
                        }
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={row.approved}
                      disabled={!row.selectedCanonical || row.exclude}
                      onCheckedChange={(checked) =>
                        onToggleApproved(row.original, checked === true)
                      }
                    />
                    <span className="text-sm text-muted-foreground">{isEs ? "Liberado" : isEn ? "Released" : "Liberado"}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
