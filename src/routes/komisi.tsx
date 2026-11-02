import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { AppShell, Section } from "@/components/AppShell";
import { milestoneKomisi } from "@/lib/data";

export const Route = createFileRoute("/komisi")({
  head: () => ({
    meta: [
      { title: "Komisi Saya — Andara Sales OS" },
      { name: "description", content: "Komisi berjalan dan empat milestone pencairan." },
      { property: "og:title", content: "Komisi Saya — Andara Sales OS" },
      { property: "og:description", content: "Komisi berjalan dan empat milestone pencairan." },
    ],
  }),
  component: Komisi,
});

const total = 3_400_000;
const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

function Komisi() {
  const cair = milestoneKomisi.filter((m) => m.status === "cair").reduce((s, m) => s + m.porsi, 0);
  return (
    <AppShell title="Komisi Saya" subtitle="Pak Joko · Puri Alam Gayamprit · L-1024">
      <div className="mb-7 grid grid-cols-2 gap-3">
        <div className="surface p-5"><p className="text-[13px] text-muted-foreground">Total komisi transaksi</p><p className="mt-1 text-[28px] font-bold leading-none">{rp(total)}</p></div>
        <div className="surface p-5"><p className="text-[13px] text-muted-foreground">Sudah cair</p><p className="mt-1 text-[28px] font-bold leading-none text-positive">{rp((total * cair) / 100)}</p></div>
      </div>
      <Section title="Empat milestone pencairan">
        <ol className="surface divide-y divide-border">
          {milestoneKomisi.map((m) => {
            const Icon = m.status === "cair" ? CheckCircle2 : m.status === "proses" ? Clock : Lock;
            const c = m.status === "cair" ? "text-positive" : m.status === "proses" ? "text-warning" : "text-muted-foreground";
            return (
              <li key={m.nama} className="flex items-center gap-4 p-4">
                <Icon className={`size-6 shrink-0 ${c}`} />
                <div className="flex-1">
                  <p className="font-semibold">{m.nama} <span className="font-medium text-muted-foreground">· {m.porsi}%</span></p>
                  <p className="text-[13px] text-muted-foreground">Cair {m.sla} setelah berkas lengkap</p>
                </div>
                <p className="font-semibold">{rp((total * m.porsi) / 100)}</p>
              </li>
            );
          })}
        </ol>
      </Section>
      <p className="text-[13px] text-muted-foreground">Porsi dihitung dari total komisi, bukan dari harga rumah. SLA berjalan setelah dokumen lengkap dan peristiwa benar-benar terjadi. Ada hak banding bila hitungan dirasa keliru.</p>
    </AppShell>
  );
}
