import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { leads } from "@/lib/data";

export const Route = createFileRoute("/aktivitas/baru")({
  head: () => ({
    meta: [
      { title: "Catat Aktivitas — Andara Sales OS" },
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
          <button key={o} type="button" onClick={() => onChange(o)} className={`h-11 rounded-xl border px-4 font-medium transition-colors ${value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function Form() {
  const nav = useNavigate();
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
        <button
          disabled={!ok}
          onClick={() => { toast.success("Aktivitas tersimpan"); nav({ to: "/" }); }}
          className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-fab transition-opacity disabled:opacity-40 disabled:shadow-none"
        >
          5 · Simpan
        </button>
        <p className="mt-3 text-center text-[13px] text-muted-foreground">Status HOT wajib punya tanggal tur dekat.</p>
      </div>
    </AppShell>
  );
}
