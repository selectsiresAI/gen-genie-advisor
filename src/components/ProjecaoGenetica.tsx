import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Projeção Genética MVP – Select Sires (Frontend Only, Single File)
 * ---------------------------------------------------------------
 * - Sem backend / sem banco. Todos os dados são inseridos manualmente.
 * - Persistência local automática em localStorage.
 * - Cálculos em tempo real (doses por categoria, premissas por categoria, PTA mães por categoria).
 * - ROI em R$ baseado em NM$ ponderado × nº de bezerras − custo de sêmen.
 * - Gráficos com Chart.js carregado dinamicamente via CDN (jsDelivr).
 * - Exportação PDF com html2canvas + jsPDF (CDN), com fallback para window.print().
 * - Identidade visual Select Sires na UI (cores e tipografia Montserrat sugeridas no index.html do projeto Lovable).
 *
 * Como usar no Lovable:
 * 1) Crie um projeto React/TS no Lovable e adicione este arquivo como App.tsx (ou substitua o App existente).
 * 2) Garanta que index.html tenha a fonte Montserrat (opcional). Este arquivo injeta Chart.js/html2canvas/jsPDF automaticamente.
 * 3) Rode e use o botão "Carregar Dados de Teste" no rodapé do sidebar para validar.
 */

// Paleta
const COLORS = {
  red: "#BE1E2D",
  gray: "#D9D9D9",
  black: "#1C1C1C",
  white: "#F2F2F2",
};

// Tipos
type CategoryKey = "novilhas" | "primiparas" | "secundiparas" | "multiparas";
const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "novilhas", label: "Novilhas" },
  { key: "primiparas", label: "Primíparas" },
  { key: "secundiparas", label: "Secundíparas" },
  { key: "multiparas", label: "Multíparas" },
];

type PTAKeys = "Leite" | "CCS" | "Fertilidade" | "NM$" | "Longevidade";
const PTA_LIST: PTAKeys[] = ["Leite", "CCS", "Fertilidade", "NM$", "Longevidade"];

type SemenType = "Sexado" | "Convencional";

interface FarmInfo {
  farmName: string;
  technician: string;
  date: string; // ISO
  objective: string;
}

interface StructurePopulation {
  total: number;
  novilhas: number;
  primiparas: number;
  secundiparas: number;
  multiparas: number;
}

interface ReproParams {
  // Percentuais em 0-100
  service: Record<CategoryKey, number>; // referência (não usada no fluxo principal)
  conception: Record<CategoryKey, number>;
  preex: Record<CategoryKey, number>;
}

interface MothersPTA {
  values: Record<CategoryKey, Record<PTAKeys, number>>;
}

interface BullPTA {
  Leite: number;
  CCS: number;
  Fertilidade: number;
  "NM$": number;
  Longevidade: number;
}

interface Bull {
  id: "A" | "B" | "C";
  name: string;
  semen: SemenType;
  pricePerDose: number; // R$
  doses: Record<CategoryKey, number>; // por categoria
  pta: BullPTA;
}

interface AppState {
  farm: FarmInfo;
  structure: StructurePopulation;
  repro: ReproParams;
  mothers: MothersPTA;
  bulls: Bull[];
}

// ---------- Helpers ----------
const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    isFinite(v) ? v : 0
  );

