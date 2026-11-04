CREATE TYPE public.role_pengguna AS ENUM ('DIREKSI','SALES_MANAGER','TEAM_LEADER','DIGITAL_MARKETING','ADMIN','SALES','IT');
CREATE TYPE public.status_pipeline AS ENUM ('NA','NO','ENG','LEAD','QL','HOT','VISIT','BOOK','CV','NURTURE','LOST');
CREATE TYPE public.origin_lead AS ENUM ('LM','LP','PP','HP');
CREATE TYPE public.kategori_harga_proyek AS ENUM ('subsidi','ekonomis','menengah','menengah_atas','premium','mewah','super_mewah');
CREATE TYPE public.status_unit AS ENUM ('tersedia','dibooking','terjual','ditahan');
CREATE TYPE public.metode_pembayaran AS ENUM ('CASH_KERAS','TEMPO_6','TEMPO_12','KPR');
CREATE TYPE public.status_komisi AS ENUM ('PENDING','DISETUJUI','DICAIRKAN','DITOLAK');

CREATE TABLE public.pengguna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  email text UNIQUE NOT NULL,
  peran public.role_pengguna NOT NULL DEFAULT 'SALES',
  team_leader_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  aktif boolean NOT NULL DEFAULT true,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_tl_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  team_leader_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_id, team_leader_id)
);

CREATE TABLE public.proyek (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text UNIQUE NOT NULL,
  nama text NOT NULL,
  kategori_harga public.kategori_harga_proyek NOT NULL DEFAULT 'menengah',
  sm_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  admin_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  aktif boolean NOT NULL DEFAULT true,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.unit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  kode_unit text NOT NULL,
  tipe text,
  luas_tanah numeric NOT NULL DEFAULT 60,
  luas_bangunan numeric NOT NULL DEFAULT 36,
  harga_dasar numeric NOT NULL CHECK (harga_dasar >= 0),
  status public.status_unit NOT NULL DEFAULT 'tersedia',
  dikunci_oleh uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  dikunci_sampai timestamptz,
  UNIQUE (proyek_id, kode_unit)
);

CREATE TABLE public.lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text UNIQUE NOT NULL,
  nama text NOT NULL,
  telepon text NOT NULL,
  alamat text,
  sumber_lead text NOT NULL,
  origin public.origin_lead NOT NULL DEFAULT 'LP',
  proyek_id uuid REFERENCES public.proyek(id) ON DELETE SET NULL,
  pemilik_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  tahap public.status_pipeline NOT NULL DEFAULT 'LEAD',
  catatan text,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transaksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_transaksi text UNIQUE NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.lead(id) ON DELETE RESTRICT,
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES public.unit(id) ON DELETE RESTRICT,
  sales_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE RESTRICT,
  harga_jual numeric NOT NULL CHECK (harga_jual > 0),
  metode_bayar public.metode_pembayaran NOT NULL DEFAULT 'CASH_KERAS',
  dokumen_lengkap boolean NOT NULL DEFAULT false,
  tanggal_transaksi timestamptz NOT NULL DEFAULT now(),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.skema_komisi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  peran public.role_pengguna NOT NULL,
  origin public.origin_lead NOT NULL,
  rate_dasar numeric NOT NULL,
  addon_cash_keras numeric NOT NULL DEFAULT 0.0050,
  berlaku_mulai date NOT NULL DEFAULT current_date,
  berlaku_sampai date,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.komisi_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id uuid NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
  penerima_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  peran public.role_pengguna NOT NULL,
  rate numeric NOT NULL,
  nominal numeric NOT NULL,
  status_pencairan public.status_komisi NOT NULL DEFAULT 'PENDING',
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  calculated_by uuid REFERENCES public.pengguna(id) ON DELETE SET NULL
);

CREATE TABLE public.kpi_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  jenis_aktivitas text NOT NULL,
  skor numeric NOT NULL DEFAULT 0,
  keterangan text,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.konten_ai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  link_media_social text,
  dipublish_oleh_se_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  dipublish_oleh_tl_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  status_publish boolean NOT NULL DEFAULT false,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_pemilik_tahap ON public.lead (pemilik_id, tahap);
CREATE INDEX idx_transaksi_sales ON public.transaksi (sales_id);
CREATE INDEX idx_komisi_transaksi ON public.komisi_item (transaksi_id);
CREATE INDEX idx_unit_proyek_status ON public.unit (proyek_id, status);
CREATE FUNCTION public.peran_saya() RETURNS public.role_pengguna LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.peran FROM public.pengguna p WHERE p.auth_user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.peran_saya() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peran_saya() TO authenticated, service_role;

CREATE FUNCTION public.pengguna_saya() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM public.pengguna p WHERE p.auth_user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.pengguna_saya() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pengguna_saya() TO authenticated, service_role;

