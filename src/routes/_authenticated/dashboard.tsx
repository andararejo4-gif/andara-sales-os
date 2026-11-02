import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Sparkles, Wallet } from "lucide-react";
import { AppShell, Section } from "@/components/AppShell";
import { kartuAktivitas, omzet, skorHarian, tierInfo, tugasAI } from "@/lib/data";
import { useSuspenseQuery } from '@tanstack/react-query';
import { accountOptions } from '@/lib/account';
import { primaryWorkspace,roleLabels } from '@/lib/roles';
import { Workspace,workOptions } from '@/components/Workspace';
import { SignOut } from '@/components/SignOut';
import { RevisionDashboard } from '@/components/RevisionDashboard';
import { revisionOptions } from '@/lib/revision-query';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader:async({context})=>{const role=context.account.role;if(!role)return null;await context.queryClient.ensureQueryData(revisionOptions);if(role!=='se')return context.queryClient.ensureQueryData(workOptions(primaryWorkspace[role]));return null;},
  head: () => ({
    meta: [
      { title: "Beranda — Andara Sales OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Skor harian, aktivitas, omzet, dan tugas AI untuk Sales Executive." },
      { property: "og:title", content: "Beranda — Andara Sales OS" },
      { property: "og:description", content: "Skor harian, aktivitas, omzet, dan tugas AI untuk Sales Executive." },
    ],
  }),
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

function tone(n: number, t: number) {
  const p = n / t;
  return p >= 1 ? "text-positive" : p >= 0.7 ? "text-info" : "text-alert";
}

function Dashboard() {
  const {data:account}=useSuspenseQuery(accountOptions);
  if(!account.role)return <main className="mx-auto max-w-lg px-6 py-16"><h1 className="text-[28px] font-bold">Akses belum ditetapkan</h1><p className="mt-4 text-muted-foreground">Akun Anda sudah masuk. Hubungi penanggung jawab untuk penetapan jabatan, tim, dan proyek.</p><div className="mt-6"><SignOut/></div></main>;
  if(account.role!=='se')return <Workspace feature={primaryWorkspace[account.role]}/>;
  const tier = tierInfo[skorHarian.tier - 1] ?? tierInfo[0];
  if(!tier)return null;
  const pct = Math.round((omzet.capai / omzet.target) * 100);
  return (
    <AppShell title="Beranda Saya" subtitle={`${roleLabels[account.role]} · ${account.email}`}>
      <p className="mb-5 text-[13px] text-warning">Data contoh · belum terhubung ke aktivitas dan transaksi nyata.</p>
      <RevisionDashboard/>
      <div className="md:grid md:grid-cols-[340px_1fr] md:gap-8">
        <div className="mb-7 rounded-3xl bg-ink p-6 text-ink-foreground">
          <div className="relative mx-auto grid size-36 place-items-center">
            <Ring value={skorHarian.skor} />
            <div className="absolute text-center">
              <p className="text-[28px] font-bold leading-none">{skorHarian.skor}</p>
              <p className="mt-1 text-[13px] opacity-60">Skor harian</p>
            </div>
          </div>
          <p className="mt-4 text-center font-semibold">Peringkat {skorHarian.peringkat} dari {skorHarian.dari} · Tier {tier.tier} ({tier.nama})</p>
          <div className="mt-5 flex gap-1">
            {tierInfo.map((t) => <div key={t.tier} className={`h-1.5 flex-1 rounded-full ${t.tier <= tier.tier ? "bg-positive" : "bg-ink-foreground/15"}`} />)}
          </div>
          <p className="mt-2 text-center text-[13px] opacity-60">Tier 5 Elite mulai skor ≥ 115</p>
        </div>

        <div>
          <Section title="Aktivitas hari ini">
            <div className="grid grid-cols-3 gap-2.5">
              {kartuAktivitas.map((k) => (
                <Button asChild variant="outline" key={k.label} className="h-auto flex-col items-start p-3.5"><Link to="/data/$kind" params={{kind:k.label==='Lead'||k.label==='Hot'?'leads':'activities'}}>
                  <p className="text-[13px] text-muted-foreground">{k.label}</p>
                  <p className={`mt-1 text-xl font-bold ${tone(k.nilai, k.target)}`}>{k.nilai}<span className="text-[13px] font-medium text-muted-foreground">/{k.target}</span></p>
                </Link></Button>
              ))}
            </div>
          </Section>

          <Section title="Omzet bulan ini">
            <div className="surface p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-bold">Rp {omzet.capai} jt <span className="text-[15px] font-medium text-muted-foreground">/ Rp 1,0 M</span></p>
                <span className="font-semibold text-positive">{pct}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-positive" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-[13px] font-medium text-destructive">Pace: {omzet.pace}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Hanya closing valid (CV) yang dihitung ke target.</p>
            </div>
          </Section>
        </div>
      </div>

      <Section title="Tugas AI Agent untukmu hari ini">
        <div className="space-y-2">
          {tugasAI.map((t, i) => (
            <Link key={t.teks} to={t.to==='/'?'/dashboard':t.to} className="flex items-center gap-3 rounded-xl border border-ai/25 bg-ai/5 p-4 transition-colors hover:bg-ai/10">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ai/15 text-[13px] font-bold text-ai">{i + 1}</span>
              <p className="flex-1 font-medium">{t.teks}</p>
              <Sparkles className="size-4 text-ai" />
            </Link>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-3 gap-2.5">
        <Link to="/lead" className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground"><Plus className="size-4" /> Lead</Link>
        <Link to="/aktivitas/baru" className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-success text-[15px] font-semibold text-primary-foreground"><Plus className="size-4" /> Aktivitas</Link>
        <Link to="/komisi" className="flex h-14 items-center justify-center gap-1.5 rounded-xl bg-warning text-[15px] font-semibold text-primary-foreground"><Wallet className="size-4" /> Komisi</Link>
      </div>

      <Link to="/rute" className="surface mt-7 flex items-center gap-4 p-5">
        <div className="flex-1"><p className="font-semibold">Rute canvassing hari ini</p><p className="text-[13px] text-muted-foreground">4 titik · 53 pintu · mulai 08.30</p></div>
        <ArrowRight className="size-5 text-muted-foreground" />
      </Link>
    </AppShell>
  );
}