const NUM = (v: number, digits = 2) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    isFinite(v) ? v : 0
  );

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Dinamicamente carrega scripts externos
function useCdnScripts() {
  const [ready, setReady] = useState({ chart: false, h2c: false, jspdf: false });

  useEffect(() => {
    const ensure = (src: string, globalKey: string) =>
      new Promise<void>((resolve) => {
        if ((window as any)[globalKey]) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

    Promise.all([
      ensure("https://cdn.jsdelivr.net/npm/chart.js", "Chart").then(() =>
        setReady((r) => ({ ...r, chart: true }))
      ),
      ensure("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", "html2canvas").then(
        () => setReady((r) => ({ ...r, h2c: true }))
      ),
      ensure("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", "jspdf").then(() =>
        setReady((r) => ({ ...r, jspdf: true }))
      ),
    ]).catch(() => {});
  }, []);

  return ready;
}

// ---------- Estado & Persistência ----------
const LS_KEY = "projGen_MVP_state_v1";

function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as AppState;
      } catch {}
    }
    // Estado inicial vazio
    const today = new Date();
    return {
      farm: {
        farmName: "",
        technician: "",
        date: today.toISOString().slice(0, 10),
        objective: "",
      },
      structure: { total: 0, novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
      repro: {
        service: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
        conception: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
        preex: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
      },
      mothers: {
        values: {
          novilhas: { Leite: 0, CCS: 0, Fertilidade: 0, "NM$": 0, Longevidade: 0 },
          primiparas: { Leite: 0, CCS: 0, Fertilidade: 0, "NM$": 0, Longevidade: 0 },
          secundiparas: { Leite: 0, CCS: 0, Fertilidade: 0, "NM$": 0, Longevidade: 0 },
          multiparas: { Leite: 0, CCS: 0, Fertilidade: 0, "NM$": 0, Longevidade: 0 },
        },
      },
      bulls: ["A", "B", "C"].map((id) => ({
        id: id as Bull["id"],
        name: "",
        semen: "Sexado",
        pricePerDose: 0,
        doses: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
        pta: { Leite: 0, CCS: 0, Fertilidade: 0, "NM$": 0, Longevidade: 0 },
      })),
    } as AppState;
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  const loadTestData = () => {
    const today = new Date().toISOString().slice(0, 10);
    const test: AppState = {
      farm: {
        farmName: "Fazenda Floresta",
        technician: "Diego",
        date: today,
        objective: "Maximizar NM$ com custo competitivo por bezerra e foco em longevidade.",
      },
      structure: { total: 600, novilhas: 180, primiparas: 140, secundiparas: 140, multiparas: 140 },
      repro: {
        service: { novilhas: 60, primiparas: 55, secundiparas: 50, multiparas: 45 }, // referência
        conception: { novilhas: 45, primiparas: 40, secundiparas: 37, multiparas: 35 },
        preex: { novilhas: 92, primiparas: 90, secundiparas: 88, multiparas: 86 },
      },
      mothers: {
        values: {
          novilhas: { Leite: 350, CCS: -0.15, Fertilidade: 1.2, "NM$": 420, Longevidade: 2.2 },
          primiparas: { Leite: 300, CCS: -0.10, Fertilidade: 1.0, "NM$": 380, Longevidade: 2.0 },
          secundiparas: { Leite: 260, CCS: -0.05, Fertilidade: 0.8, "NM$": 340, Longevidade: 1.8 },
          multiparas: { Leite: 220, CCS: 0.00, Fertilidade: 0.6, "NM$": 300, Longevidade: 1.6 },
        },
      },
      bulls: [
        {
          id: "A",
          name: "Bull Alpha",
          semen: "Sexado",
          pricePerDose: 155,
          doses: { novilhas: 120, primiparas: 60, secundiparas: 20, multiparas: 0 },
          pta: { Leite: 900, CCS: -0.25, Fertilidade: 1.8, "NM$": 820, Longevidade: 3.1 },
        },
        {
          id: "B",
          name: "Bull Beta",
          semen: "Convencional",
          pricePerDose: 75,
          doses: { novilhas: 40, primiparas: 90, secundiparas: 70, multiparas: 60 },
          pta: { Leite: 750, CCS: -0.18, Fertilidade: 1.2, "NM$": 650, Longevidade: 2.6 },
        },
        {
          id: "C",
          name: "Bull Core",
          semen: "Sexado",
          pricePerDose: 135,
          doses: { novilhas: 30, primiparas: 30, secundiparas: 40, multiparas: 60 },
          pta: { Leite: 820, CCS: -0.20, Fertilidade: 1.4, "NM$": 720, Longevidade: 2.8 },
        },
      ],
    };
    setState(test);
  };

  const clearAll = () => {
    localStorage.removeItem(LS_KEY);
    window.location.reload();
  };

  return { state, setState, loadTestData, clearAll };
}