CREATE FUNCTION public.lihat_staf(_staf uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pengguna s
    JOIN public.pengguna m ON m.auth_user_id = auth.uid()
    WHERE s.id = _staf AND (
      s.auth_user_id = auth.uid()
      OR m.peran IN ('DIREKSI','IT')
      OR (m.peran = 'TEAM_LEADER' AND (s.id = m.id OR s.team_leader_id = m.id))
      OR (m.peran = 'SALES_MANAGER' AND (s.id = m.id OR s.team_leader_id = m.id))
      OR (m.peran = 'ADMIN' AND EXISTS (
        SELECT 1 FROM public.admin_tl_assignments a
        WHERE a.admin_id = m.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id)
      ))
    )
  )
$$;
REVOKE ALL ON FUNCTION public.lihat_staf(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lihat_staf(uuid) TO authenticated, service_role;

CREATE FUNCTION public.lihat_proyek(_proyek uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pengguna m
    JOIN public.proyek pr ON pr.id = _proyek
    WHERE m.auth_user_id = auth.uid() AND (
      m.peran IN ('DIREKSI','IT')
      OR pr.sm_id = m.id
      OR pr.admin_id = m.id
    )
  )
$$;
REVOKE ALL ON FUNCTION public.lihat_proyek(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lihat_proyek(uuid) TO authenticated, service_role;

ALTER TABLE public.pengguna ENABLE ROW LEVEL SECURITY;
CREATE POLICY pengguna_select ON public.pengguna FOR SELECT TO authenticated USING (public.lihat_staf(id));
CREATE POLICY pengguna_write ON public.pengguna FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT') OR auth_user_id = auth.uid()) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT') OR auth_user_id = auth.uid());

ALTER TABLE public.admin_tl_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assignment_select ON public.admin_tl_assignments FOR SELECT TO authenticated USING (admin_id = public.pengguna_saya() OR team_leader_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY assignment_write ON public.admin_tl_assignments FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT'));

ALTER TABLE public.proyek ENABLE ROW LEVEL SECURITY;
CREATE POLICY proyek_select ON public.proyek FOR SELECT TO authenticated USING (true);
CREATE POLICY proyek_write ON public.proyek FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','SALES_MANAGER')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT','SALES_MANAGER'));

ALTER TABLE public.unit ENABLE ROW LEVEL SECURITY;
CREATE POLICY unit_select ON public.unit FOR SELECT TO authenticated USING (public.lihat_proyek(proyek_id) OR public.peran_saya() IN ('TEAM_LEADER','SALES'));
CREATE POLICY unit_write ON public.unit FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','SALES_MANAGER','ADMIN')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT','SALES_MANAGER','ADMIN'));

ALTER TABLE public.lead ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_select ON public.lead FOR SELECT TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT') OR (public.peran_saya() <> 'DIGITAL_MARKETING' AND (public.lihat_staf(pemilik_id) OR (proyek_id IS NOT NULL AND public.lihat_proyek(proyek_id)))));
CREATE POLICY lead_insert ON public.lead FOR INSERT TO authenticated WITH CHECK (public.peran_saya() IN ('SALES','TEAM_LEADER','SALES_MANAGER') AND public.lihat_staf(pemilik_id));
CREATE POLICY lead_update ON public.lead FOR UPDATE TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT') OR public.lihat_staf(pemilik_id) OR (proyek_id IS NOT NULL AND public.lihat_proyek(proyek_id))) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT') OR public.lihat_staf(pemilik_id) OR (proyek_id IS NOT NULL AND public.lihat_proyek(proyek_id)));

ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaksi_select ON public.transaksi FOR SELECT TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT') OR (public.peran_saya() <> 'DIGITAL_MARKETING' AND (public.lihat_staf(sales_id) OR public.lihat_proyek(proyek_id))));
CREATE POLICY transaksi_insert ON public.transaksi FOR INSERT TO authenticated WITH CHECK (public.peran_saya() IN ('SALES','TEAM_LEADER','SALES_MANAGER','ADMIN') AND public.lihat_staf(sales_id));
CREATE POLICY transaksi_update ON public.transaksi FOR UPDATE TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','ADMIN')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT','ADMIN'));

ALTER TABLE public.skema_komisi ENABLE ROW LEVEL SECURITY;
CREATE POLICY skema_select ON public.skema_komisi FOR SELECT TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','SALES_MANAGER','ADMIN'));
CREATE POLICY skema_write ON public.skema_komisi FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT'));

