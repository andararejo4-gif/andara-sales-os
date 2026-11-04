import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { dailyReportSchema, manualNoteInput, reportInput, reportStaffSchema } from '@/lib/daily-report';
import { canExportDaily, fromDbRole } from '@/lib/roles';

export const getReportStaff = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: account, error: accountError } = await context.supabase.from('pengguna').select('peran').eq('auth_user_id', context.userId).single();
  const role = account ? fromDbRole(account.peran) : null;
  if (accountError || !role || !canExportDaily(role)) throw new Error('Anda tidak memiliki akses laporan harian.');
  const { data, error } = await context.supabase.rpc('laporan_staf');
  if (error) throw new Error('Daftar anggota laporan gagal dimuat.');
  return reportStaffSchema.array().parse(data ?? []);
});

export const fetchDailyReport = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(reportInput).handler(async ({ data, context }) => {
  const { data: report, error } = await context.supabase.rpc('laporan_data', { _dari: data.from, _sampai: data.to, ...(data.ownerIds ? { _pemilik: data.ownerIds } : {}), ...(data.kelas ? { _kelas: data.kelas } : {}) });
  if (error) throw new Error('Laporan gagal dimuat atau pilihan anggota di luar akses Anda.');
  return dailyReportSchema.parse(report);
});

export const addManualNote = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(manualNoteInput).handler(async ({ data, context }) => {
  const { data: account } = await context.supabase.from('pengguna').select('id,peran').eq('auth_user_id', context.userId).maybeSingle();
  const role = account ? fromDbRole(account.peran) : null;
  if (!account || !role || !canExportDaily(role)) throw new Error('Anda tidak memiliki akses laporan.');
  const { error } = await context.supabase.from('aktivitas').insert({ pengguna_id: account.id, jenis: 'Catatan', catatan: data.note });
  if (error) throw new Error('Catatan belum tersimpan.');
  return { ok: true };
});
