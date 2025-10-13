"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type ObjectiveChoice =
  | { kind: "BUILTIN"; key: "HHP$" | "TPI" | "NM$" | "FM$" | "CM$" }
  | { kind: "CUSTOM"; id: string; name: string };

type Ctx = {
  objective: ObjectiveChoice | null;
  setObjective: Dispatch<SetStateAction<ObjectiveChoice | null>>;
};
const PlanObjectiveContext = createContext<Ctx | undefined>(undefined);

function isSameObjective(a: ObjectiveChoice | null, b: ObjectiveChoice | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "BUILTIN" && b.kind === "BUILTIN") {
    return a.key === b.key;
  }
  if (a.kind === "CUSTOM" && b.kind === "CUSTOM") {
    return a.id === b.id && a.name === b.name;
  }
  return false;
}

type ProviderProps = {
  children: React.ReactNode;
  initialObjective?: ObjectiveChoice | null;
  onObjectiveChange?: (value: ObjectiveChoice | null) => void;
};

export function PlanObjectiveProvider({
  children,
  initialObjective = null,
  onObjectiveChange,
}: ProviderProps) {
  const [objective, setObjectiveState] = useState<ObjectiveChoice | null>(initialObjective ?? null);

  useEffect(() => {
    setObjectiveState((prev) => {
      const next = initialObjective ?? null;
      if (isSameObjective(prev, next)) {
        return prev;
      }
      return next;
    });
  }, [initialObjective]);

  const setObjective = useCallback<Dispatch<SetStateAction<ObjectiveChoice | null>>>(
    (value) => {
      setObjectiveState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        const normalizedNext = next ?? null;
        if (isSameObjective(prev, normalizedNext)) {
          return prev;
        }
        onObjectiveChange?.(normalizedNext);
        return normalizedNext;
      });
    },
    [onObjectiveChange]
  );

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
