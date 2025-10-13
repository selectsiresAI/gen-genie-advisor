import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function PGBreadcrumb() {
  const items = [
    { href: "/plano-genetico", label: "Plano Genético" },
    { href: "/plano-genetico/projecao", label: "Projeção Genética" },
    { href: "/plano-genetico/projecao/mvp", label: "Projeção Genética MVP" },
    { href: "/plano-genetico/projecao/mvp/resultados", label: "Resultados & Gráficos" },
    { href: "/plano-genetico/projecao/mvp/resultados#roi-formula", label: "Fórmula do ROI" },
  ];
  return (
    <nav className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
      {items.map((it, i) => (
        <span key={it.href} className="inline-flex items-center gap-2">
          <Link href={it.href} className="hover:underline">{it.label}</Link>
          {i < items.length - 1 && <Separator orientation="vertical" className="h-4" />}
        </span>
      ))}
    </nav>
  );
}
