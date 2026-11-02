// Data contoh — mengikuti Master Rancangan ANDARA SALES OS V.2 (Klaten, November 2026)

export type Status = "NA" | "NO" | "ENG" | "LEAD" | "QL" | "HOT" | "VISIT" | "BOOK" | "CV" | "NURTURE" | "LOST";

export const statusInfo: Record<Status, { arti: string; dihitung: string }> = {
  NA: { arti: "Tidak terhubung", dihitung: "Aktivitas" },
  NO: { arti: "Menolak", dihitung: "Aktivitas" },
  ENG: { arti: "Percakapan bermakna", dihitung: "Aktivitas" },
  LEAD: { arti: "Lead unik + izin", dihitung: "Lead" },
  QL: { arti: "Qualified", dihitung: "Prospek" },
  HOT: { arti: "Hot prospek", dihitung: "Hot prospek" },
  VISIT: { arti: "Tur hadir", dihitung: "Aktivitas bernilai tinggi" },
  BOOK: { arti: "Booking", dihitung: "Bukan closing" },
  CV: { arti: "Closing valid", dihitung: "Hasil" },
  NURTURE: { arti: "Belum siap", dihitung: "Pipeline masa depan" },
  LOST: { arti: "Tidak lanjut", dihitung: "Penutupan" },
};

/** Jalur utama pipeline (NA/NO/NURTURE/LOST adalah cabang). */
export const jalurPipeline: Status[] = ["LEAD", "QL", "HOT", "VISIT", "BOOK", "CV"];

export const proyek = [
  { nama: "Green Gumulan", lokasi: "Klaten Tengah", sisa: 7, harga: "Rp 166 – 188,5 jt", tipe: "Tipe 29 · LT 60–75 m²" },
  { nama: "Puri Alam Gayamprit", lokasi: "Klaten Selatan", sisa: 3, harga: "Rp 199 – 202 jt", tipe: "Tipe 29 · LT 82–84 m²" },
];

export type Lead = {
  id: string;
  panggilan: string; // privasi: hanya nama panggilan pada tahap prospek
  telp: string; // selalu tersamar
  proyek: string;
  status: Status;
  skor: number;
  alasan: string[];
  sumber: string;
  area: string;
  langkah: string;
  sla?: string;
};

/** Privasi: nomor selalu tersamar, mis. "6281•••• •421". */
export function samarkan(nomor: string) {
  const d = nomor.replace(/\D/g, "");
  return `${d.slice(0, 4)}•••• •${d.slice(-3)}`;
}

export const leads: Lead[] = [
  { id: "L-1042", panggilan: "Pak Budi", telp: "6281233445421", proyek: "Green Gumulan", status: "HOT", skor: 86, alasan: ["Setuju tur Sabtu", "Tanya simulasi KPR subsidi", "Penghasilan sesuai syarat"], sumber: "Canvassing D2D", area: "Klaten Tengah", langkah: "Konfirmasi tur Sabtu 09.00 & kirim simulasi KPR tipe 29", sla: "Tur wajib bertanggal" },
  { id: "L-1038", panggilan: "Bu Sari", telp: "6285711229080", proyek: "Puri Alam Gayamprit", status: "HOT", skor: 81, alasan: ["Datang open table", "Keluarga muda, belum punya rumah"], sumber: "Open table", area: "Klaten Selatan", langkah: "Ajak tur unit sisa 3 sebelum kehabisan" },
  { id: "L-1031", panggilan: "Mas Andi", telp: "6281390901212", proyek: "Green Gumulan", status: "QL", skor: 64, alasan: ["Produk relevan", "Belum tentukan waktu beli"], sumber: "Referensi", area: "Klaten Utara", langkah: "Tanyakan rencana waktu beli & DP" },
  { id: "L-1027", panggilan: "Bu Rina", telp: "6282177883344", proyek: "Green Gumulan", status: "LEAD", skor: 45, alasan: ["Isi formulir iklan", "Izin tindak lanjut ada"], sumber: "Meta Ads", area: "Klaten Tengah", langkah: "Hubungi < 24 jam — belum dihubungi", sla: "Lewat 26 jam" },
  { id: "L-1024", panggilan: "Pak Joko", telp: "6287855662211", proyek: "Puri Alam Gayamprit", status: "BOOK", skor: 92, alasan: ["Booking fee dibayar", "Berkas KPR 70%"], sumber: "Walk-in", area: "Klaten Selatan", langkah: "Lengkapi slip gaji & KK — booking BUKAN closing" },
  { id: "L-1015", panggilan: "Mbak Dewi", telp: "6281277001199", proyek: "Green Gumulan", status: "NURTURE", skor: 38, alasan: ["Menunggu bonus akhir tahun"], sumber: "Instagram", area: "Klaten Tengah", langkah: "Follow-up Desember sesuai izin" },
];

