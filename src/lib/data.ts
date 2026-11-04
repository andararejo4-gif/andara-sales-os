export type Status = "NA" | "NO" | "ENG" | "LEAD" | "QL" | "HOT" | "VISIT" | "BOOK" | "CV" | "NURTURE" | "LOST";

export function samarkan(nomor: string) {
  const d = nomor.replace(/\D/g, "");
  return `${d.slice(0, 4)}•••• •${d.slice(-3)}`;
}

export const tierInfo = [
  { tier: 1, rentang: "< 70", nama: "Rencana perbaikan" },
  { tier: 2, rentang: "70–84", nama: "Perlu pembinaan" },
  { tier: 3, rentang: "85–99", nama: "Solid" },
  { tier: 4, rentang: "100–114", nama: "Kuat" },
  { tier: 5, rentang: "≥ 115", nama: "Elite" },
];

export function tingkatLewat(hari: number) {
  if (hari >= 3) return "destructive";
  if (hari >= 1) return "alert";
  return "warning";
}