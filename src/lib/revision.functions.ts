import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { canCreateProject, canExportDaily, fromDbRole } from '@/lib/roles';
import { revenueSummary } from '@/lib/revision';
import { dailyReportSchema, reportCsv, reportInput } from '@/lib/daily-report';

export const getRevision = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase;
  const { data: role, error: roleError } = await db.from('pengguna').select('id,peran,sm_id').eq('auth_user_id', context.userId).maybeSingle();
  if (roleError || !role) throw new Error('Akses belum ditetapkan.');
  const results = await Promise.all([
    db.from('proyek').select('*').order('dibuat_pada', { ascending: false }),
    db.from('lead').select('*').order('dibuat_pada', { ascending: false }),
    db.from('transaksi').select('*'),
    db.from('aktivitas').select('*').order('terjadi_pada', { ascending: false }),
    db.from('konten_ai').select('*').order('dibuat_pada', { ascending: false }),
    db.from('agenda').select('*').order('mulai_pada'),
    db.from('pengingat_agenda').select('*').order('dibuat_pada', { ascending: false }),
    db.rpc('direktori_staf'),
    db.from('log_audit').select('*').order('dibuat_pada', { ascending: false }).limit(100),
    db.from('komisi_item').select('*'),
    db.from('kpi_logs').select('*').order('dibuat_pada', { ascending: false }),
    db.from('tautan_analitik').select('*'),
    db.from('permintaan_perubahan_lead').select('*').order('dibuat_pada', { ascending: false }),
    db.from('rute').select('*').order('urutan', { ascending: true }),
    db.from('target_penjualan').select('*'),
  ]);
  if (results.some((r) => r.error)) throw new Error('Data gagal dimuat. Coba lagi.');
  const [proyek, lead, transaksi, aktivitas, konten, agenda, pengingat, staf, audit, komisi, kpi, tautan, perubahan, rute, target] = results;
  const projects = (proyek.data ?? []).map((p) => ({ id: p.id, name: p.nama, target_amount: p.target_omzet, created_by: p.sm_id, created_at: p.dibuat_pada }));
  const leads = (lead.data ?? []).map((l) => ({ id: l.id, nickname: l.nama, prospect_name: l.nama, phone: l.telepon, address: l.alamat, source: l.sumber_lead, status: l.tahap, owner_id: l.pemilik_id, project_id: l.proyek_id, lead_value: l.nilai_lead, ticket_class: l.kelas_tiket, estimated_value: Number(l.nilai_perkiraan), verified_by: l.diverifikasi_oleh, verified_at: l.diverifikasi_pada, created_at: l.dibuat_pada }));
  const transactions = (transaksi.data ?? []).map((t) => ({ id: t.id, lead_id: t.lead_id, owner_id: t.sales_id, project_id: t.proyek_id, amount: t.harga_jual, status: t.status, closed_on: t.tanggal_transaksi.slice(0, 10), created_at: t.dibuat_pada }));
  const activities = (aktivitas.data ?? []).map((a) => ({ id: a.id, owner_id: a.pengguna_id, lead_id: a.lead_id, kind: a.jenis, note: a.catatan, occurred_at: a.terjadi_pada }));
  const videos = (konten.data ?? []).map((v) => ({ id: v.id, title: v.judul, asset_url: v.link_media_social, owner_id: v.dipublish_oleh_se_id, status: v.status_publish ? 'published' : 'draft', publisher_id: v.dipublish_oleh_se_id, tl_id: v.dipublish_oleh_tl_id, published_at: v.status_publish ? v.dibuat_pada : null, created_at: v.dibuat_pada }));
  const events = (agenda.data ?? []).map((e) => ({ id: e.id, owner_id: e.pengguna_id, project_id: e.proyek_id, title: e.judul, kind: e.jenis, starts_at: e.mulai_pada, location: e.lokasi, status: e.status, created_at: e.dibuat_pada }));
  const reminders = (pengingat.data ?? []).map((r) => ({ id: r.id, event_id: r.agenda_id, recipient_id: r.penerima_id, kind: r.jenis, created_at: r.dibuat_pada, read_at: r.dibaca_pada }));
  const staff = (staf.data ?? []).map((s) => ({ user_id: s.pengguna_id, staff_code: s.staff_code, staff_name: s.nama, tl_id: s.team_leader_id, role: fromDbRole(s.peran) ?? '' }));
  const auditLogs = (audit.data ?? []).map((a) => ({ id: a.id, actor_id: a.aktor_id, action: a.aksi, record_id: a.record_id, created_at: a.dibuat_pada }));
  const commissions = (komisi.data ?? []).map((c) => ({ id: c.id, owner_id: c.penerima_id, transaksi_id: c.transaksi_id, peran: fromDbRole(c.peran), amount: c.nominal, status: c.status_pencairan, created_at: c.dibuat_pada }));
  const kpis = (kpi.data ?? []).map((k) => ({ id: k.id, owner_id: k.pengguna_id, metric: k.jenis_aktivitas, value: k.skor, logged_on: k.dibuat_pada.slice(0, 10) }));
  const analytics = (tautan.data ?? []).map((t) => ({ id: t.id, label: t.label, url: t.url, created_by: t.dibuat_oleh }));
  const changes = (perubahan.data ?? []).map((c) => { const u = c.usulan && typeof c.usulan === 'object' && !Array.isArray(c.usulan) ? (c.usulan as Record<string, string>) : null; return { id: c.id, lead_id: c.lead_id, requested_by: c.diminta_oleh, proposed: u ? { prospect_name: u['nama'], phone: u['telepon'], address: u['alamat'], source: u['sumber_lead'], status: u['tahap'] } : null, reason: c.alasan, status: c.status, approved_by: c.disetujui_oleh, created_at: c.dibuat_pada, applied_at: c.diterapkan_pada }; });
  const routes = (rute.data ?? []).map((r) => ({ id: r.id, jam: r.jam, nama: r.nama, alamat: r.alamat, pintu: r.pintu, jarak: r.jarak, status: r.status, tanggal: r.tanggal }));
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).format(new Date());
  const targets = (target.data ?? []).map((t) => ({ id: t.id, manager_id: t.manajer_id, user_id: t.target_user_id, month: t.bulan, amount: Number(t.target_omzet) }));
  const monthTarget = targets.filter((t) => t.month === month).reduce((s, t) => s + t.amount, 0);
  return { projects, leads, transactions, activities, videos, events, reminders, staff, audit: auditLogs, commissions, kpis, analytics, changes, rute: routes, targets, revenue: revenueSummary(transactions.filter((t) => t.closed_on.startsWith(month)), monthTarget > 0 ? monthTarget : projects.reduce((s, p) => s + Number(p.target_amount), 0)) };
});

