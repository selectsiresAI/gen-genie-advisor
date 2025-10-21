import { supabase } from "@/integrations/supabase/client";
import type { TutorialDef, TutorialStep } from "./types";

export async function fetchTutorial(slug: string) {
  const { data: def, error: e1 } = await supabase
    .from("tutorial_defs")
    .select("*")
    .eq("slug", slug)
    .single();
  if (e1) throw e1;

  const { data: steps, error: e2 } = await supabase
    .from("tutorial_steps")
    .select("*")
    .eq("tutorial_slug", slug)
    .order("step_order", { ascending: true });
  if (e2) throw e2;

  return { def: def as TutorialDef, steps: (steps ?? []) as TutorialStep[] };
}

export async function getOrInitProgress(params: {
  userId: string;
  tenantId: string;
  slug: string;
}) {
  const { userId, tenantId, slug } = params;

  const { data: existing, error: e0 } = await supabase
    .from("tutorial_user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("tutorial_slug", slug)
    .maybeSingle();
  if (e0) throw e0;
  if (existing) return existing;

  const { data, error } = await supabase
    .from("tutorial_user_progress")
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      tutorial_slug: slug,
      current_step: 0,
      is_completed: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProgress(params: {
  userId: string;
  tenantId: string;
  slug: string;
  currentStep: number;
  isCompleted?: boolean;
}) {
  const { userId, tenantId, slug, currentStep, isCompleted = false } = params;
  const { error } = await supabase
    .from("tutorial_user_progress")
    .update({
      current_step: currentStep,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("tutorial_slug", slug);
  if (error) throw error;
}

// Simplified: tutorials are always enabled
export async function tutorialsEnabled() {
  return true;
}
