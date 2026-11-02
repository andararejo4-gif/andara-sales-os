import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { leads } from "@/lib/data";

export const Route = createFileRoute("/aktivitas/baru")({
  head: () => ({
    meta: [
      { title: "Catat Aktivitas — Andara Sales OS" },
      { name: "description", content: "Catat satu kunjungan dalam lima ketukan." },
      { property: "og:title", content: "Catat Aktivitas — Andara Sales OS" },
      { property: "og:description", content: "Catat satu kunjungan dalam lima ketukan." },
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
  const [lead, setLead] = useState("");
  const [jenis, setJenis] = useState("");
  const [hasil, setHasil] = useState("");
  const [lanjut, setLanjut] = useState("");
  const ok = lead && jenis && hasil && lanjut;
  return (
    <AppShell title="Catat Aktivitas" subtitle="Lima ketukan, selesai" hideFab>
      <div className="mx-auto max-w-xl">
        <Chips label="1 · Lead" options={leads.slice(0, 4).map((l) => l.nama)} value={lead} onChange={setLead} />
        <Chips label="2 · Jenis" options={["Kunjungan", "Telepon", "WhatsApp", "Canvassing"]} value={jenis} onChange={setJenis} />
        <Chips label="3 · Hasil" options={["Tertarik", "Pikir-pikir", "Tidak tertarik", "Tidak ada orang"]} value={hasil} onChange={setHasil} />
        <Chips label="4 · Tindak lanjut" options={["Besok", "3 hari", "1 minggu", "Tidak perlu"]} value={lanjut} onChange={setLanjut} />
        <button
          disabled={!ok}
          onClick={() => { toast.success("Aktivitas tersimpan"); nav({ to: "/" }); }}
          className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-fab transition-opacity disabled:opacity-40 disabled:shadow-none"
        >
          5 · Simpan
        </button>
      </div>
    </AppShell>
  );
}