export const createProject = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ name: z.string().trim().min(1).max(200), target: z.number().nonnegative() })).handler(async ({ data, context }) => {
  const { data: account } = await context.supabase.from('pengguna').select('id,peran,sm_id').eq('auth_user_id', context.userId).maybeSingle();
  const role = account ? fromDbRole(account.peran) : null;
  if (!role || !canCreateProject(role)) throw new Error('Hanya TL dan SM dapat menambah proyek.');
  const { data: project, error } = await context.supabase.from('proyek').insert({ nama: data.name, target_omzet: data.target, sm_id: role === 'sm' ? account!.id : account!.sm_id, kode: 'P-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }).select('id').single();
  if (error || !project) throw new Error('Proyek belum tersimpan.');
  return project;
});

export const createEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ title: z.string().trim().min(1).max(200), kind: z.enum(['survey', 'tour', 'follow_up']), starts_at: z.string().datetime(), location: z.string().max(500) })).handler(async ({ data, context }) => {
  const { data: event, error } = await context.supabase.from('agenda').insert({ judul: data.title, jenis: data.kind, mulai_pada: data.starts_at, lokasi: data.location }).select('id').single();
  if (error || !event) throw new Error('Agenda belum tersimpan.');
  return event;
});

export const updateEvent = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), status: z.enum(['done', 'cancelled']) })).handler(async ({ data, context }) => {
  const { data: row, error } = await context.supabase.from('agenda').update({ status: data.status }).eq('id', data.id).select('id').single();
  if (error || !row) throw new Error('Agenda belum diperbarui.');
  return { ok: true };
});

export const markReminder = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('pengingat_agenda').update({ dibaca_pada: new Date().toISOString() }).eq('id', data.id);
  if (error) throw new Error('Pengingat belum diperbarui.');
  return { ok: true };
});

export const simpanRute = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ nama: z.string().trim().min(1).max(200), alamat: z.string().trim().max(500), jam: z.string().max(20), pintu: z.number().int().nonnegative(), jarak: z.string().max(50), tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('rute').insert({ nama: data.nama, alamat: data.alamat, jam: data.jam, pintu: data.pintu, jarak: data.jarak, tanggal: data.tanggal });
  if (error) throw new Error('Rute belum tersimpan.');
  return { ok: true };
});

export const updateRute = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), status: z.enum(['selesai', 'berjalan', 'nanti']) })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('rute').update({ status: data.status }).eq('id', data.id);
  if (error) throw new Error('Rute belum diperbarui.');
  return { ok: true };
});

export const exportDaily = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), seId: z.string().uuid().optional() })).handler(async ({ data, context }) => {
  const { data: account } = await context.supabase.from('pengguna').select('id,peran,sm_id').eq('auth_user_id', context.userId).maybeSingle();
  const role = account ? fromDbRole(account.peran) : null;
  if (!role || !canExportDaily(role)) throw new Error('Anda tidak memiliki akses laporan harian.');
  reportInput.parse({ from: data.from, to: data.to });
  const { data: payload, error } = await context.supabase.rpc('laporan_data', { _dari: data.from, _sampai: data.to, ...(data.seId ? { _pemilik: [data.seId] } : {}) });
  if (error) throw new Error('Laporan gagal dimuat atau di luar lingkup akses.');
  const report = dailyReportSchema.parse(payload);
  return { csv: reportCsv(report), count: report.activities.length + report.leads.length + report.kpis.length };
});
export const saveTarget = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ userId: z.string().uuid(), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), amount: z.number().nonnegative() })).handler(async ({ data, context }) => {
  const { data: account } = await context.supabase.from('pengguna').select('id,peran').eq('auth_user_id', context.userId).maybeSingle();
  const role = account ? fromDbRole(account.peran) : null;
  if (!account || (role !== 'sm' && role !== 'dir')) throw new Error('Hanya SM dan Direksi dapat menetapkan target.');
  const { error } = await context.supabase.from('target_penjualan').upsert({ manajer_id: account.id, target_user_id: data.userId, bulan: data.month, target_omzet: data.amount }, { onConflict: 'target_user_id,bulan' });
  if (error) throw new Error('Target belum tersimpan.');
  return { ok: true };
});
