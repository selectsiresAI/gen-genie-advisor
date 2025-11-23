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

interface AdminLayoutProps {
  onLogout?: () => void;
}

const adminLinks = [
  { label: "Visão geral", to: "/admin" },
  { label: "Tickets de suporte", to: "/admin/support-tickets" },
  { label: "i18n Dashboard", to: "/admin/i18n" },
  { label: "Glossário Técnico", to: "/admin/glossary" },
  { label: "Tradução em Lote", to: "/admin/translation" }
];

const UserBadge = ({ user }: { user: User | null }) => {
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
            Role: admin | Admin: Sim
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Área administrativa</span>
      </div>
    </div>
  );
};

const DesktopSidebar = ({ user, onLogout }: { user: User | null; onLogout?: () => void }) => (
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
      <UserBadge user={user} />
      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  </aside>
);

const MobileSidebar = ({ user, onLogout }: { user: User | null; onLogout?: () => void }) => (
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
        <UserBadge user={user} />
        <Button variant="outline" className="w-full" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

export function AdminLayout({ onLogout }: AdminLayoutProps) {
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
      return "Visão geral";
    }

    const active = adminLinks.find((link) => location.pathname.startsWith(link.to));
    return active?.label ?? "Administração";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="flex">
        <DesktopSidebar user={user} onLogout={handleLogout} />
        <div className="flex-1">
          <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <MobileSidebar user={user} onLogout={handleLogout} />
              <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">{pageTitle}</h1>
            </div>
            <UserBadge user={user} />
          </header>
          <main className="p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

