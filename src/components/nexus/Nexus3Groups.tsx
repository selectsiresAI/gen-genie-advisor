"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Nexus3Groups() {
  const supabase = createClientComponentClient();

  const [farmId, setFarmId] = useState<string | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedTrait, setSelectedTrait] = useState<string>("ptam");
  const [mothersData, setMothersData] = useState<any[]>([]);
  const [bullsSearch, setBullsSearch] = useState<string>("");
  const [bullsFound, setBullsFound] = useState<any[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Resolve fazenda padrão
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const paramFarm = url.searchParams.get("farmId");
        if (paramFarm) {
          setFarmId(paramFarm);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");
        const { data: prof } = await supabase
          .from("profiles")
          .select("default_farm_id")
          .eq("id", user.id)
          .single();
        if (!prof?.default_farm_id) throw new Error("Perfil sem fazenda padrão");
        setFarmId(prof.default_farm_id);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [supabase]);

  // Carrega lista de PTAs
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("nx3_list_pta_traits");
      if (!error && data) setTraits(data.map((d: any) => d.trait.toLowerCase()));
    })();
  }, [supabase]);

  // Busca médias das mães
  async function loadMothers() {
    if (!farmId || !selectedTrait) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("nx3_mothers_yearly_avg", {
        p_trait: selectedTrait,
        p_farm: farmId,
      });
      if (error) throw error;
      setMothersData(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Busca de touros tipo PROCV no public.bulls
  async function searchBulls() {
    if (!bullsSearch) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("nx3_bulls_lookup", {
      p_query: bullsSearch,
      p_trait: selectedTrait,
      p_limit: 12,
    });
    if (error) setError(error.message);
    else setBullsFound(data || []);
    setLoading(false);
  }

  // Adiciona touro à seleção
  function addBull(bull: any) {
    if (!selectedBulls.find((b) => b.id === bull.id)) {
      setSelectedBulls([...selectedBulls, { ...bull, percent: 100 }]);
    }
  }

  // Calcula médias das filhas (Nexus formula)
  useEffect(() => {
    if (mothersData.length && selectedBulls.length) {
      const bullsAvg =
        selectedBulls.reduce((acc, b) => acc + (b.trait_value || 0) * (b.percent || 0) / 100, 0) /
        selectedBulls.reduce((acc, b) => acc + (b.percent || 0), 0);

      const daughters = mothersData.map((m) => ({
        year: m.birth_year,
        mothers_avg: m.avg_value,
        daughters_pred: ((m.avg_value + bullsAvg) / 2) * 0.93,
      }));

      setChartData(daughters);
    }
  }, [mothersData, selectedBulls]);

  // Carrega automaticamente
  useEffect(() => {
    if (farmId) loadMothers();
  }, [farmId, selectedTrait]);

  if (error)
    return (
      <div className="p-6 text-red-700 bg-red-50 rounded-xl">
        <b>Erro:</b> {error}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nexus 3 — Acasalamento em Grupos</h1>

      {/* Seleção de PTA */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label htmlFor="trait">Escolha o PTA:</Label>
          <select
            id="trait"
            value={selectedTrait}
            onChange={(e) => setSelectedTrait(e.target.value)}
            className="border rounded-md p-2 bg-white"
          >
            {traits.map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <Button onClick={loadMothers} variant="default">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Atualizar"}
        </Button>
      </div>

      {/* Busca de touros */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Touros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Digite código ou nome do touro... (ex: 7HO, 007HO)"
              value={bullsSearch}
              onChange={(e) => setBullsSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchBulls()}
            />
            <Button onClick={searchBulls}>
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Buscar"}
            </Button>
          </div>

          {bullsFound.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {bullsFound.map((b) => (
                <Card
                  key={b.id}
                  className="p-3 cursor-pointer hover:bg-neutral-100"
                  onClick={() => addBull(b)}
                >
                  <div className="font-semibold">{b.code}</div>
                  <div className="text-sm text-neutral-600">
                    PTA ({selectedTrait.toUpperCase()}): {b.trait_value?.toFixed(0)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Touros selecionados */}
      {selectedBulls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Touros Selecionados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedBulls.map((b, idx) => (
              <div key={b.id} className="flex justify-between items-center">
                <div>
                  <b>{b.code}</b> — {b.trait_value?.toFixed(0)}
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={b.percent}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const updated = [...selectedBulls];
                    updated[idx].percent = val;
                    setSelectedBulls(updated);
                  }}
                  className="w-20 text-right border rounded-md p-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gráfico Mães vs Filhas */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projeção Genética — Mães vs Filhas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mothers_avg" stroke="#ED1C24" name="Mães (Média)" />
                <Line type="monotone" dataKey="daughters_pred" stroke="#8DC63F" name="Filhas (Predição)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
