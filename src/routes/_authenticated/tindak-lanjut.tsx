import { screenAccess } from "@/lib/roles";
import { redirect, createFileRoute, Link } from "@tanstack/react-router";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSuspenseQuery } from '@tanstack/react-query';
import { AppShell } from "@/components/AppShell";
import { samarkan, tingkatLewat } from "@/lib/data";
import { revisionOptions } from '@/lib/revision-query';
import { leadAttribution } from '@/lib/revision';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/_authenticated/tindak-lanjut")({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 9) === "none") throw redirect({ to: "/dashboard", replace: true }); },
  loader: ({ context }) => context.queryClient.ensureQueryData(revisionOptions),
  head: () => ({ meta: [{ title: "Antrean Tindak Lanjut — Andara Sales OS" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Siapa yang harus dihubungi sekarang, dari database lead." }, { property: "og:title", content: "Antrean Tindak Lanjut — Andara Sales OS" }, { property: "og:description", content: "Siapa yang harus dihubungi sekarang." }] }),
  component: Queue,
});

function Queue() {
  const { account } = Route.useRouteContext();
  const { data } = useSuspenseQuery(revisionOptions);
  const writable = account.role && screenAccess(account.role, 9) === 'full';
  const [done, setDone] = useState<string[]>([]);
  const staff = (id: string | null) => data.staff.find((s) => s.user_id === id);
  const list = data.leads.filter((l) => ['LEAD', 'QL', 'HOT', 'VISIT', 'BOOK'].includes(l.status) && !done.includes(l.id)).map((l) => {
    const se = staff(l.owner_id);
    const tl = staff(se?.tl_id ?? null);
    const nama = account.role === 'tl' || account.role === 'tl_2' || account.role === 'sm' || account.role === 'dir' ? leadAttribution(l.nickname, se, tl, account.role) : l.nickname;
    return { id: l.id, nama, status: l.status, telp: l.phone, proyek: data.projects.find((p) => p.id === l.project_id)?.name || 'Belum ditentukan', lewat: Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000) };
  });
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
        {list.map((l) => {
          const tone = tingkatLewat(l.lewat);
          return (
            <article key={l.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <Link to="/lead/$id" params={{ id: l.id }}>
                  <p className="font-bold">{l.nama}</p>
                  <p className="text-[13px] text-muted-foreground">{l.proyek} · {l.status} · {samarkan(l.telp)}</p>
                </Link>
                <span className={`rounded-full bg-${tone}/12 px-2.5 py-1 text-[13px] font-semibold text-${tone}`}>{l.lewat ? `+${l.lewat} hari` : "Hari ini"}</span>
              </div>
              <div className="mt-4 rounded-xl border border-ai/20 bg-ai/5 p-3.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ai"><Sparkles className="size-3.5" /> Draf AI — periksa dulu</p>
                <p className="text-[15px] leading-relaxed">Tindak lanjut untuk {l.nama} ({l.status}).</p>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <a href="#" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"><MessageCircle className="size-4" /> Hubungi</a>
                <Button variant="outline" disabled={!writable} onClick={() => setDone([...done, l.id])} aria-label="Tandai selesai" className="grid size-11 place-items-center rounded-xl border border-border text-success hover:bg-success/10"><Check className="size-5" /></Button>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}