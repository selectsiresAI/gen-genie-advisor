import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useGeneticCalculator } from "@/hooks/useGeneticCalculator";

interface Phase2ConceptionProps {
  useReferenceNumbers: boolean;
  setUseReferenceNumbers: (value: boolean) => void;
}

export function Phase2Conception({ useReferenceNumbers, setUseReferenceNumbers }: Phase2ConceptionProps) {
  const { inputs, setConceptionInputs } = useGeneticCalculator();
  const { conception } = inputs;

  const updateCows = (key: keyof typeof conception.cows, value: number) => {
    setConceptionInputs((prev) => ({
      ...prev,
      cows: { ...prev.cows, [key]: value },
    }));
  };

  const updateHeifers = (key: keyof typeof conception.heifers, value: number) => {
    setConceptionInputs((prev) => ({
      ...prev,
      heifers: { ...prev.heifers, [key]: value },
    }));
  };

  return (
    <TooltipProvider>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Fase 2 - Dados de concepção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="use-reference-phase2"
              checked={useReferenceNumbers}
              onCheckedChange={(checked) => setUseReferenceNumbers(checked === true)}
            />
            <Label htmlFor="use-reference-phase2">Usar números referência</Label>
          </div>

          <div className="space-y-6">
            {/* Taxa de concepção em vacas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Taxa de concepção em vacas</h3>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Convencional</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Referência: 35-45%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={useReferenceNumbers ? 40 : conception.cows.conventional}
                    onChange={(e) => updateCows("conventional", Number(e.target.value))}
                    className="mt-1"
                    disabled={useReferenceNumbers}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Corte</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Referência: 30-40%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={useReferenceNumbers ? 35 : conception.cows.beef}
                    onChange={(e) => updateCows("beef", Number(e.target.value))}
                    className="mt-1"
                    disabled={useReferenceNumbers}
                  />
                </div>
                <div>
                  <Label>Embriões</Label>
                  <Input
                    type="number"
                    value={conception.cows.embryos}
                    onChange={(e) => updateCows("embryos", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Embrião sexado</Label>
                  <Input
                    type="number"
                    value={conception.cows.sexedEmbryo}
                    onChange={(e) => updateCows("sexedEmbryo", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Taxa de concepção em novilhas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Taxa de concepção em novilhas</h3>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Sêmen Sexado</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Referência: 50-60%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={useReferenceNumbers ? 55 : conception.heifers.sexedSemen}
                    onChange={(e) => updateHeifers("sexedSemen", Number(e.target.value))}
                    className="mt-1"
                    disabled={useReferenceNumbers}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Convencional</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Referência: 65-75%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={useReferenceNumbers ? 70 : conception.heifers.conventional}
                    onChange={(e) => updateHeifers("conventional", Number(e.target.value))}
                    className="mt-1"
                    disabled={useReferenceNumbers}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Corte</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Referência: 55-65%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={useReferenceNumbers ? 60 : conception.heifers.beef}
                    onChange={(e) => updateHeifers("beef", Number(e.target.value))}
                    className="mt-1"
                    disabled={useReferenceNumbers}
                  />
                </div>
                <div>
                  <Label>Embriões</Label>
                  <Input
                    type="number"
                    value={conception.heifers.embryos}
                    onChange={(e) => updateHeifers("embryos", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Embrião sexado</Label>
                  <Input
                    type="number"
                    value={conception.heifers.sexedEmbryo}
                    onChange={(e) => updateHeifers("sexedEmbryo", Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
