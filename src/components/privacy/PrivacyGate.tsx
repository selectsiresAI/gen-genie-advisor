import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PRIVACY_EFFECTIVE, PRIVACY_VERSIONS, docHash, privacyApi, ptx } from "@/lib/privacy";
import { useI18n } from "@/providers/I18nProvider";

const LOCALES: { code: "pt-BR" | "en-US" | "es"; label: string }[] = [
  { code: "pt-BR", label: "PT" },
  { code: "en-US", label: "EN" },
  { code: "es", label: "ES" },
];

// Tela de aceite: bloqueia o ToolSS até o usuário aceitar a política e o termo, nas versões vigentes.
export function PrivacyGate() {
  const { locale, setLocale } = useI18n();
  const queryClient = useQueryClient();
  const [policy, setPolicy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${PRIVACY_EFFECTIVE}T12:00:00`));
  const t = (key: string, vars?: Record<string, string | number>) => ptx(locale, key, vars);

  async function submit() {
    setSaving(true);
    setError(false);
    try {
      const [hp, ht] = await Promise.all([docHash("policy", locale), docHash("terms", locale)]);
      const status = await privacyApi.accept({ locale, hashes: { policy: hp, terms: ht } });
      queryClient.setQueryData(["toolss-privacy-status"], status);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="absolute right-4 top-4 flex gap-1 rounded-md bg-background/90 p-1">
        {LOCALES.map((l) => (
          <button key={l.code} type="button" onClick={() => setLocale(l.code)} className={`rounded px-2.5 py-1 text-xs font-semibold ${locale === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            {l.label}
          </button>
        ))}
      </div>
      <div role="dialog" aria-modal="true" aria-labelledby="privacy-title" className="my-auto w-full max-w-[600px] overflow-hidden rounded-2xl bg-background shadow-2xl">
        <header className="flex items-center gap-3 px-6 pb-2 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">T</div>
          <h1 id="privacy-title" className="text-lg font-bold leading-tight">{t("gate.title")}</h1>
        </header>
        <p className="px-6 text-sm text-muted-foreground">{t("gate.lead")}</p>

        <div className="mx-6 mt-3 max-h-[280px] overflow-y-auto rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-[13.5px]">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="mb-3 last:mb-0">
              <h2 className="mb-0.5 text-[13.5px] font-bold">{t(`gate.h${n}`)}</h2>
              <p>{t(`gate.b${n}`)}</p>
            </div>
          ))}
        </div>

        <p className="mx-6 mt-2.5 text-[13.5px]">
          <a href="/privacidade#politica" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-2 hover:underline">{t("gate.readPolicy")}</a>
          {" · "}
          <a href="/privacidade#termo" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-2 hover:underline">{t("gate.readTerms")}</a>{" "}
          <span className="text-muted-foreground">{t("gate.readNote")}</span>
        </p>

        <label className="mx-6 mt-4 flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={policy} onChange={(e) => setPolicy(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
          <span>
            <b>{t("gate.acceptPolicy", { version: PRIVACY_VERSIONS.policy, date })}</b>
            <span className="ml-1.5 rounded-full bg-destructive/10 px-2 py-px text-[11px] font-bold tracking-wide text-destructive">{t("gate.required")}</span>
          </span>
        </label>
        <label className="mx-6 mt-3 flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
          <span>
            <b>{t("gate.acceptTerms", { version: PRIVACY_VERSIONS.terms })}</b>
            <span className="ml-1.5 rounded-full bg-destructive/10 px-2 py-px text-[11px] font-bold tracking-wide text-destructive">{t("gate.required")}</span>
          </span>
        </label>

        {error && <p className="mx-6 mt-3 text-[13px] text-destructive">{t("gate.error")}</p>}

        <div className="flex flex-wrap items-center justify-end gap-2.5 px-6 pb-6 pt-5">
          <p className="basis-full text-xs text-muted-foreground">{t("gate.hint")}</p>
          <Button variant="outline" onClick={() => void supabase.auth.signOut()}>{t("gate.signOut")}</Button>
          <Button disabled={!policy || !terms || saving} onClick={() => void submit()}>
            {saving ? t("gate.saving") : t("gate.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
