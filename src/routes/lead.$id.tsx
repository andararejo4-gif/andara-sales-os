import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { AppShell, Section } from "@/components/AppShell";
import { findLead, riwayat } from "@/lib/data";

export const Route = createFileRoute("/lead/$id")({
  loader: ({ params }) => {
    const lead = findLead(params.id);
    if (!lead) throw notFound();
    return { lead };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.lead.nama} — Andara Sales OS` : "Lead tidak ditemukan" },
      { name: "description", content: "Riwayat, skor, dan langkah berikutnya untuk lead ini." },
      { property: "og:title", content: "Rincian Lead — Andara Sales OS" },
      { property: "og:description", content: "Riwayat, skor, dan langkah berikutnya untuk lead ini." },
    ],
  }),
  notFoundComponent: () => <div className="p-10 text-center">Lead tidak ditemukan. <Link to="/lead" className="text-primary">Kembali</Link></div>,
  component: LeadDetail,
});

const tahapan = ["Baru", "Kontak", "Kunjungan", "Negosiasi", "Booking"];

function LeadDetail() {
  const { lead } = Route.useLoaderData();
  const idx = tahapan.indexOf(lead.tahap);
  return (
    <AppShell title={lead.nama} subtitle={`${lead.id} · ${lead.proyek}`}>
      <div className="md:grid md:grid-cols-[1fr_320px] md:gap-8">
        <div>
          <div className="surface mb-7 p-5">
            <div className="flex gap-1.5">
              {tahapan.map((t, i) => <div key={t} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} />)}
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">Tahap: <b className="text-foreground">{lead.tahap}</b></p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a href={`tel:${lead.telp}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"><Phone className="size-4" /> Telepon</a>
              <a href="#" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-semibold"><MessageCircle className="size-4" /> WhatsApp</a>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground"><MapPin className="size-4" /> {lead.alamat}</p>
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
            <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-ai"><Sparkles className="size-3.5" /> Dinilai AI</p>
            <ul className="mt-2 space-y-2">
              {lead.alasan.map((a) => <li key={a} className="flex gap-2"><span className="text-positive">✓</span>{a}</li>)}
            </ul>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
