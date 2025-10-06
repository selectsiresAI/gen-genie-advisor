"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAGFilters } from "../store";

const INDEX_OPTIONS = [
  { label: "HHP$", value: "hhp_dollar" },
  { label: "TPI", value: "tpi" },
  { label: "NM$", value: "nm_dollar" },
  { label: "FM$", value: "fm_dollar" },
  { label: "CM$", value: "cm_dollar" },
];

export default function Step7QuartisIndices() {
  const { farmId } = useAGFilters(); // linka com a página Rebanho
  const [indexA, setIndexA] = useState("hhp_dollar");
  const [indexB, setIndexB] = useState("nm_dollar");

  useEffect(() => {
    if (farmId) {
      console.log(`Índices A vs B carregados para farmId: ${farmId}`);
    }
  }, [farmId]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        {/* Seletor do Índice A */}
        <Select value={indexA} onValueChange={setIndexA}>
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Selecione índice A" />
          </SelectTrigger>
          <SelectContent>
            {INDEX_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Seletor do Índice B */}
        <Select value={indexB} onValueChange={setIndexB}>
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Selecione índice B" />
          </SelectTrigger>
          <SelectContent>
            {INDEX_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
