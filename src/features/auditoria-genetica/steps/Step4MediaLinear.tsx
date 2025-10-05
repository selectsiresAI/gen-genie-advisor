"use client";

import LinearMeansStep from "@/features/auditoria/LinearMeansStep";
import { useAGFilters } from "../store";

export default function Step4MediaLinear() {
  const { farmId } = useAGFilters();
  return <LinearMeansStep farmId={farmId} />;
}
