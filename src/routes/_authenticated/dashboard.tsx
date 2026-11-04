import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Sparkles, Wallet } from "lucide-react";
import { AppShell, Section } from "@/components/AppShell";
import { tierInfo } from "@/lib/data";
import { useSuspenseQuery } from '@tanstack/react-query';
import { accountOptions } from '@/lib/account';
import { primaryWorkspace, roleLabels, type AppRole } from '@/lib/roles';
import { Workspace, workOptions } from '@/components/Workspace';
import { SignOut } from '@/components/SignOut';
import { RevisionDashboard } from '@/components/RevisionDashboard';
import { DailyReportExport } from '@/components/DailyReportExport';
import { matchesTicketMode, useTicketMode } from '@/lib/ticket-mode';
import { revisionOptions } from '@/lib/revision-query';
import { Button } from '@/components/ui/button';
import { jakartaDay } from '@/lib/revision';

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: async ({ context }) => { const role = context.account.role; if (!role) return null; await context.queryClient.ensureQueryData(revisionOptions); if (role !== 'se' && role !== 'sales_2') return context.queryClient.ensureQueryData(workOptions(primaryWorkspace[role])); return null; },
  head: () => ({ meta: [{ title: "Beranda — Andara Sales OS" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Skor harian, aktivitas, omzet, dan tugas AI untuk Sales Executive." }, { property: "og:title", content: "Beranda — Andara Sales OS" }, { property: "og:description", content: "Skor harian, aktivitas, omzet, dan tugas AI untuk Sales Executive." }] }),
  component: Dashboard,
});

function Ring({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r, pct = Math.min(value / 115, 1);
  return (
    <svg viewBox="0 0 120 120" className="size-36 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-ink-foreground/15" />
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="stroke-positive" />
    </svg>
  );
}

function Dashboard() {
  const { data: account } = useSuspenseQuery(accountOptions);
  if (!account.role) return <main className="mx-auto max-w-lg px-6 py-16"><h1 className="text-[28px] font-bold">Akses belum ditetapkan</h1><p className="mt-4 text-muted-foreground">Akun Anda sudah masuk. Hubungi penanggung jawab untuk penetapan jabatan, tim, dan proyek.</p><div className="mt-6"><SignOut/></div></main>;
  if (account.role !== 'se' && account.role !== 'sales_2') return <Workspace feature={primaryWorkspace[account.role]}/>;
  return <SeDashboard email={account.email} role={account.role}/>;
}

function SeDashboard({ email, role }: { email: string; role: AppRole }) {
  const { data: all } = useSuspenseQuery(revisionOptions);
  const mode = useTicketMode(), largeMode = mode === 'BESAR';
  const data = { ...all, leads: all.leads.filter((l) => matchesTicketMode(l.ticket_class, mode)) };
  const today = jakartaDay(new Date());
  const skor = data.kpis.filter((k) => k.logged_on === today).reduce((s, k) => s + Number(k.value), 0);
  const tierIndex = skor >= 115 ? 5 : skor >= 100 ? 4 : skor >= 85 ? 3 : skor >= 70 ? 2 : 1;
  const tier = tierInfo[tierIndex - 1] ?? tierInfo[0]!;
  const pct = Math.round(data.revenue.percent);
  const leadToday = data.leads.filter((l) => l.created_at.slice(0, 10) === today).length;
  const hot = data.leads.filter((l) => l.status === 'HOT').length;
  const cards = [
    { label: 'Lead', nilai: leadToday, kind: 'leads', activity: false, regularOnly: false },
    { label: 'Hot', nilai: hot, kind: 'leads', activity: false, regularOnly: false },
    { label: 'Call', nilai: data.activities.filter((a) => a.kind === 'Call').length, kind: 'activities', activity: true, regularOnly: true },
    { label: 'Chat', nilai: data.activities.filter((a) => a.kind === 'Chat').length, kind: 'activities', activity: true, regularOnly: true },
    { label: 'Posting', nilai: data.activities.filter((a) => a.kind === 'Posting').length, kind: 'activities', activity: true, regularOnly: false },
    { label: 'Door to Door', nilai: data.activities.filter((a) => a.kind === 'D2D' || a.kind === 'Day-to-day').length, kind: 'activities', activity: true, regularOnly: true },
  ].filter((c) => !(largeMode && c.regularOnly));
  const stale = data.leads.filter((l) => (Date.now() - new Date(l.created_at).getTime()) > 86400000 && ['LEAD', 'QL'].includes(l.status)).length;
  const tasks = [];
  if (stale) tasks.push({ teks: `${stale} lead belum dihubungi > 24 jam`, to: '/tindak-lanjut' });
  if (hot) tasks.push({ teks: `${hot} hot prospek siap diajak tur`, to: '/lead' });
  const routeToday = data.rute.filter((r) => r.tanggal === today);
  const routePintu = routeToday.reduce((s, r) => s + Number(r.pintu), 0);
  return (
    <AppShell title="Beranda Saya" subtitle={`${roleLabels[role]} · ${email}`}>
      <div className="md:grid md:grid-cols-[340px_1fr] md:gap-8">
        <Link to="/data/$kind" params={{ kind: 'activities' }} className="mb-7 block rounded-3xl bg-ink p-6 text-ink-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-ring">
          <div className="relative mx-auto grid size-36 place-items-center">
            <Ring value={skor} />
            <div className="absolute text-center">
              <p className="text-[28px] font-bold leading-none">{skor}</p>
              <p className="mt-1 text-[13px] opacity-70">Skor hari ini</p>
            </div>
          </div>
          <div className="mt-5 flex gap-1.5">{tierInfo.map((t) => <span key={t.tier} className={`h-2 flex-1 rounded-full ${t.tier <= tierIndex ? "bg-positive" : "bg-ink-foreground/15"}`} />)}</div>
          <p className="mt-2 text-center text-[13px] opacity-60">{tier.nama} · skor {tier.rentang}</p>
        </Link>
        <div>
          <Section title="Aktivitas hari ini">
            <div className="grid grid-cols-3 gap-2.5">
              {cards.map((c) => (
                <Button asChild variant="outline" key={c.label} className="h-auto flex-col items-start p-3.5"><Link to="/data/$kind" params={{ kind: c.kind }}>
                  <p className="text-[13px] text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-xl font-bold">{c.nilai}</p>
                </Link></Button>
              ))}
            </div>
          </Section>
          <Section title="Omzet bulan ini">
            <Link to="/data/$kind" params={{ kind: 'transactions' }} className="surface block p-5 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-ring">
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-bold">{data.revenue.label}</p>
                <span className="font-semibold text-positive">{pct}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-positive" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">Hanya closing valid (CV) yang dihitung ke target.</p>
            </Link>
          </Section>
        </div>
      </div>
      <RevisionDashboard part="agenda"/>
      <RevisionDashboard part="rest"/>
      {tasks.length > 0 && <Section title="Tugas AI Agent untukmu hari ini"><div className="space-y-2">{tasks.map((t, i) => <Link key={t.teks} to={t.to} className="flex items-center gap-3 rounded-xl border border-ai/25 bg-ai/5 p-4 transition-colors hover:bg-ai/10"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ai/15 text-[13px] font-bold text-ai">{i + 1}</span><p className="flex-1 font-medium">{t.teks}</p><Sparkles className="size-4 text-ai" /></Link>)}</div></Section>}
      <div className="grid grid-cols-3 gap-2.5">
        <Link to="/aktivitas/baru" className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground"><Plus className="size-4" /> Leads</Link>
        {largeMode ? <span aria-disabled className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-muted text-[15px] font-semibold text-muted-foreground"><Plus className="size-4" /> Aktivitas</span> : <Link to="/aktivitas/baru" className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-success text-[15px] font-semibold text-primary-foreground"><Plus className="size-4" /> Aktivitas</Link>}
        <Link to="/komisi" className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-warning text-[15px] font-semibold text-primary-foreground"><Wallet className="size-4" /> Komisi</Link>
      </div>
      <Link to="/rute" className="surface mt-7 flex items-center gap-4 p-5">
        <div className="flex-1"><p className="font-semibold">Rute canvassing hari ini</p><p className="text-[13px] text-muted-foreground">{routeToday.length} titik · {routePintu} pintu</p></div>
        <ArrowRight className="size-5 text-muted-foreground" />
      </Link>
      <DailyReportExport/>
    </AppShell>
  );
}