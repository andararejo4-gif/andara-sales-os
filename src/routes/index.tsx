import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, MessageCircle, Phone, TrendingUp } from "lucide-react";
import { AppShell, ScoreBadge, Section } from "@/components/AppShell";
import { findLead, leads, tindakLanjut, tingkatLewat } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beranda — Andara Sales OS" },
      { name: "description", content: "Prioritas hari ini, tindak lanjut, dan target penjualan Anda." },
      { property: "og:title", content: "Beranda — Andara Sales OS" },
      { property: "og:description", content: "Prioritas hari ini, tindak lanjut, dan target penjualan Anda." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const prioritas = [...leads].filter((l) => l.tahap !== "Booking").sort((a, b) => b.skor - a.skor).slice(0, 3);
  return (
    <AppShell title="Selamat pagi, Wahyu" subtitle="Senin, 2 November 2026">
      <div className="mb-7 overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground md:p-8">
        <p className="text-[13px] opacity-70">Target November</p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-[28px] font-bold leading-none">3 <span className="text-base font-medium opacity-60">/ 5 unit</span></p>
          <span className="flex items-center gap-1 text-[13px] text-positive"><TrendingUp className="size-4" /> +1 minggu ini</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-foreground/15">
          <div className="h-full w-3/5 rounded-full bg-ink-foreground" />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink-foreground/10 pt-5 text-center">
          {[["7", "Kontak kemarin"], ["2", "Kunjungan"], ["4", "Jatuh tempo"]].map(([n, l]) => (
            <div key={l}><p className="text-xl font-bold">{n}</p><p className="text-[13px] opacity-60">{l}</p></div>
          ))}
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-8">
        <Section title="Prioritas hari ini" action={<Link to="/lead" className="text-[13px] font-semibold text-primary">Semua</Link>}>
          <div className="surface divide-y divide-border">
            {prioritas.map((l) => (
              <Link key={l.id} to="/lead/$id" params={{ id: l.id }} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
                <ScoreBadge skor={l.skor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.nama}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{l.langkah}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Tindak lanjut jatuh tempo" action={<Link to="/tindak-lanjut" className="text-[13px] font-semibold text-primary">Buka antrean</Link>}>
          <div className="space-y-2.5">
            {tindakLanjut.slice(0, 3).map((t) => {
              const l = findLead(t.leadId)!;
              const tone = tingkatLewat(t.lewat);
              const Icon = t.jenis === "WhatsApp" ? MessageCircle : Phone;
              return (
                <div key={t.leadId} className="surface flex items-center gap-3 p-4">
                  <div className={`grid size-10 place-items-center rounded-xl bg-${tone}/12 text-${tone}`}><Icon className="size-5" /></div>
                  <div className="flex-1">
                    <p className="font-semibold">{l.nama}</p>
                    <p className={`text-[13px] text-${tone}`}>{t.lewat ? `Lewat ${t.lewat} hari` : "Hari ini"} · {t.jenis}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <Link to="/rute" className="surface flex items-center gap-4 p-5">
        <div className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><CalendarCheck className="size-6" /></div>
        <div className="flex-1"><p className="font-semibold">Rute canvassing hari ini</p><p className="text-[13px] text-muted-foreground">4 titik · 53 pintu · mulai 08.30</p></div>
        <ArrowRight className="size-5 text-muted-foreground" />
      </Link>
    </AppShell>
  );
}
