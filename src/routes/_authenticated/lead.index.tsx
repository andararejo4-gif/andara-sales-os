import { screenAccess } from "@/lib/roles";
import { redirect, createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell, ScoreBadge, StatusBadge } from "@/components/AppShell";
import { leads, proyek } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lead/")({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 2) === "none") throw redirect({ to: "/dashboard", replace: true }); },
  head: () => ({
    meta: [
      { title: "Lead & Pipeline — Andara Sales OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Calon pembeli Anda menurut status pipeline dan skor." },
      { property: "og:title", content: "Lead & Pipeline — Andara Sales OS" },
      { property: "og:description", content: "Calon pembeli Anda menurut status pipeline dan skor." },
    ],
  }),
  component: LeadList,
});

function LeadList() {
  const {account}=Route.useRouteContext();
  const canDetail=account.role&&screenAccess(account.role,3)!=='none';
  return (
    <AppShell title="Lead & Pipeline" subtitle={`${leads.length} calon pembeli · Klaten`}>
      <div className="mb-7 grid gap-3 sm:grid-cols-2">
        {proyek.map((p) => (
          <div key={p.nama} className="surface p-4">
            <p className="font-semibold">{p.nama}</p>
            <p className="text-[13px] text-muted-foreground">{p.lokasi} · {p.tipe}</p>
            <p className="mt-2 text-[13px]"><b className={p.sisa <= 3 ? "text-destructive" : "text-positive"}>Sisa {p.sisa} unit</b> · {p.harga}</p>
          </div>
        ))}
      </div>
      <div className="surface divide-y divide-border">
        {[...leads].sort((a, b) => b.skor - a.skor).map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-4 hover:bg-muted/50">
            <ScoreBadge skor={l.skor} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{canDetail?<Link to="/lead/$id" params={{id:l.id}}>{l.panggilan}</Link>:l.panggilan}</p>
              <p className="truncate text-[13px] text-muted-foreground">{l.proyek} · {l.sumber}</p>
            </div>
            <StatusBadge status={l.status} />
            <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground">Privasi: hanya nama panggilan pada tahap prospek; nomor selalu tersamar.</p>
    </AppShell>
  );
}
