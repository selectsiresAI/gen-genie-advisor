import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, Legend, LabelList } from "recharts";
import { Loader2, Search, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { usePlanStore } from "@/hooks/usePlanStore";
import { cn } from "@/lib/utils";

interface Nexus3GroupsProps {
  onBack?: () => void;
  initialFarmId?: string | null;
  fallbackDefaultFarmId?: string | null;
}

interface MotherAverageRow {
  birth_year: number;
  avg_value: number | null;
}

interface BullSearchRow {
  id: string;
  code: string | null;
  naab?: string | null;
  name: string | null;
  trait_value: number | null;
}

interface BullSlotValue {
  id: string;
  code: string;
  name: string;
  value: number | null;
}

const supabase = createClient();

export function Nexus3Groups({ onBack, initialFarmId, fallbackDefaultFarmId }: Nexus3GroupsProps) {
  const { toast } = useToast();
  const selectedFarmIdFromStore = usePlanStore((state) => state.selectedFarmId);

  const [farmId, setFarmId] = useState<string | null>(initialFarmId ?? null);
  const [resolvingFarm, setResolvingFarm] = useState(false);

  const [traits, setTraits] = useState<string[]>([]);
  const [traitsLoading, setTraitsLoading] = useState(false);
  const [trait, setTrait] = useState<string | null>(null);

  const [mothers, setMothers] = useState<Record<string, number>>({});
  const [motherInputs, setMotherInputs] = useState<Record<string, string>>({});
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [mothersLoading, setMothersLoading] = useState(false);

  const [bullSlots, setBullSlots] = useState<(BullSlotValue | null)[]>([null, null, null]);
  const [bullAverage, setBullAverage] = useState(0);
  const [reloadBullsLoading, setReloadBullsLoading] = useState(false);

  const [searchOpenFor, setSearchOpenFor] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BullSearchRow[]>([]);

  const profileLookupAttempted = useRef(false);
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const queryFarmId = params.get("farmId") || params.get("farm_id");
    if (queryFarmId) {
      setFarmId(queryFarmId);
    }
  }, []);

  useEffect(() => {
    if (!farmId && initialFarmId) {
      setFarmId(initialFarmId);
    }
  }, [farmId, initialFarmId]);

  useEffect(() => {
    if (!farmId && selectedFarmIdFromStore) {
      setFarmId(selectedFarmIdFromStore);
    }
  }, [farmId, selectedFarmIdFromStore]);

  useEffect(() => {
    if (farmId) return;

    if (fallbackDefaultFarmId) {
      setFarmId(fallbackDefaultFarmId);
      return;
    }

    if (profileLookupAttempted.current) return;
    profileLookupAttempted.current = true;

    setResolvingFarm(true);
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const userId = data.user?.id;
        if (!userId) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("default_farm_id")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar perfil", error);
          toast({
            title: "Não foi possível carregar a fazenda padrão",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (profile?.default_farm_id) {
          setFarmId(profile.default_farm_id);
        }
      })
      .finally(() => setResolvingFarm(false));
  }, [farmId, fallbackDefaultFarmId, toast]);

  const loadTraits = useCallback(async () => {
    setTraitsLoading(true);
    const { data, error } = await supabase.rpc("nx3_list_pta_traits");
    if (error) {
      console.error("Erro ao carregar traits", error);
      toast({
        title: "Erro ao carregar traits",
        description: error.message,
        variant: "destructive",
      });
      setTraits([]);
      setTrait(null);
      setTraitsLoading(false);
      return;
    }

    if (!Array.isArray(data)) {
      setTraits([]);
      setTrait(null);
      setTraitsLoading(false);
      return;
    }

    const normalized = (data as Array<string | { trait?: string | null }>)
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === "string") {
          return entry.trim().toLowerCase();
        }
        const traitValue = entry.trait;
        if (typeof traitValue === "string" && traitValue.trim().length > 0) {
          return traitValue.trim().toLowerCase();
        }
        return null;
      })
      .filter((value): value is string => Boolean(value && value.length > 0));

    const uniqueTraits = Array.from(new Set(normalized));
    setTraits(uniqueTraits);

    if (uniqueTraits.length > 0) {
      setTrait((current) => current ?? uniqueTraits[0]);
    } else {
      setTrait(null);
    }

    setTraitsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadTraits();
  }, [loadTraits]);

  const loadMothers = useCallback(async () => {
    if (!trait || !farmId) return;
    setMothersLoading(true);
    const traitKey = trait?.toLowerCase();
    const { data, error } = await supabase.rpc("nx3_mothers_yearly_avg", {
      p_trait: traitKey,
      p_farm: farmId,
    });

    if (error) {
      console.error("Erro ao carregar médias das mães", error);
      toast({
        title: "Erro ao carregar médias",
        description: error.message,
        variant: "destructive",
      });
      setMothers({});
      setMotherInputs({});
      setSelectedYears([]);
    } else if (Array.isArray(data)) {
      const sorted = (data as MotherAverageRow[])
        .slice()
        .sort((a, b) => a.birth_year - b.birth_year);

      const mothersMap: Record<string, number> = {};
      const inputsMap: Record<string, string> = {};
      const years: string[] = [];

      sorted.forEach((row) => {
        const yearKey = String(row.birth_year);
        const value = Number(row.avg_value ?? 0);
        mothersMap[yearKey] = value;
        inputsMap[yearKey] = Number.isFinite(value) ? value.toFixed(2) : "0";
        years.push(yearKey);
      });

      setMothers(mothersMap);
      setMotherInputs(inputsMap);
      setSelectedYears(years);
    }

    setMothersLoading(false);
  }, [farmId, trait, toast]);

  useEffect(() => {
    loadMothers();
  }, [loadMothers]);

  // Recarrega os touros quando o trait for alterado para atualizar as PTAs selecionadas
  useEffect(() => {
    if (!trait) return;
    const ids = bullSlots.map((slot) => slot?.id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    setReloadBullsLoading(true);
    const traitKey = trait.toLowerCase();

    supabase
      .rpc("nx3_bulls_by_ids", {
        p_ids: ids,
        p_trait: traitKey,
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao recarregar touros", error);
          toast({
            title: "Erro ao recarregar touros",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (!Array.isArray(data)) return;
        const byId = new Map<string, BullSearchRow>();
        (data as BullSearchRow[]).forEach((row) => {
          if (row.id) {
            byId.set(row.id, row);
          }
        });

        setBullSlots((current) => {
          let changed = false;
          const updated = current.map((slot) => {
            if (!slot) return slot;
            const fresh = slot.id ? byId.get(slot.id) : null;
            const nextValue = fresh?.trait_value ?? null;
            if (slot.value === nextValue) {
              return slot;
            }
            changed = true;
            return {
              ...slot,
              value: nextValue,
            };
          });

          return changed ? updated : current;
        });
      })
      .finally(() => setReloadBullsLoading(false));
  }, [bullSlots, trait, toast]);

  useEffect(() => {
    const values = bullSlots
      .map((slot) => (typeof slot?.value === "number" ? slot.value : null))
      .filter((value): value is number => value !== null && Number.isFinite(value));

    if (values.length === 0) {
      setBullAverage(0);
    } else {
      const sum = values.reduce((acc, value) => acc + value, 0);
      setBullAverage(sum / values.length);
    }
  }, [bullSlots]);

  const handleToggleYear = useCallback((year: string) => {
    setSelectedYears((current) => {
      const exists = current.includes(year);
      if (exists) {
        return current.filter((item) => item !== year);
      }
      return [...current, year].sort((a, b) => Number(a) - Number(b));
    });
  }, []);

  const handleMotherChange = useCallback((year: string, value: string) => {
    setMotherInputs((current) => ({
      ...current,
      [year]: value,
    }));

    const parsed = Number.parseFloat(value.replace(",", "."));
    setMothers((current) => ({
      ...current,
      [year]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }, []);

  const handleBullSelection = useCallback((slotIndex: number, bull: BullSearchRow) => {
    if (!bull.id) return;
    setBullSlots((current) => {
      const next = [...current];
      next[slotIndex] = {
        id: bull.id,
        code: bull.code ?? bull.naab ?? "-",
        name: bull.name ?? "Sem nome",
        value: bull.trait_value ?? null,
      };
      return next;
    });
    setSearchOpenFor(null);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleBullRemoval = useCallback((slotIndex: number) => {
    setBullSlots((current) => {
      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  useEffect(() => {
    if (searchOpenFor === null) return;
    if (!trait) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    setSearchLoading(true);
    searchDebounceRef.current = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("nx3_bulls_lookup", {
        p_query: searchQuery.trim(),
        p_trait: trait.toLowerCase(),
        p_limit: 8,
      });

      if (error) {
        console.error("Erro na busca de touros", error);
        toast({
          title: "Erro na busca",
          description: error.message,
          variant: "destructive",
        });
        setSearchResults([]);
      } else if (Array.isArray(data)) {
        setSearchResults(data as BullSearchRow[]);
      }
      setSearchLoading(false);
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchOpenFor, searchQuery, trait, toast]);

  const chartData = useMemo(() => {
    const sortedYears = [...selectedYears].sort((a, b) => Number(a) - Number(b));
    return sortedYears.map((year) => {
      const mother = mothers[year] ?? 0;
      const daughter = ((mother + bullAverage) / 2) * 0.93;
      return {
        year,
        mae: mother,
        maeLabel: Math.round(mother),
        filha: daughter,
        filhaLabel: Math.round(daughter),
      };
    });
  }, [selectedYears, mothers, bullAverage]);

  const isReady = Boolean(farmId && trait);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            {onBack && (
              <Button variant="outline" size="icon" onClick={onBack} className="mt-1 h-9 w-9 border-red-200 text-red-600 hover:bg-red-50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Nexus 3</p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Nexus 3 — Acasalamento em Grupos (Etapa 1)
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Compare as médias do rebanho com touros selecionados e visualize o impacto esperado nas próximas gerações.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-wide text-slate-500">Trait</Label>
              <Select value={trait ?? undefined} onValueChange={setTrait} disabled={traitsLoading || traits.length === 0}>
                <SelectTrigger className="w-[220px] border-red-200 focus:ring-red-500">
                  <SelectValue placeholder={traitsLoading ? "Carregando..." : "Selecione"}>
                    {trait ? trait.toUpperCase() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {traits.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card className="border-red-200 bg-white/80 shadow-sm">
              <CardContent className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Média dos touros</p>
                  <p className="text-xl font-bold text-slate-900">{bullAverage.toFixed(2)}</p>
                </div>
                {reloadBullsLoading && <Loader2 className="ml-auto h-5 w-5 animate-spin text-red-500" />}
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        {!farmId && !resolvingFarm && (
          <Card className="border-dashed border-red-300 bg-white/70">
            <CardContent className="py-10 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-700">Selecione uma fazenda para continuar.</p>
              <p className="mt-2 text-sm text-slate-500">
                É necessário escolher uma fazenda para carregar as médias das mães e sugerir touros.
              </p>
            </CardContent>
          </Card>
        )}

        {resolvingFarm && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Localizando fazenda padrão...</span>
          </div>
        )}

        {isReady && (
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-slate-900">Touros selecionados</h2>
                <p className="text-sm text-slate-600">
                  Pesquise por NAAB, código ou nome para preencher até três slots. Os valores serão atualizados automaticamente ao trocar o trait.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {bullSlots.map((slot, index) => (
                  <Card key={index} className="relative border-slate-200 bg-white/80 shadow-sm">
                    <CardContent className="space-y-4 py-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot {index + 1}</p>
                          {slot ? (
                            <>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{slot.name}</p>
                              <p className="text-xs text-slate-500">{slot.code}</p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">Nenhum touro selecionado</p>
                          )}
                        </div>
                        {slot && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => handleBullRemoval(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Popover
                        open={searchOpenFor === index}
                        onOpenChange={(open) => {
                          setSearchOpenFor(open ? index : null);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-2 border-slate-200">
                            <Search className="h-4 w-4 text-red-500" />
                            {slot ? "Trocar touro" : "Selecionar touro"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar NAAB, código ou nome"
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                            />
                            <CommandList>
                              {searchLoading && (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Buscando touros...
                                </div>
                              )}
                              <CommandEmpty>Nenhum touro encontrado.</CommandEmpty>
                              <CommandGroup>
                                {searchResults.map((bull) => (
                                  <CommandItem
                                    key={bull.id}
                                    onSelect={() => handleBullSelection(index, bull)}
                                    className="flex flex-col items-start gap-1 px-3 py-2"
                                  >
                                    <span className="text-sm font-semibold text-slate-900">{bull.name ?? "Sem nome"}</span>
                                    <span className="text-xs text-slate-500">{bull.code || bull.naab || "Sem código"}</span>
                                    <span className="text-xs font-medium text-red-600">PTA: {bull.trait_value?.toFixed(2) ?? "-"}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="rounded-lg border border-dashed border-red-200 bg-red-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">PTA ({trait?.toUpperCase()})</p>
                        <p className="text-lg font-bold text-red-600">{slot?.value?.toFixed(2) ?? "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-slate-900">Médias das mães por ano</h2>
                <p className="text-sm text-slate-600">
                  Ajuste manualmente as médias quando necessário. Desative os anos que não deseja considerar na projeção.
                </p>
              </div>

              {mothersLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando médias das mães...
                </div>
              ) : Object.keys(mothers).length === 0 ? (
                <Card className="border-dashed border-slate-200 bg-white/70">
                  <CardContent className="py-8 text-center text-sm text-slate-600">
                    Nenhum dado de mães encontrado para este trait. Ajuste a fazenda selecionada ou escolha outro trait para
                    começar.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Object.entries(mothers)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([year, value]) => {
                      const isActive = selectedYears.includes(year);
                      return (
                        <Card
                          key={year}
                          className={cn(
                            "border bg-white/80 shadow-sm transition-all",
                            isActive ? "border-red-200 ring-1 ring-red-100" : "opacity-70"
                          )}
                        >
                          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ano</p>
                              <CardTitle className="text-2xl text-slate-900">{year}</CardTitle>
                            </div>
                            <Switch checked={isActive} onCheckedChange={() => handleToggleYear(year)} />
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label htmlFor={`mother-${year}`} className="text-xs uppercase tracking-wide text-slate-500">
                                PTA ({trait?.toUpperCase()})
                              </Label>
                              <Input
                                id={`mother-${year}`}
                                type="text"
                                inputMode="decimal"
                                value={motherInputs[year] ?? value.toFixed(2)}
                                onChange={(event) => handleMotherChange(year, event.target.value)}
                                className="mt-1 border-slate-200 focus-visible:ring-red-500"
                              />
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2 text-xs text-slate-600">
                              <p>
                                Filha prevista: {" "}
                                <span className="font-semibold text-slate-900">
                                  {(((value + bullAverage) / 2) * 0.93).toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </section>

            <section>
              <Card className="border border-slate-200 bg-white/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-900">Projeção: Mães vs. Filhas</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Selecione pelo menos um ano para visualizar o gráfico.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 24, right: 24, bottom: 12, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "#CBD5F5" }} />
                        <YAxis tickLine={false} axisLine={{ stroke: "#CBD5F5" }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="mae" name="Mães" stroke="#ED1C24" strokeWidth={3} dot={{ r: 4 }}>
                          <LabelList dataKey="maeLabel" position="top" fill="#b91c1c" />
                        </Line>
                        <Line type="monotone" dataKey="filha" name="Filhas" stroke="#1F2937" strokeWidth={3} dot={{ r: 4 }}>
                          <LabelList dataKey="filhaLabel" position="top" fill="#1F2937" />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Nexus3Groups;
