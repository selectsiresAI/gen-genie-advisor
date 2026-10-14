import { POLICY_SECTIONS, TERMS_SECTIONS, ptx, type DocSection } from "@/lib/privacy";
import { useI18n } from "@/providers/I18nProvider";

function Sections({ sections }: { sections: DocSection[] }) {
  const { locale } = useI18n();
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.title}>
          <h3 className="mb-2 text-base font-bold text-foreground">{ptx(locale, section.title)}</h3>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            {section.blocks.map((block, i) => {
              if (block.type === "p") return <p key={i}>{ptx(locale, block.key)}</p>;
              if (block.type === "ul") {
                return (
                  <ul key={i} className="list-disc space-y-1 pl-5">
                    {block.keys.map((key) => <li key={key}>{ptx(locale, key)}</li>)}
                  </ul>
                );
              }
              return (
                <div key={i} className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        {block.head.map((h) => (
                          <th key={h} className="border border-border bg-muted px-3 py-2 text-left text-xs font-semibold">{ptx(locale, h)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map(([a, b]) => (
                        <tr key={a}>
                          <td className="w-[34%] border border-border px-3 py-2 align-top font-medium">{ptx(locale, a)}</td>
                          <td className="border border-border px-3 py-2 align-top">{ptx(locale, b)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export const PolicyText = () => <Sections sections={POLICY_SECTIONS} />;
export const TermsText = () => <Sections sections={TERMS_SECTIONS} />;