ALTER TABLE public.komisi_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY komisi_select ON public.komisi_item FOR SELECT TO authenticated USING (public.lihat_staf(penerima_id) OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY komisi_write ON public.komisi_item FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT'));

ALTER TABLE public.kpi_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY kpi_select ON public.kpi_logs FOR SELECT TO authenticated USING (public.lihat_staf(pengguna_id) OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY kpi_insert ON public.kpi_logs FOR INSERT TO authenticated WITH CHECK (public.lihat_staf(pengguna_id));
CREATE POLICY kpi_write ON public.kpi_logs FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT'));

ALTER TABLE public.konten_ai ENABLE ROW LEVEL SECURITY;
CREATE POLICY konten_select ON public.konten_ai FOR SELECT TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','DIGITAL_MARKETING','SALES_MANAGER'));
CREATE POLICY konten_write ON public.konten_ai FOR ALL TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','DIGITAL_MARKETING')) WITH CHECK (public.peran_saya() IN ('DIREKSI','IT','DIGITAL_MARKETING'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pengguna TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_tl_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyek TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaksi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skema_komisi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.komisi_item TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.konten_ai TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

CREATE FUNCTION public.hitung_harga_unit_properti(
  p_luas_tanah numeric,
  p_metode_bayar public.metode_pembayaran
)
RETURNS TABLE (harga_cash_keras numeric, harga_final numeric, angsuran_per_bulan numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_harga_dasar_60m2 numeric := 166000000;
  v_biaya_kelebihan_per_m2 numeric := 1500000;
  v_kelebihan_lt numeric := 0;
  v_nilai_kelebihan numeric := 0;
  v_cash_keras numeric := 0;
  v_harga_akhir numeric := 0;
  v_angsuran numeric := 0;
BEGIN
  IF p_luas_tanah > 60 THEN
    v_kelebihan_lt := p_luas_tanah - 60;
  END IF;
  v_nilai_kelebihan := v_kelebihan_lt * v_biaya_kelebihan_per_m2;
  v_cash_keras := v_harga_dasar_60m2 + v_nilai_kelebihan;
  IF p_metode_bayar = 'CASH_KERAS' THEN
    v_harga_akhir := v_cash_keras;
    v_angsuran := 0;
  ELSIF p_metode_bayar = 'TEMPO_6' THEN
    v_harga_akhir := v_cash_keras + 11000000;
    v_angsuran := v_harga_akhir / 6;
  ELSIF p_metode_bayar = 'TEMPO_12' THEN
    v_harga_akhir := v_cash_keras + 22000000;
    v_angsuran := v_harga_akhir / 12;
  ELSE
    v_harga_akhir := v_cash_keras;
    v_angsuran := 0;
  END IF;
  RETURN QUERY SELECT v_cash_keras, v_harga_akhir, ROUND(v_angsuran, 2);
END;
$$;
REVOKE ALL ON FUNCTION public.hitung_harga_unit_properti(numeric, public.metode_pembayaran) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hitung_harga_unit_properti(numeric, public.metode_pembayaran) TO authenticated;

CREATE FUNCTION public.hitung_komisi_transaksi(p_transaksi_id uuid, p_calculated_by uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_proyek_id uuid;
  v_harga_jual numeric;
  v_metode_bayar public.metode_pembayaran;
  v_lead_origin public.origin_lead;
  v_sales_id uuid;
  v_tl_id uuid;
  v_sm_id uuid;
  v_admin_id uuid;
  v_dm_id uuid;
  v_dokumen_lengkap boolean;
  v_caller uuid := COALESCE(p_calculated_by, auth.uid());
  v_rate numeric;
  v_addon numeric;
  v_rate_tl numeric;
  v_rate_sm numeric;
  v_rate_admin numeric;
  v_rate_dm numeric;
BEGIN
  SELECT t.proyek_id, t.harga_jual, t.metode_bayar, l.origin, t.sales_id, t.dokumen_lengkap
  INTO v_proyek_id, v_harga_jual, v_metode_bayar, v_lead_origin, v_sales_id, v_dokumen_lengkap
  FROM public.transaksi t
  JOIN public.lead l ON t.lead_id = l.id
  WHERE t.id = p_transaksi_id;

  IF v_dokumen_lengkap IS NOT TRUE THEN
    RAISE EXCEPTION 'Perhitungan ditolak: Dokumen transaksi belum verified/lengkap.';
  END IF;

  DELETE FROM public.komisi_item WHERE transaksi_id = p_transaksi_id;

  v_rate := (
    SELECT s.rate_dasar FROM public.skema_komisi s
    WHERE s.proyek_id = v_proyek_id AND s.peran = 'SALES' AND s.origin = v_lead_origin
      AND s.berlaku_mulai <= current_date AND (s.berlaku_sampai IS NULL OR s.berlaku_sampai >= current_date)
    ORDER BY s.berlaku_mulai DESC LIMIT 1
  );
  IF v_rate IS NULL THEN
    v_rate := CASE v_lead_origin
      WHEN 'LM' THEN 0.0250
      WHEN 'LP' THEN 0.0125
      WHEN 'PP' THEN 0.0100
      WHEN 'HP' THEN 0.0075
      ELSE 0.0000
    END;
  END IF;

  v_addon := (
    SELECT s.addon_cash_keras FROM public.skema_komisi s
    WHERE s.proyek_id = v_proyek_id AND s.peran = 'SALES' AND s.origin = v_lead_origin
      AND s.berlaku_mulai <= current_date AND (s.berlaku_sampai IS NULL OR s.berlaku_sampai >= current_date)
    ORDER BY s.berlaku_mulai DESC LIMIT 1
  );
  IF v_addon IS NULL THEN
    v_addon := 0.0050;
  END IF;
  IF v_metode_bayar <> 'CASH_KERAS' THEN
    v_addon := 0;
  END IF;

  v_rate_tl := COALESCE((SELECT s.rate_dasar FROM public.skema_komisi s WHERE s.proyek_id = v_proyek_id AND s.peran = 'TEAM_LEADER' AND s.berlaku_mulai <= current_date AND (s.berlaku_sampai IS NULL OR s.berlaku_sampai >= current_date) ORDER BY s.berlaku_mulai DESC LIMIT 1), 0.0025);
  v_rate_sm := COALESCE((SELECT s.rate_dasar FROM public.skema_komisi s WHERE s.proyek_id = v_proyek_id AND s.peran = 'SALES_MANAGER' AND s.berlaku_mulai <= current_date AND (s.berlaku_sampai IS NULL OR s.berlaku_sampai >= current_date) ORDER BY s.berlaku_mulai DESC LIMIT 1), 0.0025);
  v_rate_admin := COALESCE((SELECT s.rate_dasar FROM public.skema_komisi s WHERE s.proyek_id = v_proyek_id AND s.peran = 'ADMIN' AND s.berlaku_mulai <= current_date AND (s.berlaku_sampai IS NULL OR s.berlaku_sampai >= current_date) ORDER BY s.berlaku_mulai DESC LIMIT 1), 0.0015);
  v_rate_dm := COALESCE((SELECT s.rate_dasar FROM public.skema_komisi s WHERE s.proyek_id = v_proyek_id AND s.peran = 'DIGITAL_MARKETING' AND s.berlaku_mulai <= current_date AND (s.berlaku_sampai IS NULL OR s.berlaku_sampai >= current_date) ORDER BY s.berlaku_mulai DESC LIMIT 1), 0.0025);

  INSERT INTO public.komisi_item (transaksi_id, penerima_id, peran, rate, nominal, status_pencairan, dibuat_pada, calculated_by)
  VALUES (p_transaksi_id, v_sales_id, 'SALES', v_rate + v_addon, v_harga_jual * (v_rate + v_addon), 'PENDING', now(), v_caller);

  SELECT team_leader_id INTO v_tl_id FROM public.pengguna WHERE id = v_sales_id;
  IF v_tl_id IS NOT NULL THEN
    INSERT INTO public.komisi_item (transaksi_id, penerima_id, peran, rate, nominal, status_pencairan, dibuat_pada, calculated_by)
    VALUES (p_transaksi_id, v_tl_id, 'TEAM_LEADER', v_rate_tl, v_harga_jual * v_rate_tl, 'PENDING', now(), v_caller);
  END IF;

  SELECT sm_id, admin_id INTO v_sm_id, v_admin_id FROM public.proyek WHERE id = v_proyek_id;
  IF v_sm_id IS NOT NULL THEN
    INSERT INTO public.komisi_item (transaksi_id, penerima_id, peran, rate, nominal, status_pencairan, dibuat_pada, calculated_by)
    VALUES (p_transaksi_id, v_sm_id, 'SALES_MANAGER', v_rate_sm, v_harga_jual * v_rate_sm, 'PENDING', now(), v_caller);
  END IF;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.komisi_item (transaksi_id, penerima_id, peran, rate, nominal, status_pencairan, dibuat_pada, calculated_by)
    VALUES (p_transaksi_id, v_admin_id, 'ADMIN', v_rate_admin, v_harga_jual * v_rate_admin, 'PENDING', now(), v_caller);
  END IF;

  IF v_lead_origin <> 'LM' THEN
    SELECT id INTO v_dm_id FROM public.pengguna WHERE peran = 'DIGITAL_MARKETING' AND aktif = true LIMIT 1;
    IF v_dm_id IS NOT NULL THEN
      INSERT INTO public.komisi_item (transaksi_id, penerima_id, peran, rate, nominal, status_pencairan, dibuat_pada, calculated_by)
      VALUES (p_transaksi_id, v_dm_id, 'DIGITAL_MARKETING', v_rate_dm, v_harga_jual * v_rate_dm, 'PENDING', now(), v_caller);
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.hitung_komisi_transaksi(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hitung_komisi_transaksi(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hitung_komisi_transaksi(uuid, uuid) TO service_role;
