import { screenAccess } from "@/lib/roles";
import { redirect, createFileRoute } from "@tanstack/react-router";
import { Navigation } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { rute } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/rute")({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 26) === "none") throw redirect({ to: "/dashboard", replace: true }); },
  head: () => ({
    meta: [
      { title: "Rute Harian — Andara Sales OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Urutan titik canvassing yang akan dikunjungi hari ini." },
      { property: "og:title", content: "Rute Harian — Andara Sales OS" },
      { property: "og:description", content: "Urutan titik canvassing yang akan dikunjungi hari ini." },
    ],
  }),
  component: Rute,
});

function Rute() {
  const total = rute.reduce((s, r) => s + r.pintu, 0);
  return (
    <AppShell title="Rute Harian" subtitle={`${rute.length} titik · ${total} pintu`}>
      <ol className="space-y-3">
        {rute.map((r, i) => {
          const on = r.status === "berjalan";
          return (
            <li key={r.jam} className={`surface flex items-center gap-4 p-4 ${on ? "ring-2 ring-primary" : ""} ${r.status === "selesai" ? "opacity-55" : ""}`}>
              <div className={`grid size-11 shrink-0 place-items-center rounded-xl font-bold ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{i + 1}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.nama}</p>
                <p className="text-[13px] text-muted-foreground">{r.jam} · {r.alamat} · {r.pintu} pintu · {r.jarak}</p>
              </div>
              {on && <a href="#" aria-label="Navigasi" className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Navigation className="size-5" /></a>}
              {r.status === "selesai" && <span className="text-[13px] font-semibold text-success">Selesai</span>}
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
