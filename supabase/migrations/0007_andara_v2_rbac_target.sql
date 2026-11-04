ALTER TYPE public.role_pengguna ADD VALUE IF NOT EXISTS 'SALES_2';
ALTER TYPE public.role_pengguna ADD VALUE IF NOT EXISTS 'TL_2';

CREATE TABLE public.target_penjualan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manajer_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  bulan text NOT NULL,
  target_omzet numeric NOT NULL DEFAULT 0 CHECK (target_omzet >= 0),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_user_id, bulan)
);
CREATE INDEX idx_target_user ON public.target_penjualan (target_user_id, bulan);
ALTER TABLE public.target_penjualan ENABLE ROW LEVEL SECURITY;
CREATE POLICY target_select ON public.target_penjualan FOR SELECT TO authenticated USING (manajer_id = public.pengguna_saya() OR target_user_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY target_write ON public.target_penjualan FOR ALL TO authenticated USING (manajer_id = public.pengguna_saya() AND public.peran_saya() IN ('SALES_MANAGER','DIREKSI')) WITH CHECK (manajer_id = public.pengguna_saya() AND public.peran_saya() IN ('SALES_MANAGER','DIREKSI'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.target_penjualan TO authenticated;
GRANT ALL ON public.target_penjualan TO service_role;