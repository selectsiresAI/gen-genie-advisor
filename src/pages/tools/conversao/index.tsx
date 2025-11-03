import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Upload } from "lucide-react";
import { defaultLegendBank } from "./defaultLegendBank";
import { normalizeKey, jaroWinkler, type LegendEntry } from "./utils";
import { FileUploadCard } from "./components/FileUploadCard";
import { LegendBankSummary } from "./components/LegendBankSummary";
import { DetectionTable, type MappingRow, type MappingMethod } from "./components/DetectionTable";
import { HelpButton } from "@/components/help/HelpButton";
import { HelpHint } from "@/components/help/HelpHint";

interface ParsedWorkbook {
  headers: string[];
  rows: Record<string, any>[];
}

type Suggestion = {
  value: string;
  method: MappingMethod;
  confidence: number;
  legendSource?: "default" | "user";
};

const readWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  const buffer = await file.arrayBuffer();
  const isCSV = file.name.toLowerCase().endsWith('.csv');
  return XLSX.read(buffer, { 
    type: "array", 
    cellDates: true,
    ...(isCSV && { FS: "," }) // Force comma delimiter for CSV files
  });
};

const extractHeadersAndRows = (sheet: XLSX.WorkSheet): ParsedWorkbook => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as Array<Array<string | number>>;
  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((cell) => String(cell).trim()).filter((cell) => cell.length > 0);
  const dataRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "", raw: false });
  return { headers, rows: dataRows };
};

const parseLegendEntries = (sheet: XLSX.WorkSheet): LegendEntry[] => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as Array<Array<string | number>>;
  if (rows.length === 0) {
    return [];
  }

  const header = rows[0].map((value) => normalizeKey(String(value)));
  const aliasIndex = header.findIndex((value) => value.includes("alias"));
  const canonicalIndex = header.findIndex((value) => value.includes("canonical"));

  if (aliasIndex === -1 || canonicalIndex === -1) {
    throw new Error("O arquivo deve conter colunas 'alias_original' e 'suggested_canonical_key'.");
  }

  const entries: LegendEntry[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const alias = normalizeKey(String(row[aliasIndex] ?? ""));
    const canonical = String(row[canonicalIndex] ?? "").trim();

    if (!alias || !canonical) {
      continue;
    }

    entries.push({ alias, canonical, source: "user" });
  }

  return entries;
};

const regexHeuristics: Array<{ pattern: RegExp; target: string; mode: "normalized" | "original" }> = [
  { pattern: /^nm(\$)?$/i, target: "NM$", mode: "original" },
  { pattern: /^nm(_dollar)?$/, target: "NM$", mode: "normalized" },
  { pattern: /^net\s*merit$/i, target: "NM$", mode: "original" },
  { pattern: /^merito(_)?liquido(_dollar)?$/, target: "NM$", mode: "normalized" },
  { pattern: /^ptam?$/, target: "PTAM", mode: "normalized" },
  { pattern: /^pta(_)?milk$/, target: "PTAM", mode: "normalized" },
  { pattern: /^ptaf?$/, target: "PTAF", mode: "normalized" },
  { pattern: /^pta(_)?fat$/, target: "PTAF", mode: "normalized" },
  { pattern: /beta.*casein/i, target: "Beta-Casein", mode: "normalized" },
  { pattern: /kappa.*casein/i, target: "Kappa-Casein", mode: "normalized" },
  { pattern: /a2.*casein/i, target: "Beta-Casein", mode: "normalized" },
  { pattern: /^ptap?$/, target: "PTAP", mode: "normalized" },
  { pattern: /^pta(_)?protein$/, target: "PTAP", mode: "normalized" },
  { pattern: /^dpr$/, target: "DPR", mode: "normalized" },
  { pattern: /^scs$/, target: "SCS", mode: "normalized" },
  { pattern: /^ptat$/, target: "PTAT", mode: "normalized" },
  { pattern: /^liv$/, target: "LIV", mode: "normalized" },
];

