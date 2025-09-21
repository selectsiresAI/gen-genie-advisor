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

// Lista completa de PTAs disponíveis
const ALL_PTAS = [
  "ÍHHP$®", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", "CFP", "PTAF", "PTAF%", 
  "PTAP", "PTAP%", "PL", "DPR", "LIV", "SCS", "MAST", "MET", "RP", "DA", "KET", "MF", 
  "PTAT", "UDC", "FLC", "SCE", "DCE", "SSB", "DSB", "H LIV", "CCR", "HCR", "FI", "GL", 
  "EFC", "BWC", "STA", "STR", "DFM", "RUA", "RLS", "RTP", "FTL", "RW", "RLR", "FTA", 
  "FLS", "FUA", "RUH", "RUW", "UCL", "UDP", "FTP", "RFI"
] as const;

type PTAKey = typeof ALL_PTAS[number];

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
  values: Record<CategoryKey, Record<string, number>>;
}

interface BullPTA {
  [key: string]: number;
}

interface Bull {
  id: string;
  name: string;
  naab: string;
  empresa?: string;
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
  selectedPTAs: PTAKey[]; // até 5 PTAs selecionadas
  numberOfBulls: number; // 1-5 touros
  toolssBulls: any[]; // bulls do ToolSSApp
  selectedClient: any; // cliente selecionado do ToolSSApp
  selectedFarm: any; // fazenda selecionada do ToolSSApp
  autoCalculatePopulation: boolean; // se deve calcular automaticamente a população
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

// Função para calcular PTAs médias das mães baseadas no rebanho
function calculateMothersPTAs(selectedFarm: any, selectedPTAs: PTAKey[]): Record<CategoryKey, Record<string, number>> {
  if (!selectedFarm || !selectedFarm.females || selectedPTAs.length === 0) {
    return {
      novilhas: {},
      primiparas: {},
      secundiparas: {},
      multiparas: {}
    };
  }

  const categories = {
    novilhas: selectedFarm.females.filter((f: any) => f.categoria === "Calf" || f.categoria === "Heifer"),
    primiparas: selectedFarm.females.filter((f: any) => f.categoria === "Primiparous"),
    secundiparas: selectedFarm.females.filter((f: any) => f.categoria === "Secondiparous"),
    multiparas: selectedFarm.females.filter((f: any) => f.categoria === "Multiparous")
  };

  const result: Record<CategoryKey, Record<string, number>> = {
    novilhas: {},
    primiparas: {},
    secundiparas: {},
    multiparas: {}
  };

  Object.entries(categories).forEach(([categoryKey, females]) => {
    const key = categoryKey as CategoryKey;
    selectedPTAs.forEach(ptaKey => {
      const values = females.map((f: any) => f[ptaKey] || 0).filter(v => v !== 0);
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      result[key][ptaKey] = average;
    });
  });

  return result;
}

// Função para calcular estrutura populacional baseada no rebanho
function calculatePopulationStructure(selectedFarm: any): StructurePopulation {
  if (!selectedFarm || !selectedFarm.females) {
    return { total: 0, novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 };
  }

  const novilhas = selectedFarm.females.filter((f: any) => f.categoria === "Calf" || f.categoria === "Heifer").length;
  const primiparas = selectedFarm.females.filter((f: any) => f.categoria === "Primiparous").length;  
  const secundiparas = selectedFarm.females.filter((f: any) => f.categoria === "Secondiparous").length;
  const multiparas = selectedFarm.females.filter((f: any) => f.categoria === "Multiparous").length;
  const total = novilhas + primiparas + secundiparas + multiparas;

  return { total, novilhas, primiparas, secundiparas, multiparas };
}

// ---------- Estado & Persistência ----------
const LS_KEY = "projGen_MVP_state_v2";

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
          novilhas: {},
          primiparas: {},
          secundiparas: {},
          multiparas: {},
        },
      },
      bulls: [],
      selectedPTAs: ["NM$", "TPI", "PL", "SCS", "DPR"], // PTAs padrão
      numberOfBulls: 3,
      toolssBulls: [],
      selectedClient: null,
      selectedFarm: null,
      autoCalculatePopulation: false,
    } as AppState;
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // Carrega dados do ToolSSApp do localStorage
  useEffect(() => {
    try {
      const toolssData = localStorage.getItem("toolss_clients_v2_with_500_females");
      if (toolssData) {
        const clients = JSON.parse(toolssData);
        setState(prev => ({ ...prev, toolssClients: clients }));
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do ToolSSApp:", e);
    }
  }, []);

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
        service: { novilhas: 60, primiparas: 55, secundiparas: 50, multiparas: 45 },
        conception: { novilhas: 45, primiparas: 40, secundiparas: 37, multiparas: 35 },
        preex: { novilhas: 92, primiparas: 90, secundiparas: 88, multiparas: 86 },
      },
      mothers: {
        values: {
          novilhas: { "NM$": 420, "TPI": 2400, "PL": 350, "SCS": -0.15, "DPR": 1.2 },
          primiparas: { "NM$": 380, "TPI": 2200, "PL": 300, "SCS": -0.10, "DPR": 1.0 },
          secundiparas: { "NM$": 340, "TPI": 2000, "PL": 260, "SCS": -0.05, "DPR": 0.8 },
          multiparas: { "NM$": 300, "TPI": 1800, "PL": 220, "SCS": 0.00, "DPR": 0.6 },
        },
      },
      bulls: [
        {
          id: "bull1",
          name: "Bull Alpha",
          naab: "7HO17191",
          empresa: "Select Sires",
          semen: "Sexado",
          pricePerDose: 155,
          doses: { novilhas: 120, primiparas: 60, secundiparas: 20, multiparas: 0 },
          pta: { "NM$": 820, "TPI": 2800, "PL": 900, "SCS": -0.25, "DPR": 1.8 },
        },
        {
          id: "bull2",
          name: "Bull Beta",
          naab: "7HO17192",
          empresa: "Select Sires",
          semen: "Convencional",
          pricePerDose: 75,
          doses: { novilhas: 40, primiparas: 90, secundiparas: 70, multiparas: 60 },
          pta: { "NM$": 650, "TPI": 2500, "PL": 750, "SCS": -0.18, "DPR": 1.2 },
        },
        {
          id: "bull3",
          name: "Bull Core",
          naab: "7HO17193",
          empresa: "Select Sires",
          semen: "Sexado",
          pricePerDose: 135,
          doses: { novilhas: 30, primiparas: 30, secundiparas: 40, multiparas: 60 },
          pta: { "NM$": 720, "TPI": 2600, "PL": 820, "SCS": -0.20, "DPR": 1.4 },
        },
      ],
      selectedPTAs: ["NM$", "TPI", "PL", "SCS", "DPR"],
      numberOfBulls: 3,
      toolssBulls: [],
      selectedClient: null,
      selectedFarm: null,
      autoCalculatePopulation: false,
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

    const byBull = state.bulls.slice(0, state.numberOfBulls).map((b) => {
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

      const ptaPondNumerator: Record<string, number> = {};
      state.selectedPTAs.forEach(pta => {
        ptaPondNumerator[pta] = 0;
      });

      CATEGORIES.forEach(({ key }) => {
        const doses = b.doses[key] || 0;
        const conc = clamp01((state.repro.conception[key] || 0) / 100);
        const preex = clamp01((state.repro.preex[key] || 0) / 100);
        const prenhezes = doses * conc;
        const prenhezesConfirm = prenhezes * preex;
        const bez = prenhezesConfirm * femaleRate;
        bezPorCat[key] = bez;
        bezerrasTotais += bez;

        state.selectedPTAs.forEach((pta) => {
          const ptaMae = state.mothers.values[key][pta] || 0;
          const ptaTouro = b.pta[pta] || 0;
          const ptaFilha = (ptaMae + ptaTouro) / 2;
          ptaPondNumerator[pta] += ptaFilha * bez;
        });
      });

      const ptaPond: Record<string, number> = {};
      state.selectedPTAs.forEach((pta) => {
        ptaPond[pta] = bezerrasTotais > 0 ? ptaPondNumerator[pta] / bezerrasTotais : 0;
      });

      const custoPorBezerra = bezerrasTotais > 0 ? valorTotal / bezerrasTotais : 0;
      const retornoGen = (ptaPond["NM$"] || 0) * bezerrasTotais; // R$ com base no NM$ médio ponderado
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

    const ptaPondGeral: Record<string, number> = {};
    state.selectedPTAs.forEach(pta => {
      ptaPondGeral[pta] = 0;
    });

    if (totalBez > 0) {
      state.selectedPTAs.forEach((pta) => {
        const num = byBull.reduce((s, r) => s + (r.ptaPond[pta] || 0) * r.bezerrasTotais, 0);
        ptaPondGeral[pta] = num / totalBez;
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

function Input({ value, onChange, type = "text", placeholder, min, disabled }: { value: any; onChange: (v: any) => void; type?: string; placeholder?: string; min?: number; disabled?: boolean }) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      type={type}
      placeholder={placeholder}
      min={min}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${COLORS.gray}`,
        borderRadius: 10,
        outline: "none",
        background: disabled ? "#f5f5f5" : "#fff",
        color: disabled ? "#666" : "inherit",
        cursor: disabled ? "not-allowed" : "inherit",
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: any; onChange: (v: any) => void; options: string[] | { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.gray}`, borderRadius: 10, background: "#fff" }}
    >
      {options.map((op) => {
        const optValue = typeof op === 'string' ? op : op.value;
        const optLabel = typeof op === 'string' ? op : op.label;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
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

  // Carrega dados do ToolSSApp se disponível
  const [toolssClients, setToolssClients] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      const toolssData = localStorage.getItem("toolss_clients_v2_with_500_females");
      if (toolssData) {
        const clients = JSON.parse(toolssData);
        setToolssClients(clients);
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do ToolSSApp:", e);
    }
  }, []);

  // Atualiza PTAs das mães quando rebanho ou PTAs selecionadas mudam
  useEffect(() => {
    if (st.selectedFarm && st.selectedPTAs.length > 0) {
      const calculatedPTAs = calculateMothersPTAs(st.selectedFarm, st.selectedPTAs);
      setSt(prev => ({ ...prev, mothers: { values: calculatedPTAs } }));
    }
  }, [st.selectedFarm, st.selectedPTAs, setSt]);

  // Atualiza estrutura populacional quando rebanho muda e auto-cálculo está ativado
  useEffect(() => {
    if (st.selectedFarm && st.autoCalculatePopulation) {
      const calculatedStructure = calculatePopulationStructure(st.selectedFarm);
      setSt(prev => ({ ...prev, structure: calculatedStructure }));
    }
  }, [st.selectedFarm, st.autoCalculatePopulation, setSt]);

  const selectedClientData = toolssClients.find(c => c.id === st.selectedClient?.id);
  const farms = selectedClientData?.farms || [];

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

      {/* Seleção de Cliente e Fazenda do ToolSSApp */}
      {toolssClients.length > 0 && (
        <Section title="🎯 Dados do Rebanho (ToolSS)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>Cliente/Rebanho</Label>
              <Select 
                value={st.selectedClient?.id || ""} 
                onChange={(v) => {
                  const client = toolssClients.find(c => c.id === parseInt(v));
                  setSt(s => ({ ...s, selectedClient: client, selectedFarm: null }));
                }}
                options={[
                  { value: "", label: "Selecione um cliente" },
                  ...toolssClients.map(c => ({ value: c.id.toString(), label: `#${c.id} - ${c.nome}` }))
                ]}
              />
            </div>
            <div>
              <Label>Fazenda</Label>
              <Select 
                value={st.selectedFarm?.id ? st.selectedFarm.id.toString() : ""} 
                onChange={(v) => {
                  if (v === "") {
                    setSt(s => ({ ...s, selectedFarm: null }));
                  } else {
                    const farm = farms.find((f: any) => f.id === parseInt(v));
                    setSt(s => ({ ...s, selectedFarm: farm }));
                  }
                }}
                options={[
                  { value: "", label: "Selecione uma fazenda" },
                  ...farms.map((f: any) => ({ value: f.id.toString(), label: `${f.nome} (${f.females?.length || 0} fêmeas)` }))
                ]}
              />
            </div>
          </div>
          {st.selectedFarm && (
            <div style={{ marginTop: 12, padding: 10, background: "#f0f9ff", borderRadius: 8, fontSize: 12 }}>
              <strong>Rebanho selecionado:</strong> {st.selectedFarm.nome}<br/>
              <strong>Total de fêmeas:</strong> {st.selectedFarm.females?.length || 0}<br/>
              <strong>Distribuição automática por categoria será calculada</strong>
            </div>
          )}
        </Section>
      )}

      {/* Seleção de PTAs */}
      <Section title="📊 Seleção de PTAs para Análise">
        <div style={{ marginBottom: 12 }}>
          <Label>Selecione até 5 PTAs para análise (atual: {st.selectedPTAs.length}/5)</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 8 }}>
            {ALL_PTAS.map(pta => (
              <label key={pta} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 4, 
                fontSize: 11,
                padding: 4,
                borderRadius: 4,
                background: st.selectedPTAs.includes(pta) ? "#e0f2fe" : "transparent",
                cursor: "pointer"
              }}>
                <input 
                  type="checkbox" 
                  checked={st.selectedPTAs.includes(pta)}
                  onChange={(e) => {
                    if (e.target.checked && st.selectedPTAs.length < 5) {
                      setSt(s => ({ ...s, selectedPTAs: [...s.selectedPTAs, pta] }));
                    } else if (!e.target.checked) {
                      setSt(s => ({ ...s, selectedPTAs: s.selectedPTAs.filter(p => p !== pta) }));
                    }
                  }}
                  disabled={!st.selectedPTAs.includes(pta) && st.selectedPTAs.length >= 5}
                />
                {pta}
              </label>
            ))}
          </div>
        </div>
      </Section>

      <Section title="📋 Premissas Reprodutivas da Fazenda">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Estrutura populacional */}
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Estrutura Populacional</h3>
            
            {/* Opção para cálculo automático */}
            <div style={{ marginBottom: 12, padding: 8, background: "#f8f9fa", borderRadius: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={st.autoCalculatePopulation}
                  onChange={(e) => setSt(s => ({ ...s, autoCalculatePopulation: e.target.checked }))}
                />
                <strong>Calcular automaticamente com base no rebanho selecionado</strong>
              </label>
              {st.autoCalculatePopulation && !st.selectedFarm && (
                <div style={{ fontSize: 11, color: COLORS.red, marginTop: 4 }}>
                  ⚠️ Selecione um rebanho para cálculo automático
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <Label>Total de fêmeas aptas</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={st.structure.total} 
                  onChange={(v) => setSt((s) => ({ ...s, structure: { ...s.structure, total: v === "" ? 0 : v } }))}
                  disabled={st.autoCalculatePopulation}
                />
              </div>
              {CATEGORIES.map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={(st.structure as any)[key]}
                    onChange={(v) => setSt((s) => ({ ...s, structure: { ...s.structure, [key]: v === "" ? 0 : v } }))}
                    disabled={st.autoCalculatePopulation}
                  />
                </div>
              ))}
            </div>
            {overflow && (
              <div style={{ marginTop: 8, color: COLORS.red, fontWeight: 700 }}>Somatório das categorias excede o Total de fêmeas.</div>
            )}
            {st.autoCalculatePopulation && st.selectedFarm && (
              <div style={{ marginTop: 8, fontSize: 11, color: "#16a34a" }}>
                ✅ Estrutura calculada automaticamente: {st.structure.total} fêmeas
              </div>
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
          {st.selectedFarm ? (
            <div style={{ padding: 10, background: "#f0f9ff", borderRadius: 8, fontSize: 12, marginBottom: 8 }}>
              <strong>📊 Valores calculados automaticamente baseados no rebanho selecionado</strong><br/>
              Rebanho: {st.selectedFarm.nome} ({st.selectedFarm.females?.length || 0} fêmeas)
            </div>
          ) : (
            <div style={{ padding: 10, background: "#fef3c7", borderRadius: 8, fontSize: 12, marginBottom: 8 }}>
              ⚠️ Selecione um rebanho acima para cálculo automático ou insira valores manualmente
            </div>
          )}
          
          {st.selectedPTAs.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: COLORS.gray }}>
                  <th style={{ textAlign: "left", padding: 6 }}>Categoria</th>
                  {st.selectedPTAs.map((attr) => (
                    <th key={attr} style={{ textAlign: "left", padding: 6 }}>PTA {attr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(({ key, label }) => (
                  <tr key={key}>
                    <td style={{ padding: 6 }}>{label}</td>
                    {st.selectedPTAs.map((attr) => (
                      <td key={attr} style={{ padding: 6 }}>
                        <Input
                          type="number"
                          value={st.mothers.values[key][attr] || 0}
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
          )}
        </div>
      </Section>
    </div>
  );
}

function PageBulls({ st, setSt }: { st: AppState; setSt: React.Dispatch<React.SetStateAction<AppState>> }) {
  // Carrega dados do ToolSSApp se disponível
  const [toolssBulls, setToolssBulls] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      const toolssData = localStorage.getItem("toolss_clients_v2_with_500_females");
      if (toolssData) {
        const clients = JSON.parse(toolssData);
        const allBulls = clients.flatMap((c: any) => 
          c.farms.flatMap((f: any) => f.bulls || [])
        );
        setToolssBulls(allBulls);
      }
    } catch (e) {
      console.warn("Erro ao carregar touros do ToolSSApp:", e);
    }
  }, []);

  // Inicializa touros se necessário
  useEffect(() => {
    if (st.bulls.length < st.numberOfBulls) {
      const newBulls = [];
      for (let i = st.bulls.length; i < st.numberOfBulls; i++) {
        const defaultPTA: Record<string, number> = {};
        st.selectedPTAs.forEach(pta => {
          defaultPTA[pta] = 0;
        });
        
        newBulls.push({
          id: `bull${i + 1}`,
          name: "",
          naab: "",
          empresa: "",
          semen: "Sexado" as SemenType,
          pricePerDose: 0,
          doses: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
          pta: defaultPTA,
        });
      }
      if (newBulls.length > 0) {
        setSt(s => ({ ...s, bulls: [...s.bulls, ...newBulls] }));
      }
    }
  }, [st.numberOfBulls, st.bulls.length, st.selectedPTAs, setSt]);

  return (
    <div>
      {/* Seleção do número de touros */}
      <Section title="🐂 Configuração de Touros">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <Label>Número de touros para análise (1-5)</Label>
            <Select 
              value={st.numberOfBulls} 
              onChange={(v) => setSt(s => ({ ...s, numberOfBulls: parseInt(v) }))}
              options={[
                { value: "1", label: "1 touro" },
                { value: "2", label: "2 touros" },
                { value: "3", label: "3 touros" },
                { value: "4", label: "4 touros" },
                { value: "5", label: "5 touros" },
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <div style={{ fontSize: 12, color: COLORS.black }}>
              PTAs selecionadas: {st.selectedPTAs.join(", ")}
            </div>
          </div>
        </div>
      </Section>

      {/* Configuração de cada touro */}
      {st.bulls.slice(0, st.numberOfBulls).map((b, idx) => (
        <Section key={b.id} title={`Touro ${idx + 1}`}>
          {/* Seleção do touro do ToolSSApp */}
          {toolssBulls.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Label>Selecionar touro do ToolSS</Label>
              <Select 
                value={b.naab || ""} 
                onChange={(naab) => {
                  if (naab === "") {
                    // Limpa o touro
                    setSt(s => ({ 
                      ...s, 
                      bulls: s.bulls.map((bull, i) => 
                        i === idx ? {
                          ...bull,
                          name: "",
                          naab: "",
                          empresa: "",
                          pta: Object.fromEntries(st.selectedPTAs.map(pta => [pta, 0]))
                        } : bull
                      )
                    }));
                  } else {
                    const selectedBull = toolssBulls.find(bull => bull.naab === naab);
                    if (selectedBull) {
                      const updatedPTA: Record<string, number> = {};
                      st.selectedPTAs.forEach(pta => {
                        updatedPTA[pta] = selectedBull[pta] || 0;
                      });
                      
                      setSt(s => ({ 
                        ...s, 
                        bulls: s.bulls.map((bull, i) => 
                          i === idx ? {
                            ...bull,
                            name: selectedBull.nome,
                            naab: selectedBull.naab,
                            empresa: selectedBull.empresa || "",
                            pta: updatedPTA
                          } : bull
                        )
                      }));
                    }
                  }
                }}
                options={[
                  { value: "", label: "Selecione um touro" },
                  ...toolssBulls.map(bull => ({
                    value: bull.naab,
                    label: `${bull.naab} - ${bull.nome} (${bull.empresa || "S/Empresa"})`
                  }))
                ]}
              />
              {b.naab && (
                <div style={{ marginTop: 4, fontSize: 11, color: "#16a34a" }}>
                  ✅ PTAs carregadas automaticamente para as {st.selectedPTAs.length} características selecionadas
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
            <div>
              <Label>Nome do Touro</Label>
              <Input value={b.name} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, name: v } : bb)) }))} placeholder="Digite o nome" />
            </div>
            <div>
              <Label>NAAB</Label>
              <Input value={b.naab} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, naab: v } : bb)) }))} placeholder="NAAB" />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={b.empresa || ""} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, empresa: v } : bb)) }))} placeholder="Empresa" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(st.selectedPTAs.length, 5)}, 1fr)`, gap: 8 }}>
              {st.selectedPTAs.map((attr) => (
                <div key={attr}>
                  <Label>{attr}</Label>
                  <Input
                    type="number"
                    value={b.pta[attr] || 0}
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

    const labelsBulls = calc.byBull.map((r) => `${r.bull.name || `Touro ${r.bull.id}`} (${r.bull.naab})`);

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

    // 3) Radar: PTAs médias das filhas (ponderadas) – PTAs selecionadas
    const radarLabels = st.selectedPTAs.map((k) => `PTA ${k}`);
    const radarDatasets = calc.byBull.map((r) => ({ 
      label: `${r.bull.name || `Touro ${r.bull.id}`}`, 
      data: st.selectedPTAs.map((k) => r.ptaPond[k] || 0) 
    }));
    radarRef.current = createChart("chart-radar", {
      type: "radar",
      data: { labels: radarLabels, datasets: radarDatasets },
      options: { responsive: true, elements: { line: { borderWidth: 2 } } },
    });

    // 4) Linha: Custo por bezerra × NM$ por touro
    const lineLabels = labelsBulls;
    const seriesCusto = calc.byBull.map((r) => r.custoPorBezerra);
    const seriesNM = calc.byBull.map((r) => r.ptaPond["NM$"] || 0);
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
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(st.selectedPTAs.length, 5)}, 1fr)`, gap: 12 }}>
          {st.selectedPTAs.map((k) => (
            <div key={k} style={{ background: COLORS.white, border: `1px dashed ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: COLORS.black }}>PTA média geral – {k}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{NUM(calc.ptaPondGeral[k] || 0, 2)}</div>
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
                <th style={{ textAlign: "left", padding: 6 }}>NAAB</th>
                <th style={{ textAlign: "left", padding: 6 }}>Empresa</th>
                <th style={{ textAlign: "left", padding: 6 }}>Tipo</th>
                <th style={{ textAlign: "right", padding: 6 }}>Doses Totais</th>
                <th style={{ textAlign: "right", padding: 6 }}>R$ Total</th>
                <th style={{ textAlign: "right", padding: 6 }}>Bezerras Totais</th>
                {st.selectedPTAs.map((k) => (
                  <th key={k} style={{ textAlign: "right", padding: 6 }}>PTA {k}</th>
                ))}
                <th style={{ textAlign: "right", padding: 6 }}>R$/Bezerra</th>
                <th style={{ textAlign: "right", padding: 6 }}>ROI (R$)</th>
              </tr>
            </thead>
            <tbody>
              {calc.byBull.map((r) => (
                <tr key={r.bull.id}>
                  <td style={{ padding: 6 }}>{r.bull.name || `Touro ${r.bull.id}`}</td>
                  <td style={{ padding: 6 }}>{r.bull.naab}</td>
                  <td style={{ padding: 6 }}>{r.bull.empresa || "–"}</td>
                  <td style={{ padding: 6 }}>{r.bull.semen}</td>
                  <td style={{ textAlign: "right", padding: 6 }}>{NUM(r.dosesTotal, 0)}</td>
                  <td style={{ textAlign: "right", padding: 6 }}>{BRL(r.valorTotal)}</td>
                  <td style={{ textAlign: "right", padding: 6 }}>{NUM(r.bezerrasTotais, 2)}</td>
                  {st.selectedPTAs.map((k) => (
                    <td key={k} style={{ textAlign: "right", padding: 6 }}>{NUM(r.ptaPond[k] || 0, 2)}</td>
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
            const bestNM = [...calc.byBull].sort((a, b) => (b.ptaPond["NM$"] || 0) - (a.ptaPond["NM$"] || 0))[0];
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Maior NM$ médio</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{bestNM ? `${bestNM.bull.name || bestNM.bull.id} (${NUM(bestNM.ptaPond["NM$"] || 0, 2)})` : "–"}</div>
              </div>
            );
          })()}
          {/* Menor custo por bezerra */}
          {(() => {
            const bestCost = [...calc.byBull].filter((x) => x.bezerrasTotais > 0).sort((a, b) => a.custoPorBezerra - b.custoPorBezerra)[0];
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Menor custo por bezerra</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{bestCost ? `${bestCost.bull.name || bestCost.bull.id} (${BRL(bestCost.custoPorBezerra)})` : "–"}</div>
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
                  {bestROI ? `${bestROI.bull.name || bestROI.bull.id} (${BRL(bestROI.roi)})` : "–"}
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