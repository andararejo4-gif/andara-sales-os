import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { leadInput, leadFields, analyticsInput, canManageAnalytics } from '@/lib/lead-rules';
import { fromDbRole } from '@/lib/roles';

export const saveLead = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(leadInput).handler(async ({ data, context }) => {
  if (data.id) {
    const { data: id, error } = await context.supabase.rpc('simpan_lead', { _id: data.id, _nama: data.prospect_name, _telepon: data.phone, _alamat: data.address, _sumber: data.source, _tahap: data.status, _catatan: data.note, _pemilik: data.owner_id ?? null, _nilai: data.nominal });
    if (error || !id) throw new Error('Lead belum tersimpan. Periksa isian dan hak akses Anda.');
    return { id };
  }
  const { data: id, error } = await context.supabase.rpc('buat_lead', { _nama: data.prospect_name, _telepon: data.phone, _alamat: data.address, _sumber: data.source, _origin: 'LP', _tahap: data.status, _proyek: null, _catatan: data.note, _pemilik: data.owner_id ?? null, _kelas: data.kelas, _nilai: data.nominal });
  if (error || !id) throw new Error('Lead belum tersimpan. Periksa isian dan hak akses Anda.');
  return { id };
});

export const verifyLead = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), value: z.number().finite().nonnegative() })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc('verifikasi_lead', { _id: data.id, _nilai: data.value });
  if (error) throw new Error('Verifikasi memerlukan ADM atau TL dalam lingkup lead.');
  return { ok: true };
});

export const requestLeadChange = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), proposed: leadFields, reason: z.string().trim().min(1).max(2000) })).handler(async ({ data, context }) => {
  const proposed = { nama: data.proposed.prospect_name, telepon: data.proposed.phone, alamat: data.proposed.address, sumber_lead: data.proposed.source, tahap: data.proposed.status };
  const { error } = await context.supabase.rpc('minta_perubahan_lead', { _lead: data.id, _usulan: proposed, _alasan: data.reason });
  if (error) throw new Error('Permintaan perubahan belum tersimpan.');
  return { ok: true };
});

export const reviewLeadChange = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), approve: z.boolean() })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc('tinjau_perubahan_lead', { _req: data.id, _setuju: data.approve });
  if (error) throw new Error('Hanya SM dalam lingkup lead dapat menyetujui.');
  return { ok: true };
});

export const applyLeadChange = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc('terapkan_perubahan_lead', { _req: data.id });
  if (error) throw new Error('Perubahan belum disetujui SM atau sudah diterapkan.');
  return { ok: true };
});

export const saveAnalyticsLink = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(analyticsInput).handler(async ({ data, context }) => {
  const { data: account } = await context.supabase.from('pengguna').select('peran').eq('auth_user_id', context.userId).single();
  const role = account ? fromDbRole(account.peran) : null;
  if (!role || !canManageAnalytics(role)) throw new Error('Akses pengaturan tautan ditolak.');
  const { error } = await context.supabase.from('tautan_analitik').insert({ label: data.label, url: data.url }).select('id').single();
  if (error) throw new Error('Tautan belum tersimpan.');
  return { ok: true };
});