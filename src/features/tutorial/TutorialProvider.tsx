"use client";
import { createContext, useContext, useMemo, useState, useCallback } from "react";
import TourSpotlight from "./TourSpotlight";
import { fetchTutorial, getOrInitProgress, updateProgress, tutorialsEnabled } from "./api";
import type { TutorialStep } from "./types";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const __DEV__ = import.meta.env.MODE !== "production";

/** TODO: troque por seu hook real (ex.: useAGFilters().farmId) */
function useTenantId() {
  // Simplified: use userId as tenantId for single-tenant setup
  const session = useSupabaseSession();
  return session?.user?.id ?? null;
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
  const session = useSupabaseSession();
  const userId = session?.user?.id ?? null;
  const tenantId = useTenantId();
  // Fallback: se não houver tenant (ex.: Home), usamos userId como "tenant efetivo"
  const effectiveTenantId = tenantId ?? userId ?? null;

  console.log("[TutorialProvider] Render:", { hasSession: !!session, userId, tenantId, effectiveTenantId });

  const [active, setActive] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [idx, setIdx] = useState(0);

  const start = useCallback(async (s: string) => {
    try {
      console.log("[tutorial] start called", { slug: s, userId, effectiveTenantId });

      if (!userId || !effectiveTenantId) {
        console.error("[tutorial] ❌ Não foi possível iniciar: usuário não autenticado");
        return;
      }

      const enabled = await tutorialsEnabled();
      if (!enabled) {
        console.log("[tutorial] tutorials disabled");
        return;
      }

      console.log("[tutorial] ✓ Enabled, fetching tutorial...");
      const { steps } = await fetchTutorial(s);
      console.log("[tutorial] fetched steps", { slug: s, count: steps?.length ?? 0, steps });
      if (!steps?.length) {
        console.log("[tutorial] ❌ no steps found");
        return;
      }

      console.log("[tutorial] ✓ Steps found, getting progress...");
      const progress = await getOrInitProgress({ userId, tenantId: effectiveTenantId, slug: s });
      const startAt = progress.is_completed ? 0 : progress.current_step ?? 0;
      console.log("[tutorial] progress", { startAt, progress });

      console.log("[tutorial] ✓ Setting state to activate tutorial...");
      setSteps(steps);
      setIdx(Math.min(startAt, steps.length - 1));
      setSlug(s);
      setActive(true);
      console.log("[tutorial] ✅ Tutorial activated!");
    } catch (error) {
      console.error("[tutorial] ❌ Error starting tutorial:", error);
    }
  }, [userId, effectiveTenantId]);

  const reset = useCallback(async (s: string) => {
    if (!userId || !effectiveTenantId) return;
    await updateProgress({ userId, tenantId: effectiveTenantId, slug: s, currentStep: 0, isCompleted: false });
    localStorage.removeItem(`toolss:tutorial:auto:${s}:${userId}:${effectiveTenantId}`);
  }, [userId, effectiveTenantId]);

  // Helpers globais para debug em DEV
  if (__DEV__) {
    // @ts-ignore
    (window as any).toolssStartTutorial = (slug: string) => start(slug);
    // @ts-ignore
    (window as any).toolssResetTutorial = (slug: string) => reset(slug);
  }

  const ctx = useMemo<Ctx>(() => ({ start, reset, isActive: active, step: idx }), [start, reset, active, idx]);
  const step = steps[idx];

  console.log("[TutorialProvider] Current state:", { active, hasStep: !!step, slug, stepIndex: idx, stepsCount: steps.length });

  return (
    <TutorialCtx.Provider value={ctx}>
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
            const nextIndex = idx - 1; setIdx(nextIndex);
            if (userId && effectiveTenantId) await updateProgress({ userId, tenantId: effectiveTenantId, slug, currentStep: nextIndex });
          } : undefined}
          onNext={idx < steps.length - 1 ? async () => {
            const nextIndex = idx + 1; setIdx(nextIndex);
            if (userId && effectiveTenantId) await updateProgress({ userId, tenantId: effectiveTenantId, slug, currentStep: nextIndex });
          } : undefined}
          onDone={async () => {
            setActive(false);
            if (userId && effectiveTenantId) await updateProgress({ userId, tenantId: effectiveTenantId, slug, currentStep: steps.length - 1, isCompleted: true });
          }}
        />
      )}
    </TutorialCtx.Provider>
  );
}