// ---------- Cálculos ----------
function useCalculations(state: AppState) {
  const result = useMemo(() => {
    const semenFemale = (semen: SemenType) => (semen === "Sexado" ? 0.9 : 0.47);

    const byBull = state.bulls.map((b) => {
      const femaleRate = semenFemale(b.semen);
      const dosesTotal = CATEGORIES.reduce((s, c) => s + (b.doses[c.key] || 0), 0);
      const valorTotal = dosesTotal * (b.pricePerDose || 0);

      let bezerrasTotais = 0;
      const bezPorCat: Record<CategoryKey, number> = {
        novilhas: 0,
        primiparas: 0,
        secundiparas: 0,
        multiparas: 0,
      };

      const ptaPondNumerator: Record<PTAKeys, number> = {
        Leite: 0,
        CCS: 0,
        Fertilidade: 0,
        "NM$": 0,
        Longevidade: 0,
      };

      CATEGORIES.forEach(({ key }) => {
        const doses = b.doses[key] || 0;
        const conc = clamp01((state.repro.conception[key] || 0) / 100);
        const preex = clamp01((state.repro.preex[key] || 0) / 100);
        const prenhezes = doses * conc;
        const prenhezesConfirm = prenhezes * preex;
        const bez = prenhezesConfirm * femaleRate;
        bezPorCat[key] = bez;
        bezerrasTotais += bez;

        PTA_LIST.forEach((attr) => {
          const ptaMae = state.mothers.values[key][attr] || 0;
          const ptaTouro = b.pta[attr] || 0;
          const ptaFilha = (ptaMae + ptaTouro) / 2;
          ptaPondNumerator[attr] += ptaFilha * bez;
        });
      });

      const ptaPond: Record<PTAKeys, number> = {
        Leite: 0,
        CCS: 0,
        Fertilidade: 0,
        "NM$": 0,
        Longevidade: 0,
      };

      PTA_LIST.forEach((attr) => {
        ptaPond[attr] = bezerrasTotais > 0 ? ptaPondNumerator[attr] / bezerrasTotais : 0;
      });

      const custoPorBezerra = bezerrasTotais > 0 ? valorTotal / bezerrasTotais : 0;
      const retornoGen = ptaPond["NM$"] * bezerrasTotais; // R$ com base no NM$ médio ponderado
      const roi = retornoGen - valorTotal; // R$

      return {
        bull: b,
        dosesTotal,
        valorTotal,
        femaleRate,
        bezPorCat,
        bezerrasTotais,
        ptaPond,
        custoPorBezerra,
        retornoGen,
        roi,
      };
    });

    // Totais do plano
    const totalBez = byBull.reduce((s, r) => s + r.bezerrasTotais, 0);
    const totalValor = byBull.reduce((s, r) => s + r.valorTotal, 0);

    const ptaPondGeral: Record<PTAKeys, number> = {
      Leite: 0,
      CCS: 0,
      Fertilidade: 0,
      "NM$": 0,
      Longevidade: 0,
    };

    if (totalBez > 0) {
      PTA_LIST.forEach((attr) => {
        const num = byBull.reduce((s, r) => s + r.ptaPond[attr] * r.bezerrasTotais, 0);
        ptaPondGeral[attr] = num / totalBez;
      });
    }

    const custoMedioBezerra = totalBez > 0 ? totalValor / totalBez : 0;

    return { byBull, totalBez, totalValor, ptaPondGeral, custoMedioBezerra };
  }, [state]);

  return result;
}

