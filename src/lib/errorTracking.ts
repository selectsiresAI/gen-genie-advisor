import { supabase } from "@/integrations/supabase/client";

// P3 observability: catches uncaught frontend errors and unhandled promise rejections,
// writes them to the existing `error_reports` table (RLS: own read + staff read all via
// has_role_v2, exposed to Grafana via grafana_readonly grant). No new tooling — reuses a
// table that already existed but had zero writers.

const RECENT_WINDOW_MS = 5_000;
const recentSignatures = new Map<string, number>();

function shouldReport(signature: string): boolean {
  const now = Date.now();
  const last = recentSignatures.get(signature);
  if (last && now - last < RECENT_WINDOW_MS) return false;
  recentSignatures.set(signature, now);
  // Keep the map from growing unbounded over a long session.
  if (recentSignatures.size > 200) {
    const cutoff = now - RECENT_WINDOW_MS;
    for (const [key, ts] of recentSignatures) {
      if (ts < cutoff) recentSignatures.delete(key);
    }
  }
  return true;
}

async function report(errorType: string, message: string, stack?: string, metadata?: Record<string, unknown>) {
  const signature = `${errorType}:${message}`;
  if (!shouldReport(signature)) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // error_reports.user_id has no NOT NULL constraint issue here — pre-auth errors are
    // still worth capturing, they just won't be attributable to a user.
    await supabase.from("error_reports" as never).insert({
      user_id: user?.id ?? null,
      error_type: errorType,
      error_message: message.slice(0, 2000),
      error_stack: stack?.slice(0, 4000) ?? null,
      page_url: window.location.href,
      metadata: metadata ?? null,
    } as never);
  } catch {
    // Never let error reporting itself break the app.
  }
}

export function initErrorTracking() {
  window.addEventListener("error", (event) => {
    report("uncaught_error", event.message, event.error?.stack, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    report("unhandled_rejection", message, stack);
  });
}
