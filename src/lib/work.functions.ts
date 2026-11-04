import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
const feature = z.enum(['team', 'verification', 'content', 'projects', 'portfolio']);
export const listWork = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ feature })).handler(async ({ data, context }) => {
  const { data: allowed, error: accessError } = await context.supabase.rpc('fitur_akses', { _fitur: data.feature, _tulis: false });
  if (accessError || !allowed) throw new Error('Akses tidak diizinkan.');
  const { data: items, error } = await context.supabase.from('pekerjaan').select('id,judul,catatan,status,dibuat_pada,pemilik_id').eq('fitur', data.feature).order('dibuat_pada', { ascending: false });
  if (error) throw new Error('Daftar pekerjaan gagal dimuat.');
  return (items ?? []).map((i) => ({ id: i.id, title: i.judul, note: i.catatan, status: i.status, created_at: i.dibuat_pada, owner_id: i.pemilik_id }));
});
export const addWork = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ feature, title: z.string().trim().min(1).max(200), note: z.string().max(2000) })).handler(async ({ data, context }) => {
  const { data: allowed } = await context.supabase.rpc('fitur_akses', { _fitur: data.feature, _tulis: true });
  if (!allowed) throw new Error('Akses tidak diizinkan.');
  const { error } = await context.supabase.from('pekerjaan').insert({ fitur: data.feature, judul: data.title, catatan: data.note });
  if (error) throw new Error('Pekerjaan belum tersimpan.');
  return { ok: true };
});
export const updateWork = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), status: z.enum(['pending', 'in_progress', 'done']) })).handler(async ({ data, context }) => {
  const { data: updated, error } = await context.supabase.from('pekerjaan').update({ status: data.status }).eq('id', data.id).select('id').single();
  if (error || !updated) throw new Error('Status belum tersimpan.');
  return { ok: true };
});