const ConversaoPage: React.FC = () => {
  const { toast } = useToast();
  const [modelHeaders, setModelHeaders] = useState<string[]>([]);
  const [legendEntries, setLegendEntries] = useState<LegendEntry[]>([]);
  const [dataHeaders, setDataHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<Record<string, any>[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [modelFileName, setModelFileName] = useState<string | undefined>();
  const [legendFileName, setLegendFileName] = useState<string | undefined>();
  const [dataFileName, setDataFileName] = useState<string | undefined>();

  const canonicalLookup = useMemo(() => {
    const map = new Map<string, string>();
    modelHeaders.forEach((header) => {
      map.set(normalizeKey(header), header);
    });
    return map;
  }, [modelHeaders]);

  const combinedLegend = useMemo(() => {
    const combined = new Map<string, LegendEntry>();
    defaultLegendBank.forEach((entry) => {
      combined.set(entry.alias, entry);
    });
    legendEntries.forEach((entry) => {
      combined.set(entry.alias, entry);
    });
    return combined;
  }, [legendEntries]);

  const detectSuggestion = useCallback((header: string, normalizedHeader: string): Suggestion | undefined => {
    const legendMatch = combinedLegend.get(normalizedHeader);
    if (legendMatch) {
      const resolved = canonicalLookup.get(normalizeKey(legendMatch.canonical)) ?? legendMatch.canonical;
      return {
        value: resolved,
        method: "legend",
        confidence: 1,
        legendSource: legendMatch.source,
      };
    }

    for (const heuristic of regexHeuristics) {
      const matches =
        heuristic.mode === "normalized"
          ? heuristic.pattern.test(normalizedHeader)
          : heuristic.pattern.test(header);
      if (matches) {
        const resolved = canonicalLookup.get(normalizeKey(heuristic.target)) ?? heuristic.target;
        return {
          value: resolved,
          method: "regex",
          confidence: 0.97,
        };
      }
    }

    let bestScore = 0;
    let bestHeader: string | undefined;
    canonicalLookup.forEach((canonical, key) => {
      const normalizedCanonical = normalizeKey(canonical, true);
      const normalizedInput = normalizeKey(normalizedHeader, true);
      const score = jaroWinkler(normalizedInput, normalizedCanonical);
      if (score > bestScore) {
        bestScore = score;
        bestHeader = canonical;
      }
    });

    if (bestHeader && bestScore >= 0.25) {
      return {
        value: bestHeader,
        method: "fuzzy",
        confidence: bestScore,
      };
    }

    return undefined;
  }, [combinedLegend, canonicalLookup]);

  useEffect(() => {
    if (dataHeaders.length === 0) {
      setMappings([]);
      return;
    }

    setMappings((current) => {
      const next: MappingRow[] = dataHeaders.map((header) => {
        const normalizedHeader = normalizeKey(header);
        const existing = current.find((row) => row.original === header);
        const suggestion = detectSuggestion(header, normalizedHeader);

        if (existing?.manual) {
          return {
            ...existing,
            suggestion: suggestion?.value,
            method: suggestion?.method,
            confidence: suggestion?.confidence,
            legendSource: suggestion?.legendSource,
          };
        }

        const sameSuggestion =
          existing?.selectedCanonical &&
          suggestion?.value &&
          normalizeKey(existing.selectedCanonical) === normalizeKey(suggestion.value);

        return {
          original: header,
          normalizedOriginal: normalizedHeader,
          suggestion: suggestion?.value,
          method: suggestion?.method,
          legendSource: suggestion?.legendSource,
          confidence: suggestion?.confidence,
          selectedCanonical: sameSuggestion ? existing.selectedCanonical : suggestion?.value,
          approved: sameSuggestion ? existing.approved : false,
          manual: false,
        };
      });

      return next;
    });
  }, [dataHeaders, combinedLegend, canonicalLookup, detectSuggestion]);

  const handleModelUpload = async (file: File) => {
    try {
      const workbook = await readWorkbook(file);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        throw new Error("Não foi possível ler a primeira aba do arquivo.");
      }
      const { headers } = extractHeadersAndRows(sheet);
      if (headers.length === 0) {
        throw new Error("Não encontramos cabeçalhos na primeira linha do arquivo modelo.");
      }
      setModelHeaders(headers);
      setModelFileName(file.name);
      toast({ 
        title: "✨ Modelo ToolSS carregado!", 
        description: `Pronto para converter! ${headers.length} campos disponíveis.`,
        duration: 4000
      });
    } catch (error: any) {
      toast({ title: "Erro ao carregar modelo", description: error.message ?? String(error), variant: "destructive" });
    }
  };

  const handleLegendUpload = async (file: File) => {
    try {
      const workbook = await readWorkbook(file);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        throw new Error("Não foi possível ler a primeira aba do arquivo.");
      }
      const entries = parseLegendEntries(sheet);
      if (entries.length === 0) {
        throw new Error("Nenhuma entrada válida encontrada no arquivo enviado.");
      }
      setLegendEntries(entries);
      setLegendFileName(file.name);
      toast({ 
        title: "✨ Legendas ToolSS carregadas!", 
        description: `${defaultLegendBank.length + entries.length} nomenclaturas disponíveis para mapeamento.`,
        duration: 4000
      });
    } catch (error: any) {
      toast({ title: "Erro ao carregar banco", description: error.message ?? String(error), variant: "destructive" });
    }
  };

  const handleDataUpload = async (file: File) => {
    try {
      const workbook = await readWorkbook(file);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        throw new Error("Não foi possível ler a primeira aba do arquivo.");
      }
      const { headers, rows } = extractHeadersAndRows(sheet);
      if (headers.length === 0) {
        throw new Error("Não encontramos cabeçalhos na primeira linha do arquivo de dados.");
      }
      setDataHeaders(headers);
      setDataRows(rows);
      setDataFileName(file.name);
      toast({ title: "Dados carregados", description: `${rows.length} linhas disponíveis para conversão.` });
    } catch (error: any) {
      toast({ title: "Erro ao carregar dados", description: error.message ?? String(error), variant: "destructive" });
    }
  };

  const handleSelectCanonical = (original: string, value: string | undefined, manual: boolean) => {
    setMappings((current) =>
      current.map((row) => {
        if (row.original !== original) {
          return row;
        }
        
        // Se o valor for "exclude", marcar como excluída e aprovada
        if (value === "exclude") {
          return {
            ...row,
            exclude: true,
            selectedCanonical: undefined,
            approved: true,
            manual: true,
          };
        }
        
        // Se estava excluída e agora está sendo mapeada, remover exclusão
        return {
          ...row,
          exclude: false,
          selectedCanonical: value,
          approved: value ? row.approved : false,
          manual,
        };
      }),
    );
  };

  const handleToggleApproved = (original: string, approved: boolean) => {
    setMappings((current) =>
      current.map((row) => (row.original === original ? { ...row, approved } : row)),
    );
  };

  const handleApproveSafe = () => {
    setMappings((current) =>
      current.map((row) => {
        if (!row.selectedCanonical) {
          return row;
        }
        if (row.approved) {
          return row;
        }
        const confidence = row.confidence ?? 0;
        if (confidence >= 0.88 || row.method === "legend") {
          return { ...row, approved: true };
        }
        return row;
      }),
    );
  };

  const safeSuggestions = useMemo(
    () => mappings.filter((row) => !row.approved && row.selectedCanonical && ((row.confidence ?? 0) >= 0.88 || row.method === "legend")),
    [mappings],
  );

  const approvedCount = useMemo(() => mappings.filter((row) => row.approved).length, [mappings]);
  
  const excludedCount = useMemo(() => mappings.filter((row) => row.exclude).length, [mappings]);

  const hasPendingApprovals = useMemo(
    () => mappings.some((row) => row.selectedCanonical && !row.approved),
    [mappings],
  );

  const canDownload =
    modelHeaders.length > 0 && dataRows.length > 0 && !hasPendingApprovals && approvedCount > 0;

  const handleDownload = () => {
    if (!canDownload) {
      toast({
        title: "Nada para exportar",
        description: "Faça o upload dos arquivos e conclua as aprovações antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    const canonicalSet = new Set(modelHeaders.map((header) => normalizeKey(header)));
    const canonicalAssignments = new Map<string, string>();
    const excludedHeaders = new Set<string>();

    mappings.forEach((row) => {
      // Registrar colunas marcadas para exclusão
      if (row.exclude) {
        excludedHeaders.add(row.original);
        return;
      }
      
      if (!row.approved || !row.selectedCanonical) {
        return;
      }
      const canonicalKey = normalizeKey(row.selectedCanonical);
      if (!canonicalAssignments.has(canonicalKey)) {
        canonicalAssignments.set(canonicalKey, row.original);
      }
    });

    const finalHeaders = [...modelHeaders];
    // Adicionar apenas headers não mapeados E não excluídos
    const additionalHeaders = dataHeaders.filter((header) => 
      !canonicalSet.has(normalizeKey(header)) && !excludedHeaders.has(header)
    );
    finalHeaders.push(...additionalHeaders);

    const convertedRows = dataRows.map((row) => {
      const output: Record<string, any> = {};

      finalHeaders.forEach((header) => {
        const normalized = normalizeKey(header);
        if (canonicalSet.has(normalized)) {
          const sourceHeader = canonicalAssignments.get(normalized);
          if (sourceHeader) {
            output[header] = row[sourceHeader] ?? "";
          } else if (Object.prototype.hasOwnProperty.call(row, header)) {
            output[header] = row[header];
          } else {
            output[header] = "";
          }
        } else {
          output[header] = row[header];
        }
      });

      return output;
    });

    const workbook = XLSX.utils.book_new();
    const aoa = [finalHeaders, ...convertedRows.map((row) => finalHeaders.map((header) => row[header]))];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    
    // Aplicar formatação de datas
    import('@/lib/excel-date-formatter').then(({ autoFormatDateColumns }) => {
      autoFormatDateColumns(sheet, finalHeaders);
    });
    
    XLSX.utils.book_append_sheet(workbook, sheet, "Padronizado");

    const baseName = dataFileName ? dataFileName.replace(/\.(xlsx|csv)$/i, "") : "dados";
    const fileName = `${baseName}_padronizado.xlsx`;
    XLSX.writeFile(workbook, fileName);

    const excludeMsg = excludedCount > 0 ? ` ${excludedCount} coluna(s) excluída(s).` : '';
    toast({ 
      title: "Download iniciado", 
      description: `Arquivo ${fileName} gerado com sucesso.${excludeMsg}` 
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <HelpButton context="conversao" />
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Preview</Badge>
          <h1 className="text-3xl font-bold">Conversão e padronização de planilhas</h1>
          <HelpHint content="Padronize planilhas com nomenclaturas diferentes usando detecção automática: banco de aliases > regex > fuzzy matching" />
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Faça o upload do modelo padrão, do banco de nomenclaturas e do arquivo de dados. A ToolSS sugere mapeamentos automáticos
          (priorizando o banco, depois regex e fuzzy) para converter cabeçalhos e gerar um arquivo padronizado com todas as PTAs e
          colunas originais preservadas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <FileUploadCard
          title="1. Modelo padrão ✨"
          description="Use nosso modelo ToolSS com todas as PTAs ou envie o seu."
          onFileSelected={handleModelUpload}
          accept=".xlsx,.xls,.csv"
          fileName={modelFileName}
          hideDefaultButton
          inputId="model-file-input"
          helper={
            <div className="space-y-3">
              {modelHeaders.length === 0 && (
                <div className="p-2 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-xs font-medium text-primary">
                    👇 Recomendado: Use nosso modelo ToolSS completo
                  </p>
                </div>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/planilha-modelo-padrao.csv?v=${Date.now()}`, {
                          cache: 'no-store',
                          headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache'
                          }
                        });
                        if (!response.ok) throw new Error('Não foi possível carregar o modelo padrão');
                        const blob = await response.blob();
                        const file = new File([blob], 'Planilha_modelo_padrão.csv', { type: 'text/csv' });
                        await handleModelUpload(file);
                      } catch (error: any) {
                        toast({
                          title: "Erro ao carregar modelo",
                          description: error.message ?? String(error),
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Usar Modelo ToolSS
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Inclui todas as PTAs e campos padrão da ToolSS</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => document.getElementById('model-file-input')?.click()}
              >
                <Upload className="h-4 w-4" />
                Enviar arquivo personalizado
              </Button>
              
              {modelHeaders.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  ✓ {modelHeaders.length} chaves detectadas
                </p>
              )}
            </div>
          }
          badge={modelHeaders.length > 0 ? <Badge>{modelHeaders.length} chaves</Badge> : undefined}
        />

        <FileUploadCard
          title="2. Banco de nomenclaturas ✨"
          description="Use nossas +500 nomenclaturas ou adicione as suas."
          onFileSelected={handleLegendUpload}
          accept=".xlsx,.xls,.csv"
          fileName={legendFileName}
          hideDefaultButton
          inputId="legend-file-input"
          helper={
            <div className="space-y-3">
              {legendEntries.length === 0 && (
                <div className="p-2 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-xs font-medium text-primary">
                    👇 Use nossas legendas (cobre +500 variações)
                  </p>
                </div>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    onClick={async () => {
                      try {
                        const fileName = 'Legendas_27092025.csv';
                        const encodedFileName = encodeURIComponent(fileName);
                        const response = await fetch(`/${encodedFileName}?v=${Date.now()}`);
                        if (!response.ok) throw new Error('Não foi possível carregar as legendas padrão');
                        const blob = await response.blob();
                        const file = new File([blob], fileName, { type: 'text/csv' });
                        await handleLegendUpload(file);
                      } catch (error: any) {
                        toast({
                          title: "Erro ao carregar legendas",
                          description: error.message ?? String(error),
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Usar Legendas ToolSS
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">+500 variações de nomenclaturas de laboratórios</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => document.getElementById('legend-file-input')?.click()}
              >
                <Upload className="h-4 w-4" />
                Adicionar aliases personalizados
              </Button>
              
              {legendEntries.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  ✓ {legendEntries.length} aliases personalizados carregados
                </p>
              )}
            </div>
          }
          badge={
            legendEntries.length > 0 
              ? <Badge variant="secondary">{legendEntries.length} entradas</Badge> 
              : <Badge variant="outline">Recomendado</Badge>
          }
        />

        <FileUploadCard
          title="3. Arquivo de dados"
          description="CSV ou Excel com os dados a padronizar."
          onFileSelected={handleDataUpload}
          accept=".xlsx,.xls,.csv"
          fileName={dataFileName}
          helper={
            dataRows.length > 0 ? (
              <p className="text-xs text-muted-foreground">{dataRows.length} linhas carregadas.</p>
            ) : modelHeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Importe os dados quando quiser e carregue o modelo padrão para habilitar as sugestões de mapeamento.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Após o upload você poderá revisar e aprovar os mapeamentos.</p>
            )
          }
          badge={dataRows.length > 0 ? <Badge variant="secondary">Dados prontos</Badge> : undefined}
        />
      </div>

      <LegendBankSummary userEntries={legendEntries} defaultEntries={defaultLegendBank} />

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Sugestões de mapeamento</h2>
            <p className="text-sm text-muted-foreground">
              Aprove ou ajuste as sugestões antes de gerar o arquivo padronizado.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{approvedCount} aprovadas</Badge>
            {excludedCount > 0 && (
              <Badge variant="destructive">{excludedCount} excluídas</Badge>
            )}
            <Button variant="outline" onClick={handleApproveSafe} disabled={safeSuggestions.length === 0}>
              Aprovar sugestões seguras ({safeSuggestions.length})
            </Button>
            <Button onClick={handleDownload} disabled={!canDownload}>
              Baixar *_padronizado.xlsx
            </Button>
          </div>
        </div>

        {modelHeaders.length === 0 && (
          <Alert>
            <AlertTitle>Modelo obrigatório</AlertTitle>
            <AlertDescription>Carregue o modelo padrão para habilitar as sugestões.</AlertDescription>
          </Alert>
        )}

        <DetectionTable
          rows={mappings}
          canonicalOptions={modelHeaders}
          onSelectCanonical={handleSelectCanonical}
          onToggleApproved={handleToggleApproved}
        />
      </div>

      </div>
    </TooltipProvider>
  );
};

export default ConversaoPage;
