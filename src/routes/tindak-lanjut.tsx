import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, MessageCircle, Phone, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { findLead, tindakLanjut, tingkatLewat } from "@/lib/data";

export const Route = createFileRoute("/tindak-lanjut")({
  head: () => ({
    meta: [
      { title: "Antrean Tindak Lanjut — Andara Sales OS" },
      { name: "description", content: "Siapa yang harus dihubungi sekarang, lengkap dengan draf pesan." },
      { property: "og:title", content: "Antrean Tindak Lanjut — Andara Sales OS" },
      { property: "og:description", content: "Siapa yang harus dihubungi sekarang, lengkap dengan draf pesan." },
    ],
  }),
  component: Queue,
});

function Queue() {
  const [done, setDone] = useState<string[]>([]);
  const list = tindakLanjut.filter((t) => !done.includes(t.leadId));
  return (
    <AppShell title="Tindak Lanjut" subtitle={`${list.length} orang perlu dihubungi`}>
      {list.length === 0 && (
        <div className="surface p-10 text-center">
          <p className="text-lg font-bold">Antrean bersih 🎉</p>
          <p className="mt-1 text-muted-foreground">Saatnya turun ke lapangan.</p>
          <Link to="/rute" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Lihat rute</Link>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((t) => {
          const l = findLead(t.leadId)!;
          const tone = tingkatLewat(t.lewat);
          return (
            <article key={t.leadId} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to="/lead/$id" params={{ id: l.id }}>
                  <p className="font-bold">{l.nama}</p>
                  <p className="text-[13px] text-muted-foreground">{l.proyek} · {l.tahap}</p>
                </Link>
                <span className={`rounded-full bg-${tone}/12 px-2.5 py-1 text-[13px] font-semibold text-${tone}`}>{t.lewat ? `+${t.lewat} hari` : "Hari ini"}</span>
              </div>
              <div className="mt-4 rounded-xl border border-ai/20 bg-ai/5 p-3.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ai"><Sparkles className="size-3.5" /> Draf AI — periksa dulu</p>
                <p className="text-[15px] leading-relaxed">{t.draf}</p>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <a href={`tel:${l.telp}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
                  {t.jenis === "WhatsApp" ? <MessageCircle className="size-4" /> : <Phone className="size-4" />} {t.jenis === "WhatsApp" ? "Kirim WhatsApp" : "Telepon"}
                </a>
                <button onClick={() => setDone([...done, t.leadId])} aria-label="Tandai selesai" className="grid size-11 place-items-center rounded-xl border border-border text-success hover:bg-success/10">
                  <Check className="size-5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
