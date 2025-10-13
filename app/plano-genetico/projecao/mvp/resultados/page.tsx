import ROIWidget, { BullPlan } from "@/components/plano-genetico/ROIWidget";
import { PGBreadcrumb } from "@/components/plano-genetico/PGBreadcrumb";
import { ROISectionHeader } from "@/components/plano-genetico/ROISectionHeader";

async function customIndexResolver(bullId: string): Promise<number | null> {
  // TODO: substituir por RPC real (ex.: ag_eval_custom_index_for_bull)
  return null;
}

const mock: BullPlan[] = [
  {
    bull_id: "B1",
    bull_name: "Toro A",
    doses: { sexed_doses: 30, conv_doses: 10, price_sexed: 210, price_conv: 95 },
    indices: { "NM$": 720, "TPI": 2820, "HHP$": 890, "CM$": 780, "FM$": 560 },
  },
  {
    bull_id: "B2",
    bull_name: "Toro B",
    doses: { sexed_doses: 15, conv_doses: 25, price_sexed: 205, price_conv: 90 },
    indices: { "NM$": 680, "TPI": 2760, "HHP$": 860, "CM$": 760, "FM$": 545 },
  },
];

export default function PageResultados() {
  return (
    <div className="container py-6">
      <PGBreadcrumb />
      <ROISectionHeader />
      <div className="mt-2">
        <ROIWidget data={mock} customIndexResolver={customIndexResolver} customIndexLabel="Índice da Segmentação" />
      </div>
    </div>
  );
}
