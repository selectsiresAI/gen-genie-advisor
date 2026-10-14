import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolicyText, TermsText } from "@/components/privacy/PrivacyDocs";
import { PRIVACY_EFFECTIVE, PRIVACY_VERSIONS, ptx } from "@/lib/privacy";
import { usePrivacyStatus } from "@/hooks/usePrivacyStatus";
import { useI18n } from "@/providers/I18nProvider";

const LOCALES: { code: "pt-BR" | "en-US" | "es"; label: string }[] = [
  { code: "pt-BR", label: "PT" },
  { code: "en-US", label: "EN" },
  { code: "es", label: "ES" },
];

// Página pública (abre sem login) com os dois documentos. Logado, mostra quando o usuário aceitou.
export default function PrivacyPage() {
  const { locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const { data: status } = usePrivacyStatus();
  const t = (key: string, vars?: Record<string, string | number>) => ptx(locale, key, vars);
  const fmt = (d: string | Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, opts).format(new Date(d));
  const date = fmt(`${PRIVACY_EFFECTIVE}T12:00:00`, { day: "2-digit", month: "2-digit", year: "numeric" });

  useEffect(() => {
    // rola até o documento pedido no link (#politica ou #termo)
    const id = window.location.hash.replace("#", "");
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 200);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-5 flex items-center justify-between">
          <Button variant="ghost" className="gap-1.5 px-2" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
            <ArrowLeft className="h-4 w-4" />{t("page.back")}
          </Button>
          <div className="flex gap-1 rounded-md bg-background p-1">
            {LOCALES.map((l) => (
              <button key={l.code} type="button" onClick={() => setLocale(l.code)} className={`rounded px-2.5 py-1 text-xs font-semibold ${locale === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background px-6 py-7 sm:px-9">
          <h1 className="text-2xl font-extrabold tracking-tight">{t("page.title")}</h1>
          <p className="mb-5 mt-1 text-[13px] text-muted-foreground">{t("page.version", { version: PRIVACY_VERSIONS.policy, date })}</p>

          {status?.accepted && status.policy_accepted_at && (
            <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-[13.5px]">
              {t("page.acceptedAt", { date: fmt(status.policy_accepted_at, { dateStyle: "short", timeStyle: "short" }) })}
            </div>
          )}

          <section id="politica" className="scroll-mt-6">
            <h2 className="mb-4 rounded-md bg-muted px-3 py-2 text-sm font-bold">{t("page.tabPolicy")}</h2>
            <PolicyText />
          </section>
          <section id="termo" className="mt-10 scroll-mt-6">
            <h2 className="mb-4 rounded-md bg-muted px-3 py-2 text-sm font-bold">{t("page.tabTerms")}</h2>
            <TermsText />
          </section>
        </div>
      </div>
    </div>
  );
}
