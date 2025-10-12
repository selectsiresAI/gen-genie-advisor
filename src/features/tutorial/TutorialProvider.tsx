"use client";
import { createContext, useContext, useMemo, useState } from "react";
import TourSpotlight from "./TourSpotlight";
import { fetchTutorial, getOrInitProgress, updateProgress, tutorialsEnabled } from "./api";
import type { TutorialStep } from "./types";
import { useSession } from "@supabase/auth-helpers-react";

/**
 * TODO: Trocar por seu hook real de tenant (ex.: useAGFilters().farmId)
 * Retorne o UUID do tenant/farm atual.
 */
function useTenantId(): string | null {
  try {
    return null; // substitua por: const { farmId } = useAGFilters(); return farmId ?? null;
  } catch {
    return null;
  }
}

type Ctx = {
  start(slug: string): Promise<void>;
  reset(slug: string): Promise<void>;
  isActive: boolean;
  step?: number;
};

const TutorialCtx = createContext<Ctx | null>(null);
export const useTutorial = () => {
  const ctx = useContext(TutorialCtx);
  if (!ctx) throw new Error("TutorialProvider ausente");
  return ctx;
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const tenantId = useTenantId();
  const userId = session?.user?.id ?? null;

  const [active, setActive] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [idx, setIdx] = useState(0);

  async function start(s: string) {
    if (!userId || !tenantId) return;
    const enabled = await tutorialsEnabled(tenantId);
    if (!enabled) return;

    const { steps } = await fetchTutorial(s);
    if (!steps?.length) return;

    const progress = await getOrInitProgress({ userId, tenantId, slug: s });
    const startAt = progress.is_completed ? 0 : progress.current_step ?? 0;

    setSteps(steps);
    setIdx(Math.min(startAt, steps.length - 1));
    setSlug(s);
    setActive(true);
  }

  async function reset(s: string) {
    if (!userId || !tenantId) return;
    await updateProgress({ userId, tenantId, slug: s, currentStep: 0, isCompleted: false });
    localStorage.removeItem(`toolss:tutorial:auto:${s}:${userId}:${tenantId}`);
  }

  const controls = useMemo<Ctx>(() => ({
    start, reset, isActive: active, step: idx
  }), [active, idx]);

  const step = steps[idx];

  return (
    <TutorialCtx.Provider value={controls}>
      {children}
      {step && slug && (
        <TourSpotlight
          visible={active}
          targetAttr={step.anchor}
          headline={step.headline}
          body={step.body}
          prevLabel={step.prev_label ?? undefined}
          nextLabel={step.next_label ?? undefined}
          doneLabel={step.done_label ?? undefined}
          onPrev={idx > 0 ? async () => {
            const nextIndex = idx - 1;
            setIdx(nextIndex);
            if (userId && tenantId) {
              await updateProgress({ userId, tenantId, slug, currentStep: nextIndex });
            }
          } : undefined}
          onNext={idx < steps.length - 1 ? async () => {
            const nextIndex = idx + 1;
            setIdx(nextIndex);
            if (userId && tenantId) {
              await updateProgress({ userId, tenantId, slug, currentStep: nextIndex });
            }
          } : undefined}
          onDone={async () => {
            setActive(false);
            if (userId && tenantId) {
              await updateProgress({
                userId, tenantId, slug,
                currentStep: steps.length - 1,
                isCompleted: true
              });
            }
          }}
        />
      )}
    </TutorialCtx.Provider>
  );
}
