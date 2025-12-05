import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeneticCalculator, ServiceType } from "@/hooks/useGeneticCalculator";

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "sexed", label: "Sêmen sexado" },
  { value: "conventional", label: "Sêmen convencional" },
  { value: "beef", label: "Sêmen de Corte" },
];

export function Phase3Strategy() {
  const { inputs, outputs, setStrategyInputs } = useGeneticCalculator();
  const { strategy } = inputs;
  const { roi } = outputs;

  const updateHeifersGroup = (key: "superior" | "intermediate" | "inferior", value: number) => {
    setStrategyInputs((prev) => {
      const remaining = 100 - value;
      let newGroup = { ...prev.heifersGroup, [key]: value };
      
      if (key === "superior") {
        const meio = Math.min(prev.heifersGroup.intermediate, remaining);
        newGroup = { superior: value, intermediate: meio, inferior: remaining - meio };
      } else if (key === "intermediate") {
        const top = Math.min(prev.heifersGroup.superior, remaining);
        newGroup = { superior: top, intermediate: value, inferior: remaining - top };
      } else {
        const top = Math.min(prev.heifersGroup.superior, remaining);
        newGroup = { superior: top, intermediate: remaining - top, inferior: value };
      }
      
      return { ...prev, heifersGroup: newGroup };
    });
  };

  const updateCowsGroup = (key: "superior" | "intermediate" | "inferior", value: number) => {
    setStrategyInputs((prev) => {
      const remaining = 100 - value;
      let newGroup = { ...prev.cowsGroup, [key]: value };
      
      if (key === "superior") {
        const meio = Math.min(prev.cowsGroup.intermediate, remaining);
        newGroup = { superior: value, intermediate: meio, inferior: remaining - meio };
      } else if (key === "intermediate") {
        const top = Math.min(prev.cowsGroup.superior, remaining);
        newGroup = { superior: top, intermediate: value, inferior: remaining - top };
      } else {
        const top = Math.min(prev.cowsGroup.superior, remaining);
        newGroup = { superior: top, intermediate: remaining - top, inferior: value };
      }
      
      return { ...prev, cowsGroup: newGroup };
    });
  };

  const updateHeifersPlan = (key: keyof typeof strategy.heifersPlan, value: ServiceType | number) => {
    setStrategyInputs((prev) => ({
      ...prev,
      heifersPlan: { ...prev.heifersPlan, [key]: value },
    }));
  };

  const updateCowsPlan = (key: keyof typeof strategy.cowsPlan, value: ServiceType | number) => {
    setStrategyInputs((prev) => ({
      ...prev,
      cowsPlan: { ...prev.cowsPlan, [key]: value },
    }));
  };

  const heifersTotal = strategy.heifersGroup.superior + strategy.heifersGroup.intermediate + strategy.heifersGroup.inferior;
  const cowsTotal = strategy.cowsGroup.superior + strategy.cowsGroup.intermediate + strategy.cowsGroup.inferior;

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            3
          </span>
          Fase 3 - Estratégia genética
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Novilhas */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Novilhas</h3>
            
            <div className="space-y-4">
              {/* Superior */}
              <Card className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Superior</span>
                    <span className="font-bold text-lg">{strategy.heifersGroup.superior}%</span>
                  </div>
                  <Slider
                    value={[strategy.heifersGroup.superior]}
                    onValueChange={([value]) => updateHeifersGroup("superior", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Intermediário */}
              <Card className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Intermediário</span>
                    <span className="font-bold text-lg">{strategy.heifersGroup.intermediate}%</span>
                  </div>
                  <Slider
                    value={[strategy.heifersGroup.intermediate]}
                    onValueChange={([value]) => updateHeifersGroup("intermediate", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Inferior */}
              <Card className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Inferior</span>
                    <span className="font-bold text-lg">{strategy.heifersGroup.inferior}%</span>
                  </div>
                  <Slider
                    value={[strategy.heifersGroup.inferior]}
                    onValueChange={([value]) => updateHeifersGroup("inferior", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Total */}
              <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                <span className="font-semibold">
                  Total: {heifersTotal}% {heifersTotal === 100 ? '✓' : '⚠️'}
                </span>
              </div>

              <div>
                <Label>Valor genético da Mãe</Label>
                <Input
                  type="number"
                  value={strategy.heifersPlan.damGeneticValue}
                  onChange={(e) => updateHeifersPlan("damGeneticValue", Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3">
                {(["firstService", "secondService", "thirdService"] as const).map((service, idx) => (
                  <div key={service}>
                    <Label>{idx + 1}º serviço</Label>
                    <Select
                      value={strategy.heifersPlan[service]}
                      onValueChange={(value: ServiceType) => updateHeifersPlan(service, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grupo Vacas */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Grupo Vacas</h3>
            
            <div className="space-y-4">
              {/* Superior */}
              <Card className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Superior</span>
                    <span className="font-bold text-lg">{strategy.cowsGroup.superior}%</span>
                  </div>
                  <Slider
                    value={[strategy.cowsGroup.superior]}
                    onValueChange={([value]) => updateCowsGroup("superior", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Intermediário */}
              <Card className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Intermediário</span>
                    <span className="font-bold text-lg">{strategy.cowsGroup.intermediate}%</span>
                  </div>
                  <Slider
                    value={[strategy.cowsGroup.intermediate]}
                    onValueChange={([value]) => updateCowsGroup("intermediate", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Inferior */}
              <Card className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Inferior</span>
                    <span className="font-bold text-lg">{strategy.cowsGroup.inferior}%</span>
                  </div>
                  <Slider
                    value={[strategy.cowsGroup.inferior]}
                    onValueChange={([value]) => updateCowsGroup("inferior", value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Total */}
              <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                <span className="font-semibold">
                  Total: {cowsTotal}% {cowsTotal === 100 ? '✓' : '⚠️'}
                </span>
              </div>

              <div>
                <Label>Valor genético da Mãe</Label>
                <Input
                  type="number"
                  value={strategy.cowsPlan.damGeneticValue}
                  onChange={(e) => updateCowsPlan("damGeneticValue", Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3">
                {(["firstService", "secondService", "thirdService"] as const).map((service, idx) => (
                  <div key={service}>
                    <Label>{idx + 1}º serviço</Label>
                    <Select
                      value={strategy.cowsPlan[service]}
                      onValueChange={(value: ServiceType) => updateCowsPlan(service, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos - usando valores calculados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div>
            <h4 className="text-center mb-4 font-semibold">Bezerras vivas ao nascer</h4>
            <div className="space-y-2">
              <div className="bg-blue-500 text-white p-2 rounded text-center">
                <div className="text-sm">Substituições necessárias</div>
                <div className="text-lg font-bold">{roi.heifersNeededAtBirth}</div>
              </div>
              <div className="bg-green-500 text-white p-2 rounded text-center">
                <div className="text-sm">Substituições criadas</div>
                <div className="text-lg font-bold">{roi.totalHeifersBorn}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-center mb-4 font-semibold">Novilhas entrando no rebanho em lactação</h4>
            <div className="space-y-2">
              <div className="bg-blue-500 text-white p-2 rounded text-center">
                <div className="text-sm">Substituições necessárias</div>
                <div className="text-lg font-bold">{roi.heifersNeededAtLactation}</div>
              </div>
              <div className="bg-green-500 text-white p-2 rounded text-center">
                <div className="text-sm">Substituições criadas</div>
                <div className="text-lg font-bold">{roi.heifersCreated}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
