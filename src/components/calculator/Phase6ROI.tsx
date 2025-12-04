import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGeneticCalculator } from "@/hooks/useGeneticCalculator";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function Phase6ROI() {
  const { outputs } = useGeneticCalculator();
  const { dosesNeeded, roi } = outputs;

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            6
          </span>
          Fase 6 - Retorno sobre investimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Doses e embriões necessários */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Doses e embriões necessários</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Vacas</th>
                  <th className="border border-gray-300 p-2 text-center">Novilhas</th>
                  <th className="border border-gray-300 p-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado</td>
                  <td className="border border-gray-300 p-2 text-center">{Math.round(dosesNeeded.sexed.annual * 0.23)}</td>
                  <td className="border border-gray-300 p-2 text-center">{Math.round(dosesNeeded.sexed.annual * 0.77)}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.sexed.annual}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Convencional</td>
                  <td className="border border-gray-300 p-2 text-center">{Math.round(dosesNeeded.conventional.annual * 0.9)}</td>
                  <td className="border border-gray-300 p-2 text-center">{Math.round(dosesNeeded.conventional.annual * 0.1)}</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.conventional.annual}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Conv NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões sexado</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Corte</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.beef.annual}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">{dosesNeeded.beef.annual}</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {Math.round(dosesNeeded.sexed.annual * 0.23) + Math.round(dosesNeeded.conventional.annual * 0.9) + dosesNeeded.beef.annual}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {Math.round(dosesNeeded.sexed.annual * 0.77) + Math.round(dosesNeeded.conventional.annual * 0.1)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {dosesNeeded.sexed.annual + dosesNeeded.conventional.annual + dosesNeeded.beef.annual}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Investimento genética */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Investimento genética</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Custo/dose</th>
                  <th className="border border-gray-300 p-2 text-center">Sêmen</th>
                  <th className="border border-gray-300 p-2 text-center">Custo Genética</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 200,00</td>
                  <td className="border border-gray-300 p-2 text-center">{formatCurrency(roi.sexedGeneticCost)}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Convencional</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 50,00</td>
                  <td className="border border-gray-300 p-2 text-center">{formatCurrency(roi.conventionalGeneticCost)}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Conv NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões sexado</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Corte</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 20,00</td>
                  <td className="border border-gray-300 p-2 text-center">{formatCurrency(roi.beefGeneticCost)}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">{formatCurrency(roi.totalGeneticCost)}</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Animais vendidos */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Animais vendidos</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Número</th>
                  <th className="border border-gray-300 p-2 text-center">Valor/animal</th>
                  <th className="border border-gray-300 p-2 text-center">Valor total</th>
                  <th className="border border-gray-300 p-2 text-center">Retorno</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Machos de leite</td>
                  <td className="border border-gray-300 p-2 text-center">{roi.dairyMaleCalves}</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 100,00</td>
                  <td className="border border-gray-300 p-2 text-center">{formatCurrency(roi.dairyMaleCalves * 100)}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Machos de corte</td>
                  <td className="border border-gray-300 p-2 text-center">{roi.beefCalves}</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 400,00</td>
                  <td className="border border-gray-300 p-2 text-center">{formatCurrency(roi.beefCalves * 400)}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Fêmeas de corte</td>
                  <td className="border border-gray-300 p-2 text-center">{roi.beefHeifers}</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 500,00</td>
                  <td className="border border-gray-300 p-2 text-center">{formatCurrency(roi.beefHeifers * 500)}</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total vendas</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {formatCurrency(roi.dairyMaleCalves * 100 + roi.beefCalves * 400 + roi.beefHeifers * 500)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Retorno sobre investimento */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Retorno sobre investimento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Investimento total:</span>
              <span className="font-bold ml-2">{formatCurrency(roi.totalGeneticCost)}</span>
            </div>
            <div>
              <span className="text-gray-600">Receita vendas:</span>
              <span className="font-bold ml-2">
                {formatCurrency(roi.dairyMaleCalves * 100 + roi.beefCalves * 400 + roi.beefHeifers * 500)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Margem:</span>
              <span className={`font-bold ml-2 ${roi.margin < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(roi.margin)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Margem por novilha:</span>
              <span className={`font-bold ml-2 ${roi.marginPerHeifer < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(roi.marginPerHeifer)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
