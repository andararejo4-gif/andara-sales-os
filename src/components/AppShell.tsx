import { Link, useLocation } from "@tanstack/react-router";
import { Home, ListChecks, Map, Plus, Users, Wifi } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/tindak-lanjut", label: "Tindak Lanjut", icon: ListChecks },
  { to: "/lead", label: "Lead", icon: Users },
  { to: "/rute", label: "Rute", icon: Map },
] as const;

export function AppShell({ title, subtitle, children, hideFab }: { title: string; subtitle?: string; children: ReactNode; hideFab?: boolean }) {
  const { pathname } = useLocation();
  const active = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">A</div>
          <div>
            <p className="font-bold text-sidebar-accent-foreground">Andara</p>
            <p className="text-[13px]">Sales OS</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors ${active(to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}>
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
        <Link to="/aktivitas/baru" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
          <Plus className="size-5" /> Catat Aktivitas
        </Link>
        <div className="mt-5 flex items-center gap-3 border-t border-sidebar-border pt-5">
          <div className="grid size-9 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">WA</div>
          <div className="text-[13px]"><p className="font-semibold text-sidebar-accent-foreground">Wahyu Aji</p><p>Sales Executive</p></div>
        </div>
      </aside>

      <main className="flex-1 pb-28 md:pb-10">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 md:px-10 md:py-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[13px] font-medium text-success">
              <Wifi className="size-3.5" /> Tersinkron
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-5 py-5 md:px-10 md:py-8">{children}</div>
      </main>

      {!hideFab && (
        <Link to="/aktivitas/baru" aria-label="Catat aktivitas" className="fixed bottom-24 right-5 z-30 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-fab md:hidden">
          <Plus className="size-6" />
        </Link>
      )}

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex h-16 flex-col items-center justify-center gap-1 text-[13px] font-medium ${active(to) ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="size-5" strokeWidth={active(to) ? 2.4 : 1.8} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ScoreBadge({ skor }: { skor: number }) {
  const tone = skor >= 80 ? "bg-positive/12 text-positive" : skor >= 60 ? "bg-info/12 text-info" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex h-7 min-w-10 items-center justify-center rounded-lg px-2 text-[13px] font-bold ${tone}`}>{skor}</span>;
}
