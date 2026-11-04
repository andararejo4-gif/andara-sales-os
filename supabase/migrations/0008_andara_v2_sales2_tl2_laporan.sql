CREATE OR REPLACE FUNCTION public.lihat_staf(_staf uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pengguna s
    JOIN public.pengguna m ON m.auth_user_id = auth.uid()
    WHERE s.id = _staf AND (
      s.auth_user_id = auth.uid()
      OR m.peran IN ('DIREKSI','IT')
      OR (m.peran IN ('TEAM_LEADER','TL_2') AND (s.id = m.id OR s.team_leader_id = m.id))
      OR (m.peran = 'SALES_MANAGER' AND (s.id = m.id OR s.sm_id = m.id OR EXISTS (SELECT 1 FROM public.pengguna t WHERE t.id = s.team_leader_id AND t.sm_id = m.id)))
      OR (m.peran = 'ADMIN' AND EXISTS (
        SELECT 1 FROM public.admin_tl_assignments a
        WHERE a.admin_id = m.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id)
      ))
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.fitur_akses(_fitur text, _tulis boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pengguna r
    WHERE r.auth_user_id = auth.uid() AND (
      r.peran = 'IT' OR CASE _fitur
        WHEN 'team' THEN r.peran IN ('TEAM_LEADER','TL_2','SALES_MANAGER','DIREKSI')
        WHEN 'verification' THEN CASE WHEN _tulis THEN r.peran = 'ADMIN' ELSE r.peran IN ('ADMIN','SALES_MANAGER') END
        WHEN 'content' THEN CASE WHEN _tulis THEN r.peran = 'DIGITAL_MARKETING' ELSE r.peran IN ('DIGITAL_MARKETING','SALES_MANAGER','DIREKSI') END
        WHEN 'projects' THEN CASE WHEN _tulis THEN r.peran IN ('TEAM_LEADER','TL_2','SALES_MANAGER') ELSE r.peran IN ('TEAM_LEADER','TL_2','SALES_MANAGER','DIREKSI') END
        WHEN 'portfolio' THEN r.peran = 'DIREKSI'
        ELSE false END
    )
  )
$$;

DROP POLICY IF EXISTS unit_select ON public.unit;
CREATE POLICY unit_select ON public.unit FOR SELECT TO authenticated USING (public.lihat_proyek(proyek_id) OR public.peran_saya() IN ('TEAM_LEADER','TL_2','SALES','SALES_2'));
DROP POLICY IF EXISTS lead_insert ON public.lead;
CREATE POLICY lead_insert ON public.lead FOR INSERT TO authenticated WITH CHECK (public.peran_saya() IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER') AND public.lihat_staf(pemilik_id));
DROP POLICY IF EXISTS transaksi_insert ON public.transaksi;
CREATE POLICY transaksi_insert ON public.transaksi FOR INSERT TO authenticated WITH CHECK (public.peran_saya() IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER','ADMIN') AND public.lihat_staf(sales_id));

CREATE OR REPLACE FUNCTION public.buat_lead(_nama text, _telepon text, _alamat text, _sumber text, _origin public.origin_lead, _tahap public.status_pipeline, _proyek uuid, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  result uuid;
  v_pemilik uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  IF length(trim(_nama)) NOT BETWEEN 1 AND 200 OR length(_telepon) NOT BETWEEN 6 AND 30 OR length(_alamat) NOT BETWEEN 1 AND 500 OR length(_catatan) > 2000 THEN RAISE EXCEPTION 'Invalid lead fields'; END IF;
  v_pemilik := COALESCE(_pemilik, r.id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  INSERT INTO public.lead (kode, nama, telepon, alamat, sumber_lead, origin, tahap, proyek_id, pemilik_id, catatan)
  VALUES ('L-' || replace(gen_random_uuid()::text, '-', ''), trim(_nama), _telepon, _alamat, _sumber, _origin, _tahap, _proyek, v_pemilik, _catatan)
  RETURNING id INTO result;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan)
  VALUES (v_pemilik, _proyek, result, _sumber, _catatan);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.simpan_lead(_id uuid, _nama text, _telepon text, _alamat text, _sumber text, _tahap public.status_pipeline, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  l public.lead;
  v_pemilik uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  v_pemilik := COALESCE(_pemilik, l.pemilik_id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  UPDATE public.lead SET nama = trim(_nama), telepon = _telepon, alamat = _alamat, sumber_lead = _sumber, tahap = _tahap, catatan = _catatan, pemilik_id = v_pemilik, diubah_pada = now(), diverifikasi_oleh = NULL, diverifikasi_pada = NULL WHERE id = _id;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan) VALUES (v_pemilik, l.proyek_id, _id, _sumber, _catatan);
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verifikasi_lead(_id uuid, _nilai numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pengguna; l public.lead;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('TEAM_LEADER','TL_2','ADMIN') OR _nilai < 0 THEN RAISE EXCEPTION 'Verification denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  UPDATE public.lead SET nilai_lead = _nilai, diverifikasi_oleh = r.id, diverifikasi_pada = now() WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.laporan_staf() RETURNS TABLE(user_id uuid, role public.role_pengguna, staff_name text, staff_code text, tl_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, s.staff_code, s.team_leader_id
  FROM public.pengguna s
  JOIN public.pengguna r ON r.auth_user_id = auth.uid()
  WHERE (r.peran IN ('SALES','SALES_2') AND s.id = r.id)
     OR (r.peran IN ('TEAM_LEADER','TL_2') AND (s.id = r.id OR s.team_leader_id = r.id))
     OR (r.peran = 'ADMIN' AND (s.id = r.id OR EXISTS (SELECT 1 FROM public.admin_tl_assignments a WHERE a.admin_id = r.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id))))
     OR (r.peran = 'SALES_MANAGER' AND (s.id = r.id OR s.sm_id = r.id OR EXISTS (SELECT 1 FROM public.pengguna t WHERE t.id = s.team_leader_id AND t.sm_id = r.id)))
     OR (r.peran IN ('DIREKSI','IT') AND s.peran IN ('SALES','SALES_2','TEAM_LEADER','TL_2'))
$$;

DROP FUNCTION IF EXISTS public.laporan_data(date, uuid[]);
CREATE FUNCTION public.laporan_data(_dari date, _sampai date, _pemilik uuid[] DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE owners uuid[]; start_at timestamptz; end_at timestamptz; result jsonb;
BEGIN
  IF NOT (public.peran_saya() IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER','ADMIN','DIREKSI','IT')) THEN RAISE EXCEPTION 'Report access denied'; END IF;
  IF _dari IS NULL OR _sampai IS NULL OR _sampai < _dari OR _sampai - _dari > 366 THEN RAISE EXCEPTION 'Invalid report range'; END IF;
  IF _pemilik IS NOT NULL AND (cardinality(_pemilik) = 0 OR EXISTS (SELECT 1 FROM unnest(_pemilik) id WHERE id IS NULL OR NOT EXISTS (SELECT 1 FROM public.laporan_staf() s WHERE s.user_id = id))) THEN RAISE EXCEPTION 'Staff selection outside report hierarchy'; END IF;
  SELECT coalesce(array_agg(s.user_id), ARRAY[]::uuid[]) INTO owners FROM public.laporan_staf() s WHERE _pemilik IS NULL OR s.user_id = ANY(_pemilik);
  start_at := _dari::timestamp AT TIME ZONE 'Asia/Jakarta';
  end_at := (_sampai + 1)::timestamp AT TIME ZONE 'Asia/Jakarta';
  SELECT jsonb_build_object(
    'staff', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.laporan_staf() s WHERE s.user_id = ANY(owners)), '[]'::jsonb),
    'activities', coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'owner_id', a.pengguna_id, 'kind', a.jenis, 'note', a.catatan, 'occurred_at', a.terjadi_pada) ORDER BY a.terjadi_pada) FROM public.aktivitas a WHERE a.pengguna_id = ANY(owners) AND a.terjadi_pada >= start_at AND a.terjadi_pada < end_at), '[]'::jsonb),
    'leads', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'owner_id', l.pemilik_id, 'nickname', l.nama, 'status', l.tahap, 'source', l.sumber_lead, 'created_at', l.dibuat_pada) ORDER BY l.dibuat_pada) FROM public.lead l WHERE l.pemilik_id = ANY(owners) AND l.dibuat_pada >= start_at AND l.dibuat_pada < end_at), '[]'::jsonb),
    'kpis', coalesce((SELECT jsonb_agg(jsonb_build_object('id', k.id, 'owner_id', k.pengguna_id, 'metric', k.jenis_aktivitas, 'value', k.skor, 'logged_on', (k.dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date)) FROM public.kpi_logs k WHERE k.pengguna_id = ANY(owners) AND k.dibuat_pada >= start_at AND k.dibuat_pada < end_at), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.laporan_data(date, date, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_data(date, date, uuid[]) TO authenticated;