import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell, ScoreBadge } from "@/components/AppShell";
import { leads } from "@/lib/data";

export const Route = createFileRoute("/lead/")({
  head: () => ({
    meta: [
      { title: "Daftar Lead — Andara Sales OS" },
      { name: "description", content: "Semua calon pembeli Anda, diurutkan menurut skor." },
      { property: "og:title", content: "Daftar Lead — Andara Sales OS" },
      { property: "og:description", content: "Semua calon pembeli Anda, diurutkan menurut skor." },
    ],
  }),
  component: LeadList,
});

function LeadList() {
  return (
    <AppShell title="Lead" subtitle={`${leads.length} calon pembeli aktif`}>
      <div className="surface divide-y divide-border">
        {[...leads].sort((a, b) => b.skor - a.skor).map((l) => (
          <Link key={l.id} to="/lead/$id" params={{ id: l.id }} className="flex items-center gap-4 p-4 hover:bg-muted/50">
            <ScoreBadge skor={l.skor} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l.nama}</p>
              <p className="text-[13px] text-muted-foreground">{l.proyek} · {l.sumber}</p>
            </div>
            <span className="hidden rounded-full bg-secondary px-3 py-1 text-[13px] font-medium sm:inline">{l.tahap}</span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
