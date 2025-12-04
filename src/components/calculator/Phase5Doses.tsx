import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGeneticCalculator } from "@/hooks/useGeneticCalculator";

export function Phase5Doses() {
  const { outputs } = useGeneticCalculator();
  const { dosesNeeded } = outputs;

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            5
          </span>
          Fase 5 - Doses necessárias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Doses necessárias</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Anual</th>
                  <th className="border border-gray-300 p-2 text-center">Mensal</th>
                  <th className="border border-gray-300 p-2 text-center">Semanal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.sexed.annual}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.sexed.monthly}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.sexed.weekly}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Convencional</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.conventional.annual}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.conventional.monthly}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.conventional.weekly}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Doses de corte</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.beef.annual}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.beef.monthly}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.beef.weekly}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
