"use client";
import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";

export type ObjectiveChoice =
  | { kind: "BUILTIN"; key: "HHP$" | "TPI" | "NM$" | "FM$" | "CM$" }
  | { kind: "CUSTOM"; id: string; name: string };

type Ctx = {
  objective: ObjectiveChoice | null;
  setObjective: Dispatch<SetStateAction<ObjectiveChoice | null>>;
};
const PlanObjectiveContext = createContext<Ctx | undefined>(undefined);

export function PlanObjectiveProvider({ children }: { children: React.ReactNode }) {
  const [objective, setObjective] = useState<ObjectiveChoice | null>(null);
  return (
    <PlanObjectiveContext.Provider value={{ objective, setObjective }}>
      {children}
    </PlanObjectiveContext.Provider>
  );
}

export function usePlanObjective() {
  const ctx = useContext(PlanObjectiveContext);
  if (!ctx) throw new Error("usePlanObjective must be used within PlanObjectiveProvider");
  return ctx;
}