export const tindakLanjut = [
  { leadId: "L-1027", jenis: "Call", lewat: 3, draf: "Selamat siang Bu Rina, saya dari Andara. Terima kasih sudah tertarik Green Gumulan — boleh saya jelaskan cicilan subsidinya?" },
  { leadId: "L-1042", jenis: "Chat", lewat: 1, draf: "Pak Budi, sesuai janji tur Sabtu 09.00 di Green Gumulan ya. Berikut simulasi KPR tipe 29 untuk Bapak." },
  { leadId: "L-1038", jenis: "Chat", lewat: 0, draf: "Bu Sari, unit Puri Alam Gayamprit tinggal 3. Kapan Ibu sekeluarga bisa lihat langsung?" },
  { leadId: "L-1031", jenis: "Call", lewat: 0, draf: "Mas Andi, kira-kira rencana beli tahun ini atau tahun depan? Saya bantu hitungkan DP-nya." },
];

export const skorHarian = { skor: 78, peringkat: 3, dari: 12, tier: 3 };

export const tierInfo = [
  { tier: 1, rentang: "< 70", nama: "Rencana perbaikan" },
  { tier: 2, rentang: "70–84", nama: "Perlu pembinaan" },
  { tier: 3, rentang: "85–99", nama: "Solid" },
  { tier: 4, rentang: "100–114", nama: "Kuat" },
  { tier: 5, rentang: "≥ 115", nama: "Elite" },
];

export const kartuAktivitas = [
  { label: "Posting", nilai: 11, target: 15 },
  { label: "Chat/DM", nilai: 38, target: 50 },
  { label: "Call", nilai: 27, target: 40 },
  { label: "D2D", nilai: 19, target: 25 },
  { label: "Lead", nilai: 7, target: 10 },
  { label: "Hot", nilai: 2, target: 2 },
];

export const omzet = { capai: 620, target: 1000, pace: "Perlu 1 unit lagi sebelum 20 Nov" };

export const tugasAI = [
  { teks: "6 lead belum dihubungi > 24 jam", to: "/tindak-lanjut" },
  { teks: "2 hot prospek siap diajak tur", to: "/lead" },
  { teks: "4 konten sudah dibuat AI — tinggal tayang", to: "/" },
] as const;

export const riwayat = [
  { waktu: "Kemarin, 15.20", jenis: "D2D", catatan: "Bertemu di rumah, minat tipe 29. Setuju tur Sabtu. → HOT" },
  { waktu: "28 Okt, 10.05", jenis: "Chat", catatan: "Minta pricelist November & syarat KPR subsidi. → QL" },
  { waktu: "25 Okt, 19.40", jenis: "Lead masuk", catatan: "Canvassing Klaten Tengah, izin tindak lanjut diberikan." },
];

export const rute = [
  { jam: "08.30", nama: "Perum Griya Gumulan", alamat: "Blok A–C, Klaten Tengah", pintu: 14, jarak: "2,1 km", status: "selesai" },
  { jam: "10.00", nama: "Dusun Gumulan", alamat: "Sekitar balai desa", pintu: 9, jarak: "1,6 km", status: "berjalan" },
  { jam: "13.00", nama: "Pasar Gayamprit", alamat: "Kios & pedagang, Klaten Selatan", pintu: 18, jarak: "4,2 km", status: "nanti" },
  { jam: "15.00", nama: "Open table Alun-alun", alamat: "Meja promo Puri Alam Gayamprit", pintu: 12, jarak: "3,0 km", status: "nanti" },
] as const;

export const milestoneKomisi = [
  { nama: "Booking valid", porsi: 10, sla: "≤ 7 hari kerja", status: "cair" },
  { nama: "DP lunas", porsi: 20, sla: "≤ 7 hari kerja", status: "proses" },
  { nama: "PPJB / akad", porsi: 50, sla: "≤ 14 hari kerja", status: "menunggu" },
  { nama: "BAST / serah terima", porsi: 20, sla: "≤ 7 hari kerja", status: "menunggu" },
] as const;

export const findLead = (id: string) => leads.find((l) => l.id === id);

export function tingkatLewat(hari: number) {
  if (hari >= 3) return "destructive";
  if (hari >= 1) return "alert";
  return "warning";
}
