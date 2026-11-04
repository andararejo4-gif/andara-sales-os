export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type RolePengguna = 'DIREKSI' | 'SALES_MANAGER' | 'TEAM_LEADER' | 'DIGITAL_MARKETING' | 'ADMIN' | 'SALES' | 'IT' | 'SALES_2' | 'TL_2';
type StatusPipeline = 'NA' | 'NO' | 'ENG' | 'LEAD' | 'QL' | 'HOT' | 'VISIT' | 'BOOK' | 'CV' | 'NURTURE' | 'LOST';
type OriginLead = 'LM' | 'LP' | 'PP' | 'HP';
type KategoriHarga = 'subsidi' | 'ekonomis' | 'menengah' | 'menengah_atas' | 'premium' | 'mewah' | 'super_mewah';
type StatusUnit = 'tersedia' | 'dibooking' | 'terjual' | 'ditahan';
type MetodeBayar = 'CASH_KERAS' | 'TEMPO_6' | 'TEMPO_12' | 'KPR';
type StatusKomisi = 'PENDING' | 'DISETUJUI' | 'DICAIRKAN' | 'DITOLAK';

type Tbl<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      pengguna: Tbl<{ id: string; auth_user_id: string | null; nama: string; email: string; peran: RolePengguna; team_leader_id: string | null; staff_code: string; sm_id: string | null; aktif: boolean; dibuat_pada: string }>;
      admin_tl_assignments: Tbl<{ id: string; admin_id: string; team_leader_id: string; dibuat_pada: string }>;
      proyek: Tbl<{ id: string; kode: string; nama: string; kategori_harga: KategoriHarga; sm_id: string | null; admin_id: string | null; aktif: boolean; dibuat_pada: string; target_omzet: number }>;
      unit: Tbl<{ id: string; proyek_id: string; kode_unit: string; tipe: string | null; luas_tanah: number; luas_bangunan: number; harga_dasar: number; status: StatusUnit; dikunci_oleh: string | null; dikunci_sampai: string | null }>;
      lead: Tbl<{ id: string; kode: string; nama: string; telepon: string; alamat: string | null; sumber_lead: string; origin: OriginLead; proyek_id: string | null; pemilik_id: string | null; tahap: StatusPipeline; catatan: string | null; dibuat_pada: string; diubah_pada: string; nilai_lead: number; diverifikasi_oleh: string | null; diverifikasi_pada: string | null; kelas_tiket: string; nilai_perkiraan: number }>;
      transaksi: Tbl<{ id: string; kode_transaksi: string; lead_id: string; proyek_id: string; unit_id: string; sales_id: string; harga_jual: number; metode_bayar: MetodeBayar; dokumen_lengkap: boolean; tanggal_transaksi: string; dibuat_pada: string; status: 'BOOK' | 'CV' | 'CANCELLED' }>;
      skema_komisi: Tbl<{ id: string; proyek_id: string; peran: RolePengguna; origin: OriginLead; rate_dasar: number; addon_cash_keras: number; berlaku_mulai: string; berlaku_sampai: string | null; dibuat_pada: string }>;
      komisi_item: Tbl<{ id: string; transaksi_id: string; penerima_id: string; peran: RolePengguna; rate: number; nominal: number; status_pencairan: StatusKomisi; dibuat_pada: string; calculated_by: string | null }>;
      kpi_logs: Tbl<{ id: string; pengguna_id: string; jenis_aktivitas: string; skor: number; keterangan: string | null; dibuat_pada: string }>;
      konten_ai: Tbl<{ id: string; judul: string; link_media_social: string | null; dipublish_oleh_se_id: string | null; dipublish_oleh_tl_id: string | null; status_publish: boolean; dibuat_pada: string }>;
      aktivitas: Tbl<{ id: string; pengguna_id: string; proyek_id: string | null; lead_id: string | null; jenis: string; catatan: string; terjadi_pada: string }>;
      agenda: Tbl<{ id: string; pengguna_id: string; proyek_id: string | null; judul: string; jenis: string; mulai_pada: string; lokasi: string; status: string; dibuat_pada: string }>;
      pengingat_agenda: Tbl<{ id: string; agenda_id: string; penerima_id: string; jenis: string; dibuat_pada: string; dibaca_pada: string | null }>;
      pekerjaan: Tbl<{ id: string; pemilik_id: string; proyek_id: string | null; fitur: string; judul: string; catatan: string; status: string; dibuat_pada: string }>;
      log_audit: Tbl<{ id: string; aktor_id: string | null; aksi: string; record_id: string | null; dibuat_pada: string }>;
      permintaan_perubahan_lead: Tbl<{ id: string; lead_id: string; diminta_oleh: string; usulan: Json; alasan: string; status: string; disetujui_oleh: string | null; dibuat_pada: string; diterapkan_pada: string | null }>;
      tautan_analitik: Tbl<{ id: string; label: string; url: string; dibuat_oleh: string }>;
      target_penjualan: Tbl<{ id: string; manajer_id: string; target_user_id: string; bulan: string; target_omzet: number; dibuat_pada: string }>;
      rute: Tbl<{ id: string; pengguna_id: string; proyek_id: string | null; tanggal: string; urutan: number; jam: string; nama: string; alamat: string; pintu: number; jarak: string; status: string; dibuat_pada: string }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      direktori_staf: { Args: never; Returns: { pengguna_id: string; peran: string; nama: string; email: string; staff_code: string; team_leader_id: string | null; sm_id: string | null }[] };
      fitur_akses: { Args: { _fitur: string; _tulis?: boolean }; Returns: boolean };
      laporan_staf: { Args: never; Returns: { user_id: string; role: string; staff_name: string; staff_code: string; tl_id: string | null }[] };
      laporan_data: { Args: { _dari: string; _sampai: string; _pemilik?: string[]; _kelas?: string }; Returns: Json };
      simpan_lead: { Args: { _id: string; _nama: string; _telepon: string; _alamat: string; _sumber: string; _tahap: string; _catatan?: string; _pemilik?: string | null; _nilai?: number }; Returns: string };
      buat_lead: { Args: { _nama: string; _telepon: string; _alamat: string; _sumber: string; _origin: string; _tahap: string; _proyek: string | null; _catatan?: string; _pemilik?: string | null; _kelas?: string; _nilai?: number }; Returns: string };
      verifikasi_lead: { Args: { _id: string; _nilai: number }; Returns: undefined };
      minta_perubahan_lead: { Args: { _lead: string; _usulan: Json; _alasan: string }; Returns: string };
      tinjau_perubahan_lead: { Args: { _req: string; _setuju: boolean }; Returns: undefined };
      terapkan_perubahan_lead: { Args: { _req: string }; Returns: undefined };
      generate_pengingat_agenda: { Args: never; Returns: number };
    };
    Enums: {
      role_pengguna: RolePengguna[];
      status_pipeline: StatusPipeline[];
      origin_lead: OriginLead[];
      kategori_harga_proyek: KategoriHarga[];
      status_unit: StatusUnit[];
      metode_pembayaran: MetodeBayar[];
      status_komisi: StatusKomisi[];
    };
    CompositeTypes: { [_ in never]: never };
  };
};