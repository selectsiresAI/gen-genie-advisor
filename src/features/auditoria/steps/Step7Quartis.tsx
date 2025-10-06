"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAGFilters } from "../store";

/* ================== PTAs suportadas + labels ================== */
const PTA_LABELS: Record<string, string> = {
  hhp_dollar: "HHP$",
  nm_dollar: "NM$",
  tpi: "TPI",
  ptam: "PTAM",
  ptaf: "PTAF",
  ptap: "PTAP",
  fi: "FI",
  ccr: "CCR",
  hcr: "HCR",
  pl: "PL",
  liv: "LIV",
  scs: "SCS",
  ptat: "PTAT",
  udc: "UDC",
  mast: "MAST",
  cfp: "CFP",
};
const ALL_PTA_KEYS = Object.keys(PTA_LABELS);

/* ============= Sinônimos para achar colunas no banco ============= */
const PTA_SYNONYMS: Record<string, string[]> = {
  hhp_dollar: ["hhp_dollar", "hhp$", "hhp"],
  nm_dollar: ["nm_dollar", "nm$", "nm", "netmerit", "meritoliquido"],
  tpi: ["tpi"],
  ptam: ["ptam", "pta_milk", "milk"],
  ptaf: ["ptaf", "pta_fat", "fat"],
  ptap: ["ptap", "pta_protein", "protein"],
  fi: ["fi", "fertilityindex", "fert_index"],
  ccr: ["ccr"],
  hcr: ["hcr"],
  pl: ["pl", "productive_life"],
  liv: ["liv"],
  scs: ["scs"],
  ptat: ["ptat"],
  udc: ["udc"],
  mast: ["mast", "mastitis"],
  cfp: ["cfp"],
};

const TABLES = ["rebanho", "females_denorm", "female_denorm"];
const FARM_COLS = ["farm_id", "id_fazenda", "fazenda_id", "farmId"];
const CATEGORY_CANDIDATES = [
  "Categoria","categoria","category","age_group","agegroup","coarse",
  "grupo","paridade","parity","ordemparto","order_of_calving"
];
const ID_CANDIDATES = ["id","female_id","animal_id","id_animal","identificacao","ident","brinco","ear_tag","tag"];

const DEFAULT_PTAS = ["hhp_dollar","nm_dollar","ptam","ptap","ptaf","fi","pl","scs"]; // sugestão inicial
const AGE_SHORTCUTS = ["Bezerra","Novilha","Primípara","Secundípara","Multípara"] as const;

/* ================== Helpers ================== */
const norm = (s:any)=> String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
const PTA_SYNONYMS_NORM: Record<string,string[]> =
  Object.fromEntries(Object.entries(PTA_SYNONYMS).map(([k,v])=>[k,Array.from(new Set(v.map(norm)))]));
const toNum = (x:any)=>{ const v = Number(String(x).replace(",",".")); return Number.isFinite(v)?v:null; };

function detectColumn(keys:string[], candidates:string[]) {
  for (const k of keys) if (candidates.some(c=>norm(c)===norm(k))) return k;
  return null;
}
function detectCategory(rows:any[]) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]??{});
  const byName = detectColumn(keys, CATEGORY_CANDIDATES);
  if (byName) return byName;
  const known = new Set(AGE_SHORTCUTS.map(norm));
  for (const key of keys) {
    let hits=0;
    for (let i=0;i<Math.min(rows.length,200);i++) {
      const v = rows[i]?.[key]; if (typeof v==="string" && known.has(norm(v))) hits++;
    }
    if (hits>=3) return key;
  }
  return null;
}
function detectId(rows:any[]) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]??{});
  return detectColumn(keys, ID_CANDIDATES) ?? keys.find(k=>norm(k)==="id") ?? null;
}

/* LocalStorage: categorias mapeadas por id (cache da página Rebanho) */
const lsKey = (farmId:string|number)=>`ag:rebanho:categories:${farmId}`;
function readCatsLS(farmId:string|number) {
  if (typeof window==="undefined") return new Map<string,string>();
  try {
    const raw = window.localStorage.getItem(lsKey(farmId));
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string,string>;
    return new Map(Object.entries(obj||{}));
  } catch { return new Map(); }
}

/* Pega valor PTA de uma linha, usando sinônimos */
function getTrait(row:any, trait:string): number|null {
  const m:Record<string,any>={}; Object.keys(row).forEach(k=>m[norm(k)]=row[k]);
  const cand = PTA_SYNONYMS_NORM[trait] || [norm(trait)];
  for (const nk of cand) {
    if (nk in m) { const v=toNum(m[nk]); if (v!=null) return v; }
    if (nk.endsWith("dollar") && m[nk.replace("dollar","")]!=null) {
      const v=toNum(m[nk.replace("dollar","")]); if (v!=null) return v;
    }
  }
  return null;
}

/* Quartis simples (retorna [Q1, Q2, Q3]) */
function quartiles(values:number[]) {
  if (!values.length) return [null,null,null] as (number|null)[];
  const a=[...values].sort((x,y)=>x-y);
  const q = (p:number)=> {
    const pos = (a.length-1)*p; const base=Math.floor(pos); const rest=pos-base;
    return rest? a[base]+rest*(a[base+1]-a[base]) : a[base];
  };
  return [q(0.25), q(0.5), q(0.75)];
}

/* ================== Componente ================== */
export default function Step7Quartis() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryCol, setCategoryCol] = useState<string>("");
  const [availablePTAs, setAvailablePTAs] = useState<string[]>([]);
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  /* ---------- carregar dados do rebanho / denorm ---------- */
  const fetchData = useCallback(async ()=>{
    if (!farmId){ setRows([]); setCategories([]); setAvailablePTAs([]); return; }
    setLoading(true);

    let data:any[] = [];
    let catKey:string|null = null;
    let idKey:string|null = null;

    for (const table of TABLES) {
      // tenta por farm_id; fallback sem filtro
      let res:any = { data: [], error: null };
      for (const f of FARM_COLS) {
        res = await supabase.from(table).select("*").eq(f as any, farmId).limit(100000);
        if (!res.error && res.data?.length) break;
      }
      if ((!res.data||!res.data.length) && !res.error) {
        res = await supabase.from(table).select("*").limit(20000);
      }
      if (!res.error && Array.isArray(res.data) && res.data.length) {
        data = res.data.filter((r:any)=>r && typeof r==="object");
        catKey = detectCategory(data);
        idKey  = detectId(data);
        break;
      }
    }

    // se não houver categoria, tenta LocalStorage por id
    if ((!catKey || !data.some(r=>r?.[catKey!])) && idKey) {
      const map = readCatsLS(farmId);
      if (map.size) {
        data = data.map(r=>{
          const id = r?.[idKey!]; const cat = map.get(String(id));
          return cat? { ...r, __category: cat } : r;
        });
        if (data.some(r=>r.__category)) catKey="__category";
      }
    }

    setRows(data);
    setCategoryCol(catKey || "");

    // categorias ordenadas (atalhos)
    const cats = catKey
      ? Array.from(new Set(data.map(r=>r?.[catKey!]).filter((c:any)=>typeof c==="string" && c.trim())))
      : [];
    const ordered = [
      ...AGE_SHORTCUTS.filter(c=>cats.includes(c)),
      ...cats.filter(c=>!AGE_SHORTCUTS.includes(c as any)),
    ];
    setCategories(ordered);
    if (!ordered.includes(groupA) || !ordered.includes(groupB)) {
      setGroupA(ordered[0] || "Grupo A");
      setGroupB(ordered[1] || ordered[0] || "Grupo B");
    }

    // detectar PTAs disponíveis (colunas numéricas)
    const keys = Array.from(new Set(data.flatMap(r=>Object.keys(r??{}))));
    const present = ALL_PTA_KEYS.filter(trait=>{
      // existe pelo menos um sinônimo numérico nos dados
      return data.some(r=>getTrait(r, trait)!=null);
    });
    setAvailablePTAs(present);

    // carregar seleção salva
    if (typeof window!=="undefined"){
      const saved = window.localStorage.getItem(`ag:step7:ptas:${farmId}`);
      if (saved){
        const arr = (JSON.parse(saved) as string[]).filter(k=>present.includes(k));
        if (arr.length) setSelectedPTAs(arr);
        else setSelectedPTAs(DEFAULT_PTAS.filter(k=>present.includes(k)));
      } else {
        setSelectedPTAs(DEFAULT_PTAS.filter(k=>present.includes(k)));
      }
    }

    setLoading(false);
  },[farmId]); // eslint-disable-line

  useEffect(()=>{ fetchData(); },[fetchData]);

  /* ---------- calcular quartis quando clicar em Atualizar ---------- */
  const [table, setTable] = useState<any[]>([]);
  const onUpdate = useCallback(()=>{
    if (!rows.length || !categoryCol || !selectedPTAs.length) { setTable([]); return; }

    const rowsA = rows.filter(r=>r?.[categoryCol]===groupA);
    const rowsB = rows.filter(r=>r?.[categoryCol]===groupB);

    const out:any[] = selectedPTAs.map(trait=>{
      const arrA = rowsA.map(r=>getTrait(r, trait)).filter((v):v is number=>v!=null);
      const arrB = rowsB.map(r=>getTrait(r, trait)).filter((v):v is number=>v!=null);
      const [q1a,meda,q3a] = quartiles(arrA);
      const [q1b,medb,q3b] = quartiles(arrB);
      return {
        trait,
        label: PTA_LABELS[trait] ?? trait.toUpperCase(),
        nA: arrA.length, q1A: q1a, medA: meda, q3A: q3a,
        nB: arrB.length, q1B: q1b, medB: medb, q3B: q3b,
      };
    });
    setTable(out);

    // persiste seleção
    if (typeof window!=="undefined") {
      window.localStorage.setItem(`ag:step7:ptas:${farmId}`, JSON.stringify(selectedPTAs));
    }
  },[rows, categoryCol, selectedPTAs, groupA, groupB, farmId]);

  /* ---------- UI helpers ---------- */
  const pill = (key:string, selected:boolean, onClick:()=>void)=>(
    <button
      key={key}
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm border transition
        ${selected ? "bg-muted text-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}
    >
      {PTA_LABELS[key] ?? key.toUpperCase()}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seletor de PTAs + Atualizar */}
        <div className="flex flex-wrap items-center gap-3">
          {availablePTAs.length === 0 ? (
            <span className="text-sm text-muted-foreground">Nenhuma PTA encontrada no rebanho.</span>
          ) : (
            <>
              {availablePTAs.map(k =>
                pill(k, selectedPTAs.includes(k), () =>
                  setSelectedPTAs(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev,k])
                )
              )}
              <Button size="sm" className="ml-1" onClick={onUpdate}>
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
              </Button>
            </>
          )}
        </div>

        {/* Atalhos de Categoria A vs B (carregadas do banco/LS) */}
        {categories.length>0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Atalhos:</span>
            {categories.map(c=>(
              <Badge key={`ga-${c}`} variant={groupA===c?"default":"outline"} className="cursor-pointer" onClick={()=>setGroupA(c)}>{c}</Badge>
            ))}
            <span className="mx-2 text-xs text-muted-foreground">VS</span>
            {categories.map(c=>(
              <Badge key={`gb-${c}`} variant={groupB===c?"default":"outline"} className="cursor-pointer" onClick={()=>setGroupB(c)}>{c}</Badge>
            ))}
          </div>
        )}

        {/* Loading / vazio */}
        {loading && <div className="py-6 text-center text-muted-foreground">Carregando dados…</div>}
        {!loading && (!rows.length || !categoryCol) && (
          <div className="py-6 text-center text-muted-foreground">
            Não foi possível identificar categorias no rebanho (tente abrir a página Rebanho para popular o cache).
          </div>
        )}

        {/* Tabela de quartis */}
        {!loading && table.length>0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 text-left font-semibold">Índice</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupA} — N</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupA} — Q1</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupA} — Mediana</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupA} — Q3</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupB} — N</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupB} — Q1</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupB} — Mediana</th>
                  <th className="py-2 px-2 text-left font-semibold">{groupB} — Q3</th>
                </tr>
              </thead>
              <tbody>
                {table.map(row=>(
                  <tr key={row.trait} className="border-b">
                    <td className="py-2 px-2 font-medium">{row.label}</td>
                    <td className="py-2 px-2">{row.nA}</td>
                    <td className="py-2 px-2">{row.q1A==null?"-":row.q1A.toFixed(2)}</td>
                    <td className="py-2 px-2">{row.medA==null?"-":row.medA.toFixed(2)}</td>
                    <td className="py-2 px-2">{row.q3A==null?"-":row.q3A.toFixed(2)}</td>
                    <td className="py-2 px-2">{row.nB}</td>
                    <td className="py-2 px-2">{row.q1B==null?"-":row.q1B.toFixed(2)}</td>
                    <td className="py-2 px-2">{row.medB==null?"-":row.medB.toFixed(2)}</td>
                    <td className="py-2 px-2">{row.q3B==null?"-":row.q3B.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
