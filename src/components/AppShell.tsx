import { Link, useLocation } from "@tanstack/react-router";
import { Home, ListChecks, Map, Plus, Users, Wallet, Wifi, CalendarDays, ShieldCheck } from "lucide-react";
import type { Status } from "@/lib/data";
import type { ReactNode } from "react";
import { useSuspenseQuery } from '@tanstack/react-query';
import { accountOptions } from '@/lib/account';
import { roleLabels, screenAccess, workspaces, workspaceAllowed } from '@/lib/roles';
import { SignOut } from '@/components/SignOut';
import { Button } from '@/components/ui/button';
import { BriefcaseBusiness } from 'lucide-react';
import {canWriteLeads} from '@/lib/lead-rules';

const nav = [
  { to: "/dashboard", label: "Beranda", icon: Home, screen:1 },
  { to: "/tindak-lanjut", label: "Antrean", icon: ListChecks, screen:9 },
  { to: "/lead", label: "Lead", icon: Users, screen:2 },
  { to: "/rute", label: "Rute", icon: Map, screen:26 },
  { to: "/komisi", label: "Komisi", icon: Wallet, screen:14 },
] as const;

export function AppShell({ title, subtitle, children, hideFab }: { title: string; subtitle?: string | undefined; children: ReactNode; hideFab?: boolean }) {
  const { pathname } = useLocation();
  const {data:account}=useSuspenseQuery(accountOptions);
  const role=account.role;
  const visibleNav=nav.filter(n=>role&&screenAccess(role,n.screen)!=='none');
  const canActivity=canWriteLeads(role);
  const active = (to: string) => pathname.startsWith(to);

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
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors ${active(to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}>
              <Icon className="size-5" /> {label}
            </Link>
          ))}
          {Object.entries(workspaces).filter(([key])=>role&&workspaceAllowed(role,key as keyof typeof workspaces)).map(([key,w])=><Link key={key} to="/ruang/$feature" params={{feature:key}} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium ${pathname===`/ruang/${key}`?'bg-sidebar-accent text-sidebar-accent-foreground':'hover:bg-sidebar-accent/60'}`}><BriefcaseBusiness className="size-5 shrink-0"/>{w.title}</Link>)}
          <Button asChild variant="ghost" className="h-11 justify-start"><Link to="/calendar" search={{filter:'all'}}><CalendarDays/>Kalender</Link></Button>
          {role==='it'&&<Button asChild variant="ghost" className="h-11 justify-start"><Link to="/data/$kind" params={{kind:'audit'}}><ShieldCheck/>Log Audit</Link></Button>}
        </nav>
        {canActivity&&<Link to="/aktivitas/baru" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
          <Plus className="size-5" /> Leads Baru
        </Link>}
        <div className="mt-5 flex items-center gap-3 border-t border-sidebar-border pt-5">
          <div className="min-w-0 text-[13px]"><p className="truncate font-semibold text-sidebar-accent-foreground">{account.email}</p><p>{role?roleLabels[role]:'Akses belum ditetapkan'}</p></div>
        </div>
      </aside>

      <main className="flex-1 pb-28 md:pb-10">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 md:px-10 md:py-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
            </div>
            <SignOut/>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-5 py-5 md:px-10 md:py-8"><div className="mb-5 flex gap-2 overflow-x-auto md:hidden">{Object.entries(workspaces).filter(([key])=>role&&workspaceAllowed(role,key as keyof typeof workspaces)).map(([key,w])=><Button variant="outline" className="h-11 shrink-0" asChild key={key}><Link to="/ruang/$feature" params={{feature:key}}>{w.title}</Link></Button>)}</div>{children}</div>
      </main>

      {!hideFab && canActivity && (
        <Link to="/aktivitas/baru" aria-label="Leads Baru" className="fixed bottom-24 right-5 z-30 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-fab md:hidden">
          <Plus className="size-6" />
        </Link>
      )}

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
        <div className="flex">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[13px] font-medium ${active(to) ? "text-primary" : "text-muted-foreground"}`}>
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

const statusTone: Record<Status, string> = {
  NA: "bg-muted text-muted-foreground", NO: "bg-destructive/12 text-destructive", ENG: "bg-muted text-foreground",
  LEAD: "bg-info/12 text-info", QL: "bg-info/12 text-info", HOT: "bg-alert/12 text-alert", VISIT: "bg-warning/12 text-warning",
  BOOK: "bg-primary/10 text-primary", CV: "bg-positive/12 text-positive", NURTURE: "bg-muted text-muted-foreground", LOST: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex h-7 items-center rounded-lg px-2.5 text-[13px] font-bold ${statusTone[status]}`}>{status}</span>;
}
