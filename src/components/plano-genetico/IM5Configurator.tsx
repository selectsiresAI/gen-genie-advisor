"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const TRAIT_OPTIONS = [
  { key: "PTA_MILK_KG", label: "Leite (kg)" },
  { key: "PTA_FAT_KG", label: "Gordura (kg)" },
  { key: "PTA_PROT_KG", label: "Proteína (kg)" },
  { key: "PL_MO", label: "Vida Produtiva (meses)" },
  { key: "DPR_PP", label: "Fertilidade (DPR p.p.)" },
  { key: "SCS", label: "Célula Somática (SCS)" },
  { key: "NM$_INDEX", label: "NM$ (index)" },
  { key: "HHP$_INDEX", label: "HHP$ (index)" },
  { key: "TPI_INDEX", label: "TPI (index)" },
  { key: "CM$_INDEX", label: "CM$ (index)" },
  { key: "FM$_INDEX", label: "FM$ (index)" },
];

export type IM5Config = {
  traits: string[];
  weights: Record<string, number>;
  femaleRate: number;
  conceptionRate: number;
};

export function IM5Configurator({
  farmId,
  defaultTraits = [
    "PTA_FAT_KG",
    "PTA_PROT_KG",
    "PTA_MILK_KG",
    "PL_MO",
    "DPR_PP",
  ],
  onApply,
}: {
  farmId: string;
  defaultTraits?: string[];
  onApply: (cfg: IM5Config) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [ev, setEv] = useState<Record<string, number>>({});
  const [traits, setTraits] = useState<string[]>(defaultTraits);
  const [femaleRate, setFemaleRate] = useState<number>(0.47);
  const [conceptionRate, setConceptionRate] = useState<number>(0.35);

  useEffect(() => {
    async function loadEV() {
      if (!farmId) return;
      const { data } = await supabase
        .from("app.economic_values")
        .select("trait,value_per_unit")
        .eq("farm_id", farmId)
        .eq("is_active", true);

      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.trait] = Number(r.value_per_unit);
      });
      setEv(map);
    }

    loadEV();
  }, [farmId, supabase]);

  const updateTrait = (idx: number, val: string) => {
    const arr = [...traits];
    arr[idx] = val;
    setTraits(arr);
  };

  const setWeight = (trait: string, val: string) => {
    setEv((prev) => ({ ...prev, [trait]: Number(val) || 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {traits.map((t, i) => (
          <div key={i} className="space-y-1">
            <Label>Traço {i + 1}</Label>
            <Select value={t} onValueChange={(v) => updateTrait(i, v)}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o traço" />
              </SelectTrigger>
              <SelectContent>
                {TRAIT_OPTIONS.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">R$/unid</span>
              <Input
                value={ev[t] ?? 0}
                onChange={(e) => setWeight(t, e.target.value)}
                type="number"
                step="0.01"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label>Taxa de fêmeas (0–1)</Label>
          <Input
            type="number"
            step="0.01"
            value={femaleRate}
            onChange={(e) => setFemaleRate(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Taxa de concepção (0–1)</Label>
          <Input
            type="number"
            step="0.01"
            value={conceptionRate}
            onChange={(e) => setConceptionRate(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <Button
        onClick={() =>
          onApply({ traits, weights: ev, femaleRate, conceptionRate })
        }
      >
        Aplicar IM5$
      </Button>
    </div>
  );
}
