import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { read, utils, writeFileXLSX } from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, ArrowLeft, FileSpreadsheet, TrendingUp, Trash2, Download } from "lucide-react";

/* =======================================================================================
   1) PADRÃO STRICT: cabeçalho oficial + formatação + normalização + export XLSX
======================================================================================= */

export const EXACT_HEADERS = [
  "ID Animal",
  "Banco",                    // (Fêmeas: recebe "Nome da Fazenda")
  "Data de Nascimento",
  "HHP+",
  "TPI",
  "ML$",
  "Leite lbs",
  "Gordura lbs",
  "Proteína lbs",
  "CFP",
  "VP",
  "DPR",
  "CCS",
  "PTA Type",
  "Composto Ubere",
] as const;
type ColName = (typeof EXACT_HEADERS)[number];

const DEC2 = new Set<ColName>(["VP", "DPR", "CCS", "PTA Type", "Composto Ubere"]);
const DEC0 = new Set<ColName>(["TPI", "ML$", "Leite lbs", "Gordura lbs", "Proteína lbs", "CFP"]);

const toNum = (v: any): number => {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

export function formatCell(col: ColName, value: any): string {
  if (value === null || value === undefined) return "";
  const n = toNum(value);
  if (DEC2.has(col)) return Number.isFinite(n) ? n.toFixed(2) : String(value);
  if (DEC0.has(col)) return Number.isFinite(n) ? Math.round(n).toString() : String(value);
  return String(value);
}

export function normalizeRowsStrict(rows: Array<Record<string, any>>) {
  return rows.map((r) => {
    const out: Record<ColName, any> = {} as any;
    (EXACT_HEADERS as readonly string[]).forEach((col) => {
      if (col === "Banco" && r["Banco"] === undefined && r["Nome da Fazenda"] !== undefined) {
        out[col as ColName] = r["Nome da Fazenda"];
      } else {
        out[col as ColName] = r[col as ColName] ?? "";
      }
    });
    return out;
  });
}

export function exportStrictXLSX(filename: string, rows: Array<Record<string, any>>) {
  const strict = normalizeRowsStrict(rows);
  const header = Array.from(EXACT_HEADERS);
  const ws = utils.aoa_to_sheet([header]);
  const data = strict.map((r) =>
    header.map((h) => {
      const col = h as ColName;
      const formatted = formatCell(col, r[col]);
      const n = toNum(formatted);
      return Number.isFinite(n)
        ? DEC2.has(col)
          ? Number(n.toFixed(2))
          : DEC0.has(col)
          ? Math.round(n)
          : formatted
        : formatted;
    })
  );
  utils.sheet_add_aoa(ws, data, { origin: "A2" });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Dados");
  writeFileXLSX(wb, filename);
}

/* =======================================================================================
   2) IMPORTADOR: XLSX/CSV, aliases amplos, diagnóstico e padronização
======================================================================================= */

const META_COLS = ["ID Animal", "Nome da Fazenda", "Data de Nascimento", "HHP+"] as const;
const TRAIT_COLS = [
  "TPI",
  "ML$",
  "Leite lbs",
  "Gordura lbs",
  "Proteína lbs",
  "CFP",
  "VP",
  "DPR",
  "CCS",
  "PTA Type",
  "Composto Ubere",
] as const;
const COLUNAS_PADRAO = [...META_COLS, ...TRAIT_COLS];

const ALIASES: Record<string, string[]> = {
  // metadados
  "ID Animal": ["id","id animal","animal id","brinco","brinco id","tag","ear tag","eartag","tag id","id_animal","animal","id do animal","registro","registro id"],
  "Nome da Fazenda": ["nome da fazenda","fazenda","farm","nome fazenda","nome_fazenda","nome-fazenda","herd name","herd","propriedade","nome propriedade"],
  "Data de Nascimento": ["data de nascimento","data nascimento","nascimento","data_nasc","data nasc","nascimento animal","birth","birth date","birthdate","dob","date of birth"],
  "HHP+": ["hhp+","hhp","hhp plus","hhpplus","hhp +","haplotype","haplótipo","haplotipo"],

  // traits
  TPI: ["tpi","tpi score","total performance index","índice total","indice total"],
  "ML$": ["mérito líquido","merito liquido","mérito liquido","ml","ml$","nm$","nm","net merit","netmerit","mérito","merito","mls","net merit score"],
  "Leite lbs": ["leite lbs","leite","milk","milk lbs","pta milk","leite kg","milk kg","produção leite","prod leite","pta leite","milk (lbs)"],
  "Gordura lbs": ["gordura lbs","gordura","gord","gordura kg","pta gordura","pta gord","fat lbs","fat","pta fat","gordura lb","fat kg"],
  "Proteína lbs": ["proteína lbs","proteína","proteina","protein","protein lbs","protein kg","pta protein","pta proteína","pta proteina","proteína kg","proteina kg"],
  CFP: ["cfp","combined fat protein","combined fat & protein","combined fp","gordura+proteína","gordura + proteína","gord+prot","gord + prot","g+p","fp combined"],
  VP: ["vp","pl","productive life","vida produtiva","productive lifespan","longevidade","longevidade produtiva"],
  DPR: ["dpr","taxa prenhez filhas","daughter pregnancy rate","taxa de prenhez","prenhez filhas","taxa prenhez","tpf"],
  CCS: ["ccs","scs","células somáticas","celulas somaticas","somatic cell score","contagem celulas","contagem células","score cel som","somatic score"],
  "PTA Type": ["pta type","type","tipo","pta tipo","conformação","conformacao"],
  "Composto Ubere": ["composto ubere","composto úbere","udder composite","udder comp","udc","cu","escore ubere","escore úbere"],
};

const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (s?: string) =>
  stripDiacritics((s || "").toLowerCase()).replace(/[^a-z0-9$+ ]/g, " ").replace(/\s+/g, " ").trim();

const aliasMap: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const alvo of Object.keys(ALIASES)) {
    const set = new Set<string>([alvo, ...(ALIASES[alvo] || [])]);
    for (const name of set) m.set(normalize(name), alvo);
  }
  return m;
})();

