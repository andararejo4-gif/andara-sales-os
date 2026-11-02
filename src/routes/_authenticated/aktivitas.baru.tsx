import { screenAccess } from "@/lib/roles";
import { redirect, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { leads } from "@/lib/data";
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/_authenticated/aktivitas/baru")({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 7) === "none") throw redirect({ to: "/dashboard", replace: true }); },
  head: () => ({
    meta: [
      { title: "Catat Aktivitas — Andara Sales OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "description", content: "Catat D2D, call, chat, posting, tur, atau open table dalam lima ketukan." },
      { property: "og:title", content: "Catat Aktivitas — Andara Sales OS" },
      { property: "og:description", content: "Catat D2D, call, chat, posting, tur, atau open table dalam lima ketukan." },
    ],
  }),
  component: Form,
});

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-[13px] font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button key={o} type="button" variant={value===o?'default':'outline'} onClick={() => onChange(o)} className="h-11 rounded-xl px-4">{o}</Button>
        ))}
      </div>
    </div>
  );
}

function Form() {
  const nav = useNavigate();
  const {account}=Route.useRouteContext();
  const writable=account.role&&screenAccess(account.role,7)==='full';
  const [jenis, setJenis] = useState("");
  const [lead, setLead] = useState("");
  const [hasil, setHasil] = useState("");
  const [lanjut, setLanjut] = useState("");
  const ok = jenis && lead && hasil && lanjut;
  return (
    <AppShell title="Catat Aktivitas" subtitle="Lima ketukan · lokasi & waktu tercatat otomatis" hideFab>
      <div className="mx-auto max-w-xl">
        <Chips label="1 · Jenis aktivitas" options={["D2D", "Call", "Chat", "Posting", "Tur", "Open table"]} value={jenis} onChange={setJenis} />
        <Chips label="2 · Dengan siapa" options={[...leads.slice(0, 4).map((l) => l.panggilan), "Orang baru"]} value={lead} onChange={setLead} />
        <Chips label="3 · Hasil (status)" options={["NA · Tidak ditemui", "NO · Menolak", "ENG · Bermakna", "LEAD · Izin lanjut", "HOT · Setuju tur"]} value={hasil} onChange={setHasil} />
        <Chips label="4 · Tindak lanjut" options={["Besok", "3 hari", "1 minggu", "Nurture", "Tidak perlu"]} value={lanjut} onChange={setLanjut} />
        <Button
          disabled={!ok||!writable}
          onClick={() => { toast.info("Pratinjau aktivitas selesai; penyimpanan aktivitas nyata belum terhubung."); nav({ to: "/dashboard" }); }}
          className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-fab transition-opacity disabled:opacity-40 disabled:shadow-none"
        >
          5 · Simpan
        </Button>
        {!writable&&<p className="mt-3 text-[13px] text-muted-foreground">Hanya lihat · pencatatan aktivitas oleh Sales Executive atau Team Leader.</p>}
        <p className="mt-3 text-center text-[13px] text-muted-foreground">Status HOT wajib punya tanggal tur dekat.</p>
      </div>
    </AppShell>
  );
}
