import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// NEUTRALIZED 2026-09-26: this was a one-time migration script (old ToolSS V2 backend ->
// Platform), left deployed with verify_jwt=false and hardcoded service_role keys for TWO
// projects in its source (Platform + ToolSS V2), plus a send_reset step that could trigger
// password-recovery emails to arbitrary addresses unauthenticated. Anyone could call it.
// Migration is believed complete; function now always refuses. See RORDENS security audit
// session 2026-09-26 for full findings. Safe to delete entirely once confirmed no longer needed.

Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({ error: "gone", message: "This migration script has been retired." }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  );
});