// ---------- UI Primitives ----------
function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.gray}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ color: COLORS.black, fontWeight: 700, fontSize: 18 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, color: COLORS.black, fontWeight: 600 }}>{children}</label>;
}

function Input({ value, onChange, type = "text", placeholder, min }: { value: any; onChange: (v: any) => void; type?: string; placeholder?: string; min?: number }) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      type={type}
      placeholder={placeholder}
      min={min}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${COLORS.gray}`,
        borderRadius: 10,
        outline: "none",
        background: "#fff",
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: any; onChange: (v: any) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.gray}`, borderRadius: 10, background: "#fff" }}
    >
      {options.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  );
}

function Button({ onClick, children, variant = "primary" as const }: { onClick?: () => void; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? { background: COLORS.red, color: "#fff", border: "none" }
      : { background: "transparent", color: COLORS.black, border: `1px solid ${COLORS.gray}` };
  return (
    <button onClick={onClick} style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", ...styles }}>
      {children}
    </button>
  );
}

// ---------- Pages ----------
function PagePlano({ st, setSt }: { st: AppState; setSt: React.Dispatch<React.SetStateAction<AppState>> }) {
  // Soma validação
  const sumCats = st.structure.novilhas + st.structure.primiparas + st.structure.secundiparas + st.structure.multiparas;
  const overflow = sumCats > st.structure.total && st.structure.total > 0;

  return (
    <div>
      <Section title="Informações Gerais do Plano">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Nome da Fazenda</Label>
            <Input value={st.farm.farmName} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, farmName: v } }))} placeholder="Digite o nome da fazenda" />
          </div>
          <div>
            <Label>Nome do Técnico</Label>
            <Input value={st.farm.technician} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, technician: v } }))} placeholder="Digite o nome do técnico" />
          </div>
          <div>
            <Label>Data da Simulação</Label>
            <Input type="date" value={st.farm.date} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, date: v } }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>Objetivo Genético do Rebanho</Label>
            <Input value={st.farm.objective} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, objective: v } }))} placeholder="Ex.: Maximizar NM$ e longevidade com custo competitivo" />
          </div>
        </div>
      </Section>

      <Section title="📋 Premissas Reprodutivas da Fazenda">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Estrutura populacional */}
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Estrutura Populacional</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <Label>Total de fêmeas aptas</Label>
                <Input type="number" min={0} value={st.structure.total} onChange={(v) => setSt((s) => ({ ...s, structure: { ...s.structure, total: v === "" ? 0 : v } }))} />
              </div>
              {CATEGORIES.map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={(st.structure as any)[key]}
                    onChange={(v) => setSt((s) => ({ ...s, structure: { ...s.structure, [key]: v === "" ? 0 : v } }))}
                  />
                </div>
              ))}
            </div>
            {overflow && (
              <div style={{ marginTop: 8, color: COLORS.red, fontWeight: 700 }}>Somatório das categorias excede o Total de fêmeas.</div>
            )}
          </div>

          {/* Parâmetros reprodutivos */}
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Parâmetros Reprodutivos por Categoria</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: COLORS.gray }}>
                  <th style={{ textAlign: "left", padding: 6 }}>Categoria</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Tx. Serviço (%)
                    <span title="Número de IA / número de fêmeas expostas"> ⓘ</span>
                  </th>
                  <th style={{ textAlign: "left", padding: 6 }}>Tx. Concepção (%)
                    <span title="Prenhezes / IA"> ⓘ</span>
                  </th>
                  <th style={{ textAlign: "left", padding: 6 }}>Tx. Pré-ex (%)
                    <span title="Prenhezes confirmadas no pré-exame"> ⓘ</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(({ key, label }) => (
                  <tr key={key}>
                    <td style={{ padding: 6 }}>{label}</td>
                    <td style={{ padding: 6 }}>
                      <Input
                        type="number"
                        min={0}
                        value={st.repro.service[key]}
                        onChange={(v) => setSt((s) => ({ ...s, repro: { ...s.repro, service: { ...s.repro.service, [key]: v === "" ? 0 : v } } }))}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <Input
                        type="number"
                        min={0}
                        value={st.repro.conception[key]}
                        onChange={(v) => setSt((s) => ({ ...s, repro: { ...s.repro, conception: { ...s.repro.conception, [key]: v === "" ? 0 : v } } }))}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <Input
                        type="number"
                        min={0}
                        value={st.repro.preex[key]}
                        onChange={(v) => setSt((s) => ({ ...s, repro: { ...s.repro, preex: { ...s.repro.preex, [key]: v === "" ? 0 : v } } }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 12, color: COLORS.black }}>
              * No MVP, a Tx. Serviço é informativa (não entra no fluxo principal para evitar dupla contagem).
            </div>
          </div>
        </div>

        {/* PTA das mães */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>PTA Média das Mães (por categoria)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.gray }}>
                <th style={{ textAlign: "left", padding: 6 }}>Categoria</th>
                {PTA_LIST.map((attr) => (
                  <th key={attr} style={{ textAlign: "left", padding: 6 }}>PTA {attr}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(({ key, label }) => (
                <tr key={key}>
                  <td style={{ padding: 6 }}>{label}</td>
                  {PTA_LIST.map((attr) => (
                    <td key={attr} style={{ padding: 6 }}>
                      <Input
                        type="number"
                        value={st.mothers.values[key][attr]}
                        onChange={(v) =>
                          setSt((s) => ({
                            ...s,
                            mothers: {
                              values: {
                                ...s.mothers.values,
                                [key]: { ...s.mothers.values[key], [attr]: v === "" ? 0 : v },
                              },
                            },
                          }))
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function PageBulls({ st, setSt }: { st: AppState; setSt: React.Dispatch<React.SetStateAction<AppState>> }) {
  return (
    <div>
      {st.bulls.map((b, idx) => (
        <Section key={b.id} title={`Touro ${b.id}`}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
            <div>
              <Label>Nome do Touro</Label>
              <Input value={b.name} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, name: v } : bb)) }))} placeholder="Digite o nome" />
            </div>
            <div>
              <Label>Tipo de Sêmen</Label>
              <Select value={b.semen} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, semen: v as SemenType } : bb)) }))} options={["Sexado", "Convencional"]} />
            </div>
            <div>
              <Label>Preço por dose (R$)</Label>
              <Input type="number" min={0} value={b.pricePerDose} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, pricePerDose: v === "" ? 0 : v } : bb)) }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
            {CATEGORIES.map(({ key, label }) => (
              <div key={key}>
                <Label>{label} – Nº Doses</Label>
                <Input
                  type="number"
                  min={0}
                  value={b.doses[key]}
                  onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, doses: { ...bb.doses, [key]: v === "" ? 0 : v } } : bb)) }))}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <h4 style={{ marginBottom: 6, fontWeight: 700 }}>PTAs do Touro</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {PTA_LIST.map((attr) => (
                <div key={attr}>
                  <Label>{attr}</Label>
                  <Input
                    type="number"
                    value={b.pta[attr]}
                    onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, pta: { ...bb.pta, [attr]: v === "" ? 0 : v } } : bb)) }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>
      ))}
    </div>
  );
}

