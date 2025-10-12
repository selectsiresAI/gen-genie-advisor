"use client";
import { createContext, useContext, useEffect, useState } from "react";
import TourSpotlight from "./TourSpotlight";
import { fetchTutorial, getOrInitProgress, updateProgress, tutorialsEnabled } from "./api";
import type { TutorialStep } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useAGFilters } from "@/features/auditoria/store";

const __DEV__ = process.env.NODE_ENV !== "production";

/**
 * TODO: Trocar por seu hook real de tenant (ex.: useAGFilters().farmId)
 * Retorne o UUID do tenant/farm atual.
 */
function useTenantId(): string | null {
  const filters = useAGFilters();
  const farmId = filters?.farmId;

  if (process.env.NODE_ENV !== "production") {
    console.debug("Tutorial tenantId", farmId);
  }

  if (typeof farmId === "string" && farmId.length > 0) return farmId;
  if (typeof farmId === "number" && Number.isFinite(farmId)) return String(farmId);
  return null;
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
  const [session, setSession] = useState<any>(null);

  // Get session from Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const tenantId = useTenantId();
  const userId = session?.user?.id ?? null;
  const effectiveTenantId = tenantId ?? userId ?? null;

  const [active, setActive] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [idx, setIdx] = useState(0);

  async function start(s: string) {
    if (__DEV__) console.debug("[tutorial] start called", { slug: s, userId, tenantId, effectiveTenantId });

    if (!userId || !effectiveTenantId) {
      if (__DEV__) console.debug("[tutorial] abort: missing ids", { userId, tenantId, effectiveTenantId, slug: s });
      return;
    }

    const enabled = await tutorialsEnabled(effectiveTenantId);
    if (__DEV__) console.debug("[tutorial] tutorialsEnabled", { effectiveTenantId, enabled });
    if (!enabled) return;

    const { steps } = await fetchTutorial(s);
    if (__DEV__) console.debug("[tutorial] fetched steps", { slug: s, count: steps?.length ?? 0, steps });
    if (!steps?.length) return;

    const progress = await getOrInitProgress({ userId, tenantId: effectiveTenantId, slug: s });
    const startAt = progress.is_completed ? 0 : progress.current_step ?? 0;
    if (__DEV__) console.debug("[tutorial] progress", { progress, startAt });

    setSteps(steps);
    setIdx(Math.min(startAt, steps.length - 1));
    setSlug(s);
    setActive(true);
  }

  async function reset(s: string) {
    if (!userId || !effectiveTenantId) return;
    if (__DEV__) console.debug("[tutorial] reset called", { slug: s, userId, tenantId, effectiveTenantId });
    await updateProgress({ userId, tenantId: effectiveTenantId, slug: s, currentStep: 0, isCompleted: false });
    localStorage.removeItem(`toolss:tutorial:auto:${s}:${userId}:${effectiveTenantId}`);
  }

  if (__DEV__ && typeof window !== "undefined") {
    // @ts-ignore
    window.toolssStartTutorial = (slug: string) => start(slug);
    // @ts-ignore
    window.toolssResetTutorial = (slug: string) => reset(slug);
  }

  const step = steps[idx];

  return (
    <TutorialCtx.Provider value={{ start, reset, isActive: active, step: idx }}>
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
            if (userId && effectiveTenantId) {
              if (__DEV__) console.debug("[tutorial] onPrev", { slug, nextIndex, userId, tenantId, effectiveTenantId });
              await updateProgress({ userId, tenantId: effectiveTenantId, slug, currentStep: nextIndex });
            }
          } : undefined}
          onNext={idx < steps.length - 1 ? async () => {
            const nextIndex = idx + 1;
            setIdx(nextIndex);
            if (userId && effectiveTenantId) {
              if (__DEV__) console.debug("[tutorial] onNext", { slug, nextIndex, userId, tenantId, effectiveTenantId });
              await updateProgress({ userId, tenantId: effectiveTenantId, slug, currentStep: nextIndex });
            }
          } : undefined}
          onDone={async () => {
            setActive(false);
            if (userId && effectiveTenantId) {
              if (__DEV__) console.debug("[tutorial] onDone", { slug, userId, tenantId, effectiveTenantId });
              await updateProgress({
                userId,
                tenantId: effectiveTenantId,
                slug,
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
