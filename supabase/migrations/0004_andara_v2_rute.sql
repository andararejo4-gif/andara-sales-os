CREATE TABLE public.rute (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  proyek_id uuid REFERENCES public.proyek(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT current_date,
  urutan integer NOT NULL DEFAULT 0,
  jam text NOT NULL DEFAULT '',
  nama text NOT NULL,
  alamat text NOT NULL DEFAULT '',
  pintu integer NOT NULL DEFAULT 0,
  jarak text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'nanti' CHECK (status IN ('selesai','berjalan','nanti')),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rute_pengguna_tanggal ON public.rute (pengguna_id, tanggal);
ALTER TABLE public.rute ENABLE ROW LEVEL SECURITY;
CREATE POLICY rute_select ON public.rute FOR SELECT TO authenticated USING (public.lihat_staf(pengguna_id) OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY rute_insert ON public.rute FOR INSERT TO authenticated WITH CHECK (public.lihat_staf(pengguna_id));
CREATE POLICY rute_update ON public.rute FOR UPDATE TO authenticated USING (pengguna_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (pengguna_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY rute_delete ON public.rute FOR DELETE TO authenticated USING (pengguna_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rute TO authenticated;
GRANT ALL ON public.rute TO service_role;

ALTER TABLE public.rute ALTER COLUMN pengguna_id SET DEFAULT public.pengguna_saya();