function parseCSV(text: string): { headers: string[]; rows: any[] } {
  const first = text.split(/\r?\n/)[0] || "";
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const headers = (lines.shift() || "").split(sep).map((h) => h.trim());
  const rows = lines.map((line) => {
    const vals = line.split(sep);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (vals[i] ?? "").trim()));
    return obj;
  });
  return { headers, rows };
}

function mapHeaders(headers: string[]) {
  const mapped: Record<string, string> = {};
  const missing = new Set<string>(COLUNAS_PADRAO as unknown as string[]);
  const recognized: Array<[string, string]> = [];
  headers.forEach((h) => {
    const key = aliasMap.get(normalize(h));
    if (key && !mapped[key]) {
      mapped[key] = h;
      missing.delete(key);
      recognized.push([key, h]);
    }
  });
  const extras = headers.filter((h) => !aliasMap.has(normalize(h)));
  return { mapped, missing: Array.from(missing), recognized, extras };
}

function standardizeRows<T extends Record<string, any>>(rows: T[], mapped: Record<string, string>) {
  return rows.map((r) => {
    const out: Record<string, any> = {};
    (Array.from(COLUNAS_PADRAO)).forEach((alvo) => {
      const from = mapped[alvo];
      out[alvo] = from ? r[from] ?? "" : "";
    });
    return out;
  });
}

