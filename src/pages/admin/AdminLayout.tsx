import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";

interface AdminLayoutProps {
  onLogout?: () => void;
}

const adminLinksConfig = [
  { labelPt: "Visão geral", labelEn: "Overview", labelEs: "Vista general", to: "/admin" },
  { labelPt: "Resultados Genômicos", labelEn: "Genomic Results", labelEs: "Resultados Genómicos", to: "/admin/results" },
  { labelPt: "Tickets de suporte", labelEn: "Support Tickets", labelEs: "Tickets de soporte", to: "/admin/support-tickets" },
  { labelPt: "i18n Dashboard", labelEn: "i18n Dashboard", labelEs: "Panel i18n", to: "/admin/i18n" },
  { labelPt: "Glossário Técnico", labelEn: "Technical Glossary", labelEs: "Glosario Técnico", to: "/admin/glossary" },
  { labelPt: "Tradução em Lote", labelEn: "Batch Translation", labelEs: "Traducción por Lotes", to: "/admin/translation" },
  { labelPt: "Redefinir Senha", labelEn: "Reset Password", labelEs: "Restablecer Contraseña", to: "/admin/reset-password" }
];

const UserBadge = ({ user, isEn, isEs }: { user: User | null; isEn: boolean; isEs?: boolean }) => {
  if (!user) return null;

  const initials = user.email?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium leading-none">{user.email}!</span>
          <div className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-emerald-50 shadow-sm">
            Role: admin | Admin: {isEs ? "Sí" : isEn ? "Yes" : "Sim"}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{isEs ? "Área administrativa" : isEn ? "Admin area" : "Área administrativa"}</span>
      </div>
    </div>
  );
};

const DesktopSidebar = ({ user, onLogout, adminLinks, isEn, isEs }: { user: User | null; onLogout?: () => void; adminLinks: { label: string; to: string }[]; isEn: boolean; isEs?: boolean }) => (
  <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background/60">
    <div className="flex h-20 items-center justify-between px-6">
      <span className="text-lg font-semibold tracking-tight">ToolSS Admin</span>
    </div>
    <Separator />
    <nav className="flex-1 space-y-1 px-4 py-6">
      {adminLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/admin"}
          className={({ isActive }) =>
            cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
    <div className="space-y-4 px-4 pb-6">
      <UserBadge user={user} isEn={isEn} isEs={isEs} />
      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        {isEs ? "Salir" : isEn ? "Log out" : "Sair"}
      </Button>
    </div>
  </aside>
);

const MobileSidebar = ({ user, onLogout, adminLinks, isEn, isEs }: { user: User | null; onLogout?: () => void; adminLinks: { label: string; to: string }[]; isEn: boolean; isEs?: boolean }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" size="icon" className="lg:hidden">
        <Menu className="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="flex w-[280px] flex-col p-0">
      <div className="flex h-20 items-center px-6">
        <span className="text-lg font-semibold tracking-tight">ToolSS Admin</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-4 py-6">
        {adminLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-4 px-4 pb-6">
        <UserBadge user={user} isEn={isEn} isEs={isEs} />
        <Button variant="outline" className="w-full" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {isEs ? "Salir" : isEn ? "Log out" : "Sair"}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

export function AdminLayout({ onLogout }: AdminLayoutProps) {
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";
  const adminLinks = adminLinksConfig.map((link) => ({
    label: isEs ? link.labelEs : isEn ? link.labelEn : link.labelPt,
    to: link.to
  }));
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao encerrar sessão", error);
    } finally {
      onLogout?.();
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(user);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      return isEs ? "Vista general" : isEn ? "Overview" : "Visão geral";
    }

    const active = adminLinks.find((link) => location.pathname.startsWith(link.to));
    return active?.label ?? (isEs ? "Administración" : isEn ? "Administration" : "Administração");
  }, [location.pathname, isEn, adminLinks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="flex">
        <DesktopSidebar user={user} onLogout={handleLogout} adminLinks={adminLinks} isEn={isEn} isEs={isEs} />
        <div className="flex-1">
          <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <MobileSidebar user={user} onLogout={handleLogout} adminLinks={adminLinks} isEn={isEn} isEs={isEs} />
              <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">{pageTitle}</h1>
            </div>
            <UserBadge user={user} isEn={isEn} isEs={isEs} />
          </header>
          <main className="p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

