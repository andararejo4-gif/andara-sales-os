import { screenAccess } from "@/lib/roles";
import { redirect, createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { AppShell, Section, StatusBadge } from "@/components/AppShell";
import { findLead, jalurPipeline, riwayat, samarkan, statusInfo } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lead/$id")({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 3) === "none") throw redirect({ to: "/dashboard", replace: true }); },
  loader: ({ params }) => {
    const lead = findLead(params.id);
    if (!lead) throw notFound();
    return { lead };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.lead.panggilan} — Andara Sales OS` : "Lead tidak ditemukan" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Status pipeline, skor, riwayat, dan langkah berikutnya." },
      { property: "og:title", content: "Rincian Lead — Andara Sales OS" },
      { property: "og:description", content: "Status pipeline, skor, riwayat, dan langkah berikutnya." },
    ],
  }),
  notFoundComponent: () => <div className="p-10 text-center">Lead tidak ditemukan. <Link to="/lead" className="text-primary">Kembali</Link></div>,
  component: LeadDetail,
});

function LeadDetail() {
  const { lead } = Route.useLoaderData();
  const idx = jalurPipeline.indexOf(lead.status);
  return (
    <AppShell title={lead.panggilan} subtitle={`${lead.id} · ${lead.proyek}`}>
      <div className="md:grid md:grid-cols-[1fr_320px] md:gap-8">
        <div>
          <div className="surface mb-7 p-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={lead.status} />
              <span className="text-[13px] text-muted-foreground">Dihitung: {statusInfo[lead.status].dihitung}</span>
            </div>
            <div className="mt-4 grid grid-cols-6 gap-1">
              {jalurPipeline.map((s, i) => (
                <div key={s}>
                  <div className={`h-1.5 rounded-full ${idx >= 0 && i <= idx ? "bg-primary" : "bg-muted"}`} />
                  <p className={`mt-1.5 text-center text-[13px] ${s === lead.status ? "font-bold text-primary" : "text-muted-foreground"}`}>{s}</p>
                </div>
              ))}
            </div>
            {lead.sla && <p className="mt-3 rounded-lg bg-alert/10 px-3 py-2 text-[13px] font-medium text-alert">SLA: {lead.sla}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a href="#" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"><Phone className="size-4" /> Call</a>
              <a href="#" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-semibold"><MessageCircle className="size-4" /> Chat</a>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Phone className="size-3.5" /> {samarkan(lead.telp)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {lead.area}</span>
              <span>Sumber: {lead.sumber}</span>
            </div>
          </div>

          <Section title="Langkah berikutnya">
            <div className="surface border-l-4 border-l-primary p-4 font-medium">{lead.langkah}</div>
          </Section>

          <Section title="Riwayat">
            <ol className="relative ml-2 border-l border-border">
              {riwayat.map((r) => (
                <li key={r.waktu} className="mb-5 ml-5">
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-[13px] text-muted-foreground">{r.waktu} · {r.jenis}</p>
                  <p>{r.catatan}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <Section title="Skor & alasannya">
          <div className="surface p-5">
            <p className="text-[28px] font-bold leading-none">{lead.skor}<span className="text-base text-muted-foreground">/100</span></p>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-ai"><Sparkles className="size-3.5" /> Dinilai AI — periksa dulu</p>
            <ul className="mt-2 space-y-2">
              {lead.alasan.map((a) => <li key={a} className="flex gap-2"><span className="text-positive">✓</span>{a}</li>)}
            </ul>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
