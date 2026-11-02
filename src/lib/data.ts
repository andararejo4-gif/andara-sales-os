export type Lead = {
  id: string;
  nama: string;
  telp: string;
  proyek: string;
  tahap: "Baru" | "Kontak" | "Kunjungan" | "Negosiasi" | "Booking";
  skor: number;
  alasan: string[];
  sumber: string;
  alamat: string;
  langkah: string;
};

export const leads: Lead[] = [
  { id: "L-1042", nama: "Budi Santoso", telp: "0812-3344-5566", proyek: "Andara Residence", tahap: "Negosiasi", skor: 86, alasan: ["Sudah survei lokasi 2×", "Tanya simulasi KPR", "Anggaran sesuai tipe 45"], sumber: "Instagram", alamat: "Jl. Kenanga 12, Sleman", langkah: "Kirim simulasi KPR tipe 45 & ajak tanda tangan booking" },
  { id: "L-1038", nama: "Sari Wulandari", telp: "0857-1122-9080", proyek: "Rejo Garden", tahap: "Kunjungan", skor: 72, alasan: ["Datang ke pameran", "Pekerjaan tetap"], sumber: "Pameran", alamat: "Perum Griya Asri B4", langkah: "Jadwalkan kunjungan rumah contoh Sabtu" },
  { id: "L-1031", nama: "Andi Prasetyo", telp: "0813-9090-1212", proyek: "Andara Residence", tahap: "Kontak", skor: 58, alasan: ["Membalas WhatsApp", "Belum tahu anggaran"], sumber: "Referensi", alamat: "Jl. Melati 3, Depok", langkah: "Tanyakan kisaran anggaran & waktu beli" },
  { id: "L-1027", nama: "Rina Kartika", telp: "0821-7788-3344", proyek: "Rejo Garden", tahap: "Baru", skor: 41, alasan: ["Isi formulir iklan"], sumber: "Facebook Ads", alamat: "Jl. Mawar 21, Bantul", langkah: "Telepon perkenalan" },
  { id: "L-1019", nama: "Dewi Lestari", telp: "0878-5566-2211", proyek: "Andara Residence", tahap: "Booking", skor: 94, alasan: ["Sudah bayar tanda jadi"], sumber: "Walk-in", alamat: "Jl. Anggrek 7, Sleman", langkah: "Lengkapi berkas KPR" },
];

export const tindakLanjut = [
  { leadId: "L-1042", jenis: "WhatsApp", lewat: 3, draf: "Selamat siang Pak Budi, berikut simulasi KPR tipe 45 yang Bapak minta. Kapan Bapak ada waktu untuk diskusi singkat?" },
  { leadId: "L-1038", jenis: "Telepon", lewat: 1, draf: "Halo Bu Sari, apakah Sabtu pagi cocok untuk melihat rumah contoh di Rejo Garden?" },
  { leadId: "L-1031", jenis: "WhatsApp", lewat: 0, draf: "Pak Andi, boleh saya bantu hitungkan cicilan sesuai anggaran Bapak?" },
  { leadId: "L-1027", jenis: "Telepon", lewat: 0, draf: "Halo Bu Rina, terima kasih sudah mengisi formulir Rejo Garden. Saya Wahyu dari Andara." },
];

export const riwayat = [
  { waktu: "Kemarin, 15.20", jenis: "Kunjungan", catatan: "Survei lokasi bersama istri, suka posisi hook." },
  { waktu: "28 Okt, 10.05", jenis: "WhatsApp", catatan: "Minta brosur & daftar harga tipe 36 dan 45." },
  { waktu: "25 Okt, 19.40", jenis: "Lead masuk", catatan: "Dari iklan Instagram Andara Residence." },
];

export const rute = [
  { jam: "08.30", nama: "Perum Griya Asri", alamat: "Blok A–C, Sleman", pintu: 14, jarak: "2,1 km", status: "selesai" },
  { jam: "10.00", nama: "Jl. Kaliurang Km 9", alamat: "Ruko & kos-kosan", pintu: 9, jarak: "4,6 km", status: "berjalan" },
  { jam: "13.00", nama: "Perum Puri Indah", alamat: "Blok D–F", pintu: 18, jarak: "3,2 km", status: "nanti" },
  { jam: "15.30", nama: "Pasar Gentan", alamat: "Kios sekitar pasar", pintu: 12, jarak: "1,8 km", status: "nanti" },
] as const;

export const findLead = (id: string) => leads.find((l) => l.id === id);

export function tingkatLewat(hari: number) {
  if (hari >= 3) return "destructive";
  if (hari >= 1) return "alert";
  return "warning";
}