function GenomicRecognizer({
  label,
  onValidated,
}: {
  label: "Doadoras" | "Touros" | string;
  onValidated: (p: {
    ok: boolean;
    headers: string[];
    diag: { mapped: Record<string, string>; missing: string[]; recognized: Array<[string, string]>; extras: string[]; };
    standardizedRows: any[] | null;
    error?: string;
  }) => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [diag, setDiag] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const lerXLSX = (file: File) =>
    new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = read(new Uint8Array(e.target?.result as ArrayBuffer), { type: "array" });
          for (const name of wb.SheetNames) {
            const rows = utils.sheet_to_json(wb.Sheets[name], { defval: "" });
            if (rows && rows.length) return resolve(rows as any[]);
          }
          reject(new Error("Planilha sem linhas legíveis."));
        } catch (err: any) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });

  const lerCSV = (file: File) =>
    new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const { rows } = parseCSV(reader.result as string);
          resolve(rows);
        } catch (e: any) {
          reject(e);
        }
      };
      reader.readAsText(file);
    });

  const preparar = (rows: any[]) => {
    const headers = Object.keys(rows[0] || {});
    const diag = mapHeaders(headers);
    return { headers, diag };
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setHeaders([]); setDiag(null);
    try {
      let rows: any[] = [];
      const name = file.name.toLowerCase();
      if (name.endsWith(".xlsx")) rows = await lerXLSX(file);
      else if (name.endsWith(".csv")) rows = await lerCSV(file);
      else throw new Error("Formato não suportado. Use .xlsx ou .csv.");
      if (!rows.length) throw new Error("Arquivo vazio.");

      const { headers, diag } = preparar(rows);
      setHeaders(headers); setDiag(diag);

      if (diag.missing.length) {
        const payload = { ok: false, headers, diag, standardizedRows: null, error: `${label}: colunas obrigatórias não reconhecidas: ` + diag.missing.join(", ") };
        onValidated(payload); setError(payload.error!); return;
      }
      const standardized = standardizeRows(rows, diag.mapped);
      onValidated({ ok: true, headers, diag, standardizedRows: standardized });
    } catch (err: any) {
      const msg = `${label}: erro ao processar o arquivo: ${err.message || err}`;
      setError(msg);
      onValidated({ ok: false, headers: [], diag: { mapped: {}, missing: COLUNAS_PADRAO, recognized: [], extras: [] }, standardizedRows: null, error: msg });
    } finally {
      e.currentTarget.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="font-medium min-w-[140px]">{label} (.xlsx ou .csv):</label>
        <input type="file" accept=".xlsx,.csv" onChange={onUpload} className="block" />
      </div>
      {(headers.length > 0 || error) && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-semibold mb-1">Diagnóstico — {label}</div>
          {error ? (
            <div className="text-red-600 font-medium">{error}</div>
          ) : (
            <>
              <div>Colunas detectadas: <b>{headers.length}</b></div>
              <div><b>Mapeadas (alvo ← original):</b> {diag?.recognized?.length ? diag!.recognized.map(([a, o]: any) => `${a}←${o}`).join(" ; ") : "—"}</div>
              <div><b>Faltando:</b> {diag?.missing?.length ? diag!.missing.join(" ; ") : "Nenhuma"}</div>
              {diag?.extras?.length ? (<div className="text-gray-500">Extras ignoradas: {diag!.extras.join(" ; ")}</div>) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* =======================================================================================
   3) TIPOS + COLUNAS PARA UI
======================================================================================= */

type Animal = Record<string, any>;
type Resultado = Record<string, any>;
type Fazenda = { nome: string; id: string; tecnico: string; femeas: Animal[]; touros: Animal[]; resultados: Resultado[]; };

const TRAIT_COLS_BANK = EXACT_HEADERS.slice(4); // de TPI em diante (evita duplicar HHP+ no banco)
const META_FEM = ["ID Animal", "Nome da Fazenda", "Data de Nascimento", "HHP+"];
const META_TOU = ["ID Animal", "Data de Nascimento", "HHP+"];

const PRED_TRAITS = ["TPI","ML$","Leite lbs","Gordura lbs","Proteína lbs","CFP","VP","DPR","CCS","PTA Type","Composto Ubere"] as const;

/* =======================================================================================
   4) COMPONENTES: Bancos, Predições, Consolidação, Top Touros
======================================================================================= */

const nfloat = (x: any) => { if (typeof x === "number") return x; const s = String(x).replace(",", "."); const v = parseFloat(s); return Number.isFinite(v) ? v : 0; };

function SortableHeader({ label, sortState, onSort }: { label: string; sortState: { col: string | null; dir: string | null }; onSort: (col: string) => void; }) {
  const dir = sortState?.col === label ? sortState?.dir : null;
  return (
    <div className="flex items-center justify-between w-full min-w-0">
      <span className="text-xs font-medium truncate">{label}</span>
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0 ml-1" onClick={() => onSort(label)}>
        <span className="text-xs">{dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕"}</span>
      </Button>
    </div>
  );
}

function BancoFemeas({ data, onDownload, onSort, sortState }: { data: Animal[]; onDownload: () => void; onSort: (col: string) => void; sortState: { col: string | null; dir: string | null }; }) {
  const cols = [...META_FEM, ...TRAIT_COLS_BANK];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Banco de Fêmeas</div>
          <Button onClick={onDownload}><Download className="w-4 h-4 mr-2" />Download Excel</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {cols.map((c) => (
                  <TableHead key={c} className="min-w-[120px] p-2">
                    <SortableHeader label={c} sortState={sortState} onSort={onSort} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalizeRowsStrict(data).map((r, i) => (
                <TableRow key={i}>
                  {cols.map((c) => (
                    <TableCell key={c} className="p-2 text-sm">
                      {c === "Nome da Fazenda" ? (r["Banco"] || "") : EXACT_HEADERS.includes(c as any) ? formatCell(c as any, r[c as any]) : (r[c] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function BancoTouros({ data, onDownload }: { data: Animal[]; onDownload: () => void }) {
  const cols = [...META_TOU, ...TRAIT_COLS_BANK];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Banco de Touros</div>
          <Button onClick={onDownload}><Download className="w-4 h-4 mr-2" />Download Excel</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{cols.map((c) => (<TableHead key={c}>{c}</TableHead>))}</TableRow></TableHeader>
            <TableBody>
              {normalizeRowsStrict(data).map((r, i) => (
                <TableRow key={i}>
                  {cols.map((c) => (<TableCell key={c}>{EXACT_HEADERS.includes(c as any) ? formatCell(c as any, r[c as any]) : (r[c] ?? "")}</TableCell>))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function TopTourosAcasalados({ resultados }: { resultados: Resultado[] }) {
  const ranking = useMemo(() => {
    const freq = new Map<string, number>();
    resultados.forEach((r) => { const k = r.touro || "Sem ID"; freq.set(k, (freq.get(k) || 0) + 1); });
    return Array.from(freq.entries()).map(([touro, usos]) => ({ touro, usos })).sort((a, b) => b.usos - a.usos);
  }, [resultados]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-lg font-semibold mb-3">Top Touros Acasalados</div>
        <Table>
          <TableHeader><TableRow><TableHead>Touro</TableHead><TableHead>Usos</TableHead></TableRow></TableHeader>
          <TableBody>{ranking.map((r, i) => (<TableRow key={i}><TableCell>{r.touro}</TableCell><TableCell>{r.usos}</TableCell></TableRow>))}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PredicoesPorDoadora({ resultadosAgrupados, selectedResults, onSelectionChange }: { resultadosAgrupados: Record<string, Resultado[]>; selectedResults: Set<string>; onSelectionChange: (key: string, selected: boolean) => void; }) {
  const ptaCols = [...PRED_TRAITS];
  const keyOf = (femea: string, touro: string) => `${femea}-${touro}`;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-lg font-semibold mb-3">Predições por doadora</div>
        <div className="space-y-6">
          {Object.entries(resultadosAgrupados).map(([femea, predicoes]) => (
            <div key={femea}>
              <h4 className="font-medium mb-2">{femea}</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Selecionar</TableHead>
                      <TableHead>Touro</TableHead>
                      {ptaCols.map((col) => (<TableHead key={col}>{col}</TableHead>))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predicoes.map((resultado, idx) => {
                      const chave = keyOf(femea, resultado.touro);
                      return (
                        <TableRow key={idx}>
                          <TableCell><Checkbox checked={selectedResults.has(chave)} onCheckedChange={(checked) => onSelectionChange(chave, !!checked)} /></TableCell>
                          <TableCell>{resultado.touro}</TableCell>
                          {ptaCols.map((col) => (<TableCell key={col}>{EXACT_HEADERS.includes(col as any) ? formatCell(col as any, resultado[col]) : (resultado[col] ?? "-")}</TableCell>))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ListagemConsolida({ resultadosAgrupados, selectedResults, onDownload }: { resultadosAgrupados: Record<string, Resultado[]>; selectedResults: Set<string>; onDownload: () => void; }) {
  const ptaCols = [...PRED_TRAITS];
  const keyOf = (f: string, t: string) => `${f}-${t}`;
  const selecionados = useMemo(() => {
    const out: any[] = [];
    Object.entries(resultadosAgrupados).forEach(([f, preds]) => preds.forEach((p) => { if (selectedResults.has(keyOf(f, p.touro))) out.push({ femea: f, ...p }); }));
    return out;
  }, [resultadosAgrupados, selectedResults]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Listagem Consolidada</div>
          <div className="flex gap-2">
            <Badge variant="secondary">{selecionados.length} selecionados</Badge>
            <Button onClick={onDownload} disabled={selecionados.length === 0}><Download className="w-4 h-4 mr-2" />Download Excel</Button>
          </div>
        </div>
        {selecionados.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Fêmea</TableHead><TableHead>Touro</TableHead>{ptaCols.map((c) => (<TableHead key={c}>{c}</TableHead>))}</TableRow></TableHeader>
              <TableBody>
                {selecionados.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.femea}</TableCell>
                    <TableCell>{row.touro}</TableCell>
                    {ptaCols.map((c) => (<TableCell key={c}>{EXACT_HEADERS.includes(c as any) ? formatCell(c as any, row[c]) : (row[c] ?? "-")}</TableCell>))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (<div className="text-center text-muted-foreground py-8">Nenhuma predição selecionada</div>)}
      </CardContent>
    </Card>
  );
}

/* =======================================================================================
   5) PÁGINAS: Fazenda / Rebanho Geral
======================================================================================= */

function PaginaFazenda({ fazenda, onBack, onUpdateFazenda }: { fazenda: Fazenda; onBack: () => void; onUpdateFazenda: (f: Fazenda) => void; }) {
  const { toast } = useToast();
  const [sortState, setSortState] = useState<{ col: string | null; dir: string | null }>({ col: null, dir: null });
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [femeas, setFemeas] = useState<Animal[]>(fazenda.femeas || []);
  const [touros, setTouros] = useState<Animal[]>(fazenda.touros || []);
  const [resultadosAgrupados, setResultadosAgrupados] = useState<Record<string, Resultado[]>>({});

  useEffect(() => {
    const byF = (fazenda.resultados || []).reduce((acc: any, r: any) => { const f = r.femea; (acc[f] = acc[f] || []).push(r); return acc; }, {});
    setResultadosAgrupados(byF);
  }, [fazenda.resultados]);

  const onSortFem = (col: string) => {
    setSortState((s) => {
      const dir = s.col === col ? (s.dir === "asc" ? "desc" : s.dir === "desc" ? null : "asc") : "asc";
      if (dir) {
        const arr = [...femeas];
        arr.sort((a, b) => {
          const av = a[col] ?? ""; const bv = b[col] ?? "";
          if (!isNaN(nfloat(av)) && !isNaN(nfloat(bv))) return dir === "asc" ? nfloat(av) - nfloat(bv) : nfloat(bv) - nfloat(av);
          const cmp = String(av).localeCompare(String(bv)); return dir === "asc" ? cmp : -cmp;
        });
        setFemeas(arr);
      }
      return { col: dir ? col : null, dir };
    });
  };

  const exportFem = () => exportStrictXLSX(`${fazenda.nome.replace(/\s+/g, "_")}_Banco_Femeas.xlsx`, femeas);
  const exportTou = () => exportStrictXLSX(`${fazenda.nome.replace(/\s+/g, "_")}_Banco_Touros.xlsx`, touros);
  const exportConsolidado = () => {
    const keyOf = (f: string, t: string) => `${f}-${t}`;
    const out: any[] = [];
    Object.entries(resultadosAgrupados).forEach(([f, preds]) => preds.forEach((p: any) => { if (selectedResults.has(keyOf(f, p.touro))) out.push({ femea: f, ...p }); }));
    exportStrictXLSX(`${fazenda.nome.replace(/\s+/g, "_")}_Predicoes_Consolidadas.xlsx`, out);
  };

  const calcularPredicoes = useCallback(() => {
    if (!femeas.length || !touros.length) {
      toast({ title: "Dados Insuficientes", description: "É necessário carregar tanto as doadoras quanto os touros.", variant: "destructive" });
      return;
    }
    const byF: Record<string, Resultado[]> = {};
    const flat: Resultado[] = [];

    normalizeRowsStrict(femeas).forEach((f: any) => {
      const femeaNome = f["ID Animal"] || "Sem ID";
      const preds = normalizeRowsStrict(touros).map((t: any) => {
        const r: Resultado = { femea: femeaNome, touro: t["ID Animal"] || "Sem ID" };
        (Array.from(PRED_TRAITS)).forEach((col) => {
          const valF = toNum(f[col]); const valT = toNum(t[col]);
          const calc = ((valF + valT) / 2) * 0.92; // fórmula definida
          r[col] = formatCell(col as ColName, calc);
        });
        flat.push(r); return r;
      });
      preds.sort((a: any, b: any) => toNum(b["TPI"]) - toNum(a["TPI"]));
      byF[femeaNome] = preds;
    });

    setResultadosAgrupados(byF);
    onUpdateFazenda({ ...fazenda, femeas, touros, resultados: flat });
    toast({ title: "Predições Calculadas", description: `Análise genética concluída para ${femeas.length} doadoras.` });
  }, [femeas, touros, fazenda, onUpdateFazenda, toast]);

  const onSelectChange = (key: string, selected: boolean) => { const s = new Set(selectedResults); selected ? s.add(key) : s.delete(key); setSelectedResults(s); };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
            <h1 className="text-2xl font-bold">{fazenda.nome}</h1>
          </div>
          <Button onClick={calcularPredicoes} className="bg-primary hover:bg-primary/90"><TrendingUp className="w-4 h-4 mr-2" />Calcular Predições</Button>
        </div>

        {/* Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GenomicRecognizer label="Doadoras" onValidated={({ ok, standardizedRows }) => { if (ok && standardizedRows) setFemeas(standardizedRows.map(r => ({ ...r, "Nome da Fazenda": fazenda.nome }))); }} />
          <GenomicRecognizer label="Touros" onValidated={({ ok, standardizedRows }) => { if (ok && standardizedRows) setTouros(standardizedRows); }} />
        </div>

        {/* Abas */}
        <Tabs defaultValue="femeas">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="femeas">Banco de Fêmeas</TabsTrigger>
            <TabsTrigger value="touros">Banco de Touros</TabsTrigger>
            <TabsTrigger value="top">Top Touros Acasalados</TabsTrigger>
            <TabsTrigger value="predicoes">Predições por doadora</TabsTrigger>
            <TabsTrigger value="consolida">Listagem Consolidada</TabsTrigger>
          </TabsList>

          <TabsContent value="femeas">
            <BancoFemeas data={femeas} onDownload={exportFem} onSort={onSortFem} sortState={sortState} />
          </TabsContent>

          <TabsContent value="touros">
            <BancoTouros data={touros} onDownload={exportTou} />
          </TabsContent>

          <TabsContent value="top">
            <TopTourosAcasalados resultados={fazenda.resultados} />
          </TabsContent>

          <TabsContent value="predicoes">
            <PredicoesPorDoadora
              resultadosAgrupados={resultadosAgrupados}
              selectedResults={selectedResults}
              onSelectionChange={onSelectChange}
            />
          </TabsContent>

          <TabsContent value="consolida">
            <ListagemConsolida
              resultadosAgrupados={resultadosAgrupados}
              selectedResults={selectedResults}
              onDownload={exportConsolidado}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PaginaRebanhoGeral({ fazendas, onBack }: { fazendas: Fazenda[]; onBack: () => void; }) {
  const [sortState, setSortState] = useState<{ col: string | null; dir: string | null }>({ col: null, dir: null });
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const dados = useMemo(() => {
    const femeas: Animal[] = [], touros: Animal[] = [], resultados: Resultado[] = [];
    fazendas.forEach((f) => { femeas.push(...f.femeas); touros.push(...f.touros); resultados.push(...f.resultados); });
    return { femeas, touros, resultados };
  }, [fazendas]);
  const agrupados = useMemo(() => {
    const acc: Record<string, Resultado[]> = {};
    dados.resultados.forEach((r: any) => { const f = r.femea; (acc[f] = acc[f] || []).push(r); });
    return acc;
  }, [dados.resultados]);

  const exportFem = () => exportStrictXLSX("Rebanho_Geral_Banco_Femeas.xlsx", dados.femeas);
  const exportTou = () => exportStrictXLSX("Rebanho_Geral_Banco_Touros.xlsx", dados.touros);
  const exportConsol = () => {
    const keyOf = (f: string, t: string) => `${f}-${t}`;
    const out: any[] = [];
    Object.entries(agrupados).forEach(([f, preds]) => preds.forEach((p: any) => { if (selectedResults.has(keyOf(f, p.touro))) out.push({ femea: f, ...p }); }));
    exportStrictXLSX("Rebanho_Geral_Predicoes_Consolidadas.xlsx", out);
  };

  const totais = useMemo(() => {
    let f = 0, t = 0;
    fazendas.forEach((farm) => { f += farm.femeas?.length || 0; t += farm.touros?.length || 0; });
    return { f, t };
  }, [fazendas]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
            <h1 className="text-2xl font-bold">Rebanho Geral</h1>
          </div>
          <div className="flex gap-6 text-sm"><div><span className="font-bold">Fêmeas:</span> {totais.f}</div><div><span className="font-bold">Touros:</span> {totais.t}</div></div>
        </div>

        <Tabs defaultValue="femeas">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="femeas">Banco de Fêmeas</TabsTrigger>
            <TabsTrigger value="touros">Banco de Touros</TabsTrigger>
            <TabsTrigger value="top">Top Touros Acasalados</TabsTrigger>
            <TabsTrigger value="predicoes">Predições por doadora</TabsTrigger>
            <TabsTrigger value="consolida">Listagem Consolidada</TabsTrigger>
          </TabsList>

          <TabsContent value="femeas">
            <BancoFemeas data={dados.femeas} onDownload={exportFem} onSort={(col) => {
              const dirNext = !sortState.col || sortState.col !== col ? "asc" : sortState.dir === "asc" ? "desc" : sortState.dir === "desc" ? null : "asc";
              setSortState({ col: dirNext ? col : null, dir: dirNext });
            }} sortState={sortState} />
          </TabsContent>

          <TabsContent value="touros"><BancoTouros data={dados.touros} onDownload={exportTou} /></TabsContent>
          <TabsContent value="top"><TopTourosAcasalados resultados={dados.resultados} /></TabsContent>
          <TabsContent value="predicoes"><PredicoesPorDoadora resultadosAgrupados={agrupados} selectedResults={selectedResults} onSelectionChange={(k, s) => { const next = new Set(selectedResults); s ? next.add(k) : next.delete(k); setSelectedResults(next); }} /></TabsContent>
          <TabsContent value="consolida"><ListagemConsolida resultadosAgrupados={agrupados} selectedResults={selectedResults} onDownload={exportConsol} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* =======================================================================================
   6) APP (Home + CRUD Fazendas)
======================================================================================= */

const DATA_KEY = "fazendas-data";

export default function AppNexus() {
  const { toast } = useToast();
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [fazendaSel, setFazendaSel] = useState<Fazenda | null>(null);
  const [mostrarRG, setMostrarRG] = useState<boolean>(false);

  // carregar dados do localStorage na inicialização
  useEffect(() => {
    const local = localStorage.getItem(DATA_KEY);
    if (local) {
      try {
        setFazendas(JSON.parse(local));
      } catch {
        // dados corrompidos, manter array vazio
      }
    }
  }, []);

  // salvar no localStorage sempre que fazendas mudar
  useEffect(() => {
    try { 
      localStorage.setItem(DATA_KEY, JSON.stringify(fazendas)); 
    } catch {}
  }, [fazendas]);

  // CRUD fazendas
  const addFarm = (nome: string, tecnico: string) => {
    if (!nome || !tecnico) return;
    if (fazendas.find((f) => f.nome === nome)) { toast({ title: "Atenção", description: "Já existe uma fazenda com esse nome." }); return; }
    const nova: Fazenda = { nome, tecnico, id: Date.now().toString(), femeas: [], touros: [], resultados: [] };
    setFazendas((p) => [...p, nova]);
    toast({ title: "Fazenda adicionada", description: `A fazenda "${nome}" foi criada.` });
  };
  const delFarm = (id: string) => setFazendas((p) => p.filter((f) => f.id !== id));
  const updFarm = (fx: Fazenda) => setFazendas((p) => p.map((f) => (f.id === fx.id ? fx : f)));

  // Home
  const Home = (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4"><TrendingUp className="w-8 h-8" /></div>
          <h1 className="text-4xl font-bold text-foreground">Nexus</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Sistema Avançado de Predição Genética para Bovinos</p>
        </div>


        {/* Rebanho Geral card com totais */}
        <Card className="mb-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setMostrarRG(true)}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="text-lg font-semibold">Rebanho Geral</div>
            <div className="flex gap-6 text-sm">
              <div><span className="font-bold">Fêmeas:</span> {fazendas.reduce((acc, f) => acc + (f.femeas?.length || 0), 0)}</div>
              <div><span className="font-bold">Touros:</span> {fazendas.reduce((acc, f) => acc + (f.touros?.length || 0), 0)}</div>
              <div className="text-xs text-muted-foreground">Clique para abrir</div>
            </div>
          </CardContent>
        </Card>

        {/* Adicionar Nova Fazenda */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Nome da Fazenda</label>
                  <Input id="nome-fazenda" placeholder="Nome da nova fazenda" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Nome do Técnico</label>
                  <Input id="nome-tecnico" placeholder="Nome do técnico responsável" />
                </div>
              </div>
              <Button
                onClick={() => {
                  const nomeEl = document.getElementById("nome-fazenda") as HTMLInputElement;
                  const tecnicoEl = document.getElementById("nome-tecnico") as HTMLInputElement;
                  addFarm(nomeEl?.value?.trim() || "", tecnicoEl?.value?.trim() || "");
                  if (nomeEl) nomeEl.value = "";
                  if (tecnicoEl) tecnicoEl.value = "";
                }}
                className="bg-primary hover:bg-primary/90 w-full"
              >
                <Plus className="w-4 h-4 mr-2" />Adicionar Fazenda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Fazendas */}
        <Card>
          <CardContent className="p-6">
            {fazendas.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Nenhuma fazenda cadastrada</h3>
                <p className="text-muted-foreground">Adicione sua primeira fazenda para começar as análises genéticas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="font-semibold">Nome da Fazenda</TableHead>
                    <TableHead className="font-semibold">Técnico Responsável</TableHead>
                    <TableHead className="font-semibold text-center">Nº Fêmeas</TableHead>
                    <TableHead className="font-semibold text-center">Nº Touros</TableHead>
                    <TableHead className="font-semibold text-center">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {fazendas.map((fz) => (
                      <TableRow key={fz.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => setFazendaSel(fz)}>{fz.nome}</TableCell>
                        <TableCell>{fz.tecnico}</TableCell>
                        <TableCell className="text-center">{fz.femeas.length}</TableCell>
                        <TableCell className="text-center">{fz.touros.length}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setFazendaSel(fz)}>Abrir</Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { if (confirm(`Excluir a fazenda "${fz.nome}"?`)) setFazendas((p) => p.filter((x) => x.id !== fz.id)); }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (mostrarRG) return <PaginaRebanhoGeral fazendas={fazendas} onBack={() => setMostrarRG(false)} />;
  if (fazendaSel) return <PaginaFazenda fazenda={fazendaSel} onBack={() => setFazendaSel(null)} onUpdateFazenda={(fx) => setFazendas((p) => p.map((f) => (f.id === fx.id ? fx : f)))} />;

  return Home;
}