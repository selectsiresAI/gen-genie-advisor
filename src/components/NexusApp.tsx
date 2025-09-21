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

function BancoFemeas({ femeas, onUpdate }: { femeas: Animal[]; onUpdate: (femeas: Animal[]) => void }) {
  const [sortState, setSortState] = useState<{ col: string | null; dir: string | null }>({ col: null, dir: null });
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    if (!sortState.col) return femeas;
    const col = sortState.col;
    const dir = sortState.dir === "asc" ? 1 : -1;
    return [...femeas].sort((a, b) => {
      const va = a[col] ?? "";
      const vb = b[col] ?? "";
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [femeas, sortState]);

  const filtered = useMemo(() => {
    if (!filter) return sorted;
    const f = filter.toLowerCase();
    return sorted.filter((fem) =>
      META_FEM.some((col) => String(fem[col] ?? "").toLowerCase().includes(f)) ||
      TRAIT_COLS.some((col) => String(fem[col] ?? "").toLowerCase().includes(f))
    );
  }, [sorted, filter]);

  const onSort = (col: string) => {
    if (sortState.col === col) {
      if (sortState.dir === "asc") setSortState({ col, dir: "desc" });
      else if (sortState.dir === "desc") setSortState({ col: null, dir: null });
      else setSortState({ col, dir: "asc" });
    } else {
      setSortState({ col, dir: "asc" });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Input placeholder="Filtrar fêmeas..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Button onClick={() => exportStrictXLSX("femeas.xlsx", femeas)}><Download className="w-4 h-4 mr-1" />Exportar XLSX</Button>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {EXACT_HEADERS.map((col) => (
                <TableHead key={col} className="font-semibold">
                  <SortableHeader label={col} sortState={sortState} onSort={onSort} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((fem, i) => (
              <TableRow key={i} className="hover:bg-muted/50">
                {EXACT_HEADERS.map((col) => (
                  <TableCell key={col} className="text-xs font-mono">{formatCell(col, fem[col])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BancoTouros({ touros, onUpdate }: { touros: Animal[]; onUpdate: (touros: Animal[]) => void }) {
  const [sortState, setSortState] = useState<{ col: string | null; dir: string | null }>({ col: null, dir: null });
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    if (!sortState.col) return touros;
    const col = sortState.col;
    const dir = sortState.dir === "asc" ? 1 : -1;
    return [...touros].sort((a, b) => {
      const va = a[col] ?? "";
      const vb = b[col] ?? "";
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [touros, sortState]);

  const filtered = useMemo(() => {
    if (!filter) return sorted;
    const f = filter.toLowerCase();
    return sorted.filter((tou) =>
      META_TOU.some((col) => String(tou[col] ?? "").toLowerCase().includes(f)) ||
      TRAIT_COLS.some((col) => String(tou[col] ?? "").toLowerCase().includes(f))
    );
  }, [sorted, filter]);

  const onSort = (col: string) => {
    if (sortState.col === col) {
      if (sortState.dir === "asc") setSortState({ col, dir: "desc" });
      else if (sortState.dir === "desc") setSortState({ col: null, dir: null });
      else setSortState({ col, dir: "asc" });
    } else {
      setSortState({ col, dir: "asc" });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Input placeholder="Filtrar touros..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Button onClick={() => exportStrictXLSX("touros.xlsx", touros)}><Download className="w-4 h-4 mr-1" />Exportar XLSX</Button>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {EXACT_HEADERS.map((col) => (
                <TableHead key={col} className="font-semibold">
                  <SortableHeader label={col} sortState={sortState} onSort={onSort} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((tou, i) => (
              <TableRow key={i} className="hover:bg-muted/50">
                {EXACT_HEADERS.map((col) => (
                  <TableCell key={col} className="text-xs font-mono">{formatCell(col, tou[col])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function NexusAppOriginal() {
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [fazendaSel, setFazendaSel] = useState<Fazenda | null>(null);
  const [mostrarRG, setMostrarRG] = useState(false);
  const { toast } = useToast();

  const addFarm = (nome: string, tecnico: string) => {
    if (!nome || !tecnico) return;
    if (fazendas.find((f) => f.nome === nome)) { toast({ title: "Atenção", description: "Já existe uma fazenda com esse nome." }); return; }
    const nova: Fazenda = { nome, tecnico, id: Date.now().toString(), femeas: [], touros: [], resultados: [] };
    setFazendas((p) => [...p, nova]);
    toast({ title: "Fazenda adicionada", description: `A fazenda "${nome}" foi criada.` });
  };

  // Home
  const Home = (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4"><TrendingUp className="w-8 h-8" /></div>
          <h1 className="text-4xl font-bold text-foreground">Nexus Genômico</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Sistema de Predição com Informação Genômica</p>
        </div>

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

  return Home;
}
