import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { normalizeKey } from "../utils";

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

const renderMethodBadge = (method: MappingMethod, legendSource?: "default" | "user", isExcluded?: boolean) => {
  if (isExcluded) {
    return <Badge variant="destructive">Será excluída</Badge>;
  }

  if (!method) {
    return <Badge variant="outline">Não mapeado</Badge>;
  }

  if (method === "legend") {
    return <Badge>{legendSource === "user" ? "Banco (usuário)" : "Banco (seed)"}</Badge>;
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

const renderConfidence = (confidence?: number) => {
  if (confidence === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const percentage = Math.round(confidence * 1000) / 10;
  const strength = confidence >= 0.95 ? "Excelente" : confidence >= 0.88 ? "Boa" : "Moderada";

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
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Faça o upload dos arquivos para visualizar sugestões de mapeamento.
      </div>
    );
  }

  const sortedRows = [...rows].sort((a, b) => a.original.localeCompare(b.original));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Cabeçalho original</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Confiança</TableHead>
            <TableHead className="w-[280px]">Chave canônica sugerida</TableHead>
            <TableHead className="w-[100px]">Excluir</TableHead>
            <TableHead className="w-[140px]">Aprovado</TableHead>
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
                    <span className="text-xs text-muted-foreground">Ajuste manual</span>
                  )}
                </TableCell>
                <TableCell>{renderMethodBadge(row.method, row.legendSource, row.exclude)}</TableCell>
                <TableCell>{renderConfidence(row.confidence)}</TableCell>
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
                      <SelectValue placeholder="Selecione uma chave" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Nenhum —</SelectItem>
                      {canonicalOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isSuggestionChanged && !row.exclude && (
                    <p className="mt-1 text-xs text-amber-600">
                      Diferente da sugestão automática.
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
                    <span className="text-sm text-muted-foreground">Liberado</span>
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