function ChartCanvas({ id, height = 280 }: { id: string; height?: number }) {
  return <canvas id={id} style={{ width: "100%", height }} />;
}

function useCharts() {
  const ready = useCdnScripts();
  const createChart = (id: string, config: any) => {
    if (!(window as any).Chart) return;
    const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext("2d");
    if (!ctx) return;
    // @ts-ignore
    const ch = new (window as any).Chart(ctx, config);
    return ch;
  };
  return { ready, createChart };
}

function PageResults({ st, calc }: { st: AppState; calc: ReturnType<typeof useCalculations> }) {
  const { ready, createChart } = useCharts();
  const barRef = useRef<any>(null);
  const pieRef = useRef<any>(null);
  const radarRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const mountCharts = () => {
    // Destroy previous
    [barRef, pieRef, radarRef, lineRef].forEach((r) => {
      if (r.current) {
        try { r.current.destroy(); } catch {}
        r.current = null;
      }
    });

    const labelsBulls = calc.byBull.map((r) => `${r.bull.id} – ${r.bull.name || "(sem nome)"}`);

    // 1) Barras: Bezerras por categoria e por touro (stacked)
    const datasetsBar = CATEGORIES.map(({ key, label }) => ({
      label,
      data: calc.byBull.map((r) => r.bezPorCat[key]),
      borderWidth: 1,
    }));
    barRef.current = createChart("chart-bar", {
      type: "bar",
      data: { labels: labelsBulls, datasets: datasetsBar },
      options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { x: { stacked: true }, y: { stacked: true } } },
    });

    // 2) Pizza: participação de bezerras por touro
    const pieData = calc.byBull.map((r) => r.bezerrasTotais);
    pieRef.current = createChart("chart-pie", {
      type: "pie",
      data: { labels: labelsBulls, datasets: [{ data: pieData }] },
      options: { responsive: true },
    });

    // 3) Radar: PTAs médias das filhas (ponderadas) – Leite, CCS, Fert., NM$, Longevidade
    const radarLabels = PTA_LIST.map((k) => `PTA ${k}`);
    const radarDatasets = calc.byBull.map((r) => ({ label: `Touro ${r.bull.id}`, data: PTA_LIST.map((k) => r.ptaPond[k]) }));
    radarRef.current = createChart("chart-radar", {
      type: "radar",
      data: { labels: radarLabels, datasets: radarDatasets },
      options: { responsive: true, elements: { line: { borderWidth: 2 } } },
    });

    // 4) Linha: Custo por bezerra × NM$ por touro
    const lineLabels = labelsBulls;
    const seriesCusto = calc.byBull.map((r) => r.custoPorBezerra);
    const seriesNM = calc.byBull.map((r) => r.ptaPond["NM$"]);
    lineRef.current = createChart("chart-line", {
      type: "line",
      data: {
        labels: lineLabels,
        datasets: [
          { label: "Custo por Bezerra (R$)", data: seriesCusto, yAxisID: "y" },
          { label: "NM$ (PTA média)", data: seriesNM, yAxisID: "y1" },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        stacked: false,
        scales: { y: { type: "linear", position: "left" }, y1: { type: "linear", position: "right" } },
      },
    });
  };

  useEffect(() => {
    if (ready.chart) {
      // Delay leve para garantir canvas presente
      setTimeout(mountCharts, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.chart, JSON.stringify(calc)]);

  const missingCrit = calc.byBull.some((r) => r.bezerrasTotais === 0 && r.valorTotal === 0);

  return (
    <div>
      <Section
        title="Resumo da Simulação"
        right={
          <div style={{ display: "flex", gap: 12 }}>
            <div><strong>Total bezerras:</strong> {NUM(calc.totalBez, 2)}</div>
            <div><strong>Custo total:</strong> {BRL(calc.totalValor)}</div>
            <div><strong>Custo médio/bezerra:</strong> {BRL(calc.custoMedioBezerra)}</div>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {PTA_LIST.map((k) => (
            <div key={k} style={{ background: COLORS.white, border: `1px dashed ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: COLORS.black }}>PTA média geral – {k}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{NUM(calc.ptaPondGeral[k], 2)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tabela Comparativa Final">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.gray }}>
                <th style={{ textAlign: "left", padding: 6 }}>Touro</th>
                <th style={{ textAlign: "left", padding: 6 }}>Tipo</th>
                <th style={{ textAlign: "right", padding: 6 }}>Doses Totais</th>
                <th style={{ textAlign: "right", padding: 6 }}>R$ Total</th>
                <th style={{ textAlign: "right", padding: 6 }}>Bezerras Totais</th>
                {PTA_LIST.map((k) => (
                  <th key={k} style={{ textAlign: "right", padding: 6 }}>PTA {k}</th>
                ))}
                <th style={{ textAlign: "right", padding: 6 }}>R$/Bezerra</th>
                <th style={{ textAlign: "right", padding: 6 }}>ROI (R$)</th>
              </tr>
            </thead>
            <tbody>
              {calc.byBull.map((r) => (
                <tr key={r.bull.id}>
                  <td style={{ padding: 6 }}>{`${r.bull.id} – ${r.bull.name || "(sem nome)"}`}</td>
                  <td style={{ padding: 6 }}>{r.bull.semen}</td>
                  <td style={{ textAlign: "right", padding: 6 }}>{NUM(r.dosesTotal, 0)}</td>
                  <td style={{ textAlign: "right", padding: 6 }}>{BRL(r.valorTotal)}</td>
                  <td style={{ textAlign: "right", padding: 6 }}>{NUM(r.bezerrasTotais, 2)}</td>
                  {PTA_LIST.map((k) => (
                    <td key={k} style={{ textAlign: "right", padding: 6 }}>{NUM(r.ptaPond[k], 2)}</td>
                  ))}
                  <td style={{ textAlign: "right", padding: 6 }}>{BRL(r.custoPorBezerra)}</td>
                  <td style={{ textAlign: "right", padding: 6, fontWeight: 800, color: r.roi >= 0 ? "#167C2B" : COLORS.red }}>{BRL(r.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Gráficos">
        {!ready.chart && <div>Carregando biblioteca de gráficos…</div>}
        {ready.chart && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h4 style={{ marginBottom: 6 }}>Barras (Bezerras por categoria x Touro)</h4>
              <ChartCanvas id="chart-bar" />
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Pizza (Participação de bezerras por Touro)</h4>
              <ChartCanvas id="chart-pie" />
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Radar (PTAs médias das filhas)</h4>
              <ChartCanvas id="chart-radar" />
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Linha (Custo por bezerra × NM$)</h4>
              <ChartCanvas id="chart-line" />
            </div>
          </div>
        )}
        {missingCrit && (
          <div style={{ marginTop: 8, color: COLORS.red, fontWeight: 700 }}>
            Preencha todos os campos obrigatórios para visualizar os resultados.
          </div>
        )}
      </Section>

      <Section title="Insights">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Maior NM$ */}
          {(() => {
            const bestNM = [...calc.byBull].sort((a, b) => b.ptaPond["NM$"] - a.ptaPond["NM$"])[0];
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Maior NM$ médio</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{bestNM ? `Touro ${bestNM.bull.id} (${NUM(bestNM.ptaPond["NM$"], 2)})` : "–"}</div>
              </div>
            );
          })()}
          {/* Menor custo por bezerra */}
          {(() => {
            const bestCost = [...calc.byBull].filter((x) => x.bezerrasTotais > 0).sort((a, b) => a.custoPorBezerra - b.custoPorBezerra)[0];
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Menor custo por bezerra</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{bestCost ? `Touro ${bestCost.bull.id} (${BRL(bestCost.custoPorBezerra)})` : "–"}</div>
              </div>
            );
          })()}
          {/* Maior ROI */}
          {(() => {
            const bestROI = [...calc.byBull].sort((a, b) => b.roi - a.roi)[0];
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Maior ROI (R$)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: bestROI && bestROI.roi >= 0 ? "#167C2B" : COLORS.red }}>
                  {bestROI ? `Touro ${bestROI.bull.id} (${BRL(bestROI.roi)})` : "–"}
                </div>
              </div>
            );
          })()}
        </div>
      </Section>
    </div>
  );
}

function PageExport({ st }: { st: AppState }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready } = useCharts();

  const doExport = async () => {
    const el = ref.current;
    if (!el) return;

    const a = document.createElement("div");
    a.style.padding = "16px";
    a.style.background = "#fff";
    a.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
        <div style="font-weight:800; font-size:18px; color:${COLORS.black}">Projeção Genética MVP – Select Sires</div>
        <div style="font-size:12px; color:${COLORS.black}">${new Date(st.farm.date || new Date().toISOString().slice(0,10)).toLocaleDateString("pt-BR")}</div>
      </div>
      <div style="font-size:12px; margin-bottom:8px; color:${COLORS.black}">
        Fazenda: <strong>${st.farm.farmName || "–"}</strong> · Técnico: <strong>${st.farm.technician || "–"}</strong>
      </div>
    `;
    a.appendChild(el.cloneNode(true));

    if ((window as any).html2canvas && (window as any).jspdf) {
      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      // @ts-ignore
      const canvas = await (window as any).html2canvas(a, { scale: 2, backgroundColor: "#FFFFFF" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "l" : "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(imgData, "PNG", (pageWidth - w) / 2, 24, w, h);
      pdf.save("Projecao_Genetica_MVP.pdf");
    } else {
      // Fallback
      window.print();
    }
  };

  return (
    <div>
      <Section
        title="Exportação PDF"
        right={<Button onClick={doExport}>{ready.h2c && ready.jspdf ? "Exportar PDF" : "Imprimir/Salvar PDF"}</Button>}
      >
        <div ref={ref}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>O PDF incluirá o conteúdo principal da tela de Resultados & Gráficos.</div>
          <div style={{ fontSize: 12, color: COLORS.black }}>Para melhor qualidade, gere os gráficos em Resultados antes da exportação.</div>
        </div>
      </Section>
    </div>
  );
}

// ---------- App ----------
function Sidebar({ current, onChange, onLoadTest, onClear }: { current: string; onChange: (page: string) => void; onLoadTest: () => void; onClear: () => void }) {
  const item = (key: string, label: string) => (
    <div
      onClick={() => onChange(key)}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: current === key ? 800 : 600,
        background: current === key ? COLORS.red : "transparent",
        color: current === key ? "#fff" : COLORS.black,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
  );

  return (
    <div style={{ width: 280, minWidth: 240, background: COLORS.white, borderRight: `1px solid ${COLORS.gray}`, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 900, color: COLORS.black, marginBottom: 8, fontSize: 18 }}>Projeção Genética MVP</div>
      {item("plano", "🧬 Plano Genético")}
      {item("touros", "🐂 Entradas dos Touros")}
      {item("resultados", "📊 Resultados & Gráficos")}
      {item("pdf", "📄 Exportar PDF")}
      <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
        <Button onClick={onLoadTest}>Carregar Dados de Teste</Button>
        <Button variant="ghost" onClick={onClear}>Limpar Todos os Dados</Button>
      </div>
    </div>
  );
}

export default function ProjecaoGenetica() {
  const { state, setState, loadTestData, clearAll } = useAppState();
  const calc = useCalculations(state);
  const [page, setPage] = useState<"plano" | "touros" | "resultados" | "pdf">("plano");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAFA", color: COLORS.black }}>
      <Sidebar current={page} onChange={(p) => setPage(p as any)} onLoadTest={loadTestData} onClear={clearAll} />
      <main style={{ flex: 1, padding: 16, maxWidth: 1400, margin: "0 auto" }}>
        {page === "plano" && <PagePlano st={state} setSt={setState} />}
        {page === "touros" && <PageBulls st={state} setSt={setState} />}
        {page === "resultados" && <PageResults st={state} calc={calc} />}
        {page === "pdf" && <PageExport st={state} />}
      </main>
    </div>
  );
}