ALTER TABLE public.pengguna ADD COLUMN IF NOT EXISTS staff_code text NOT NULL DEFAULT '';
ALTER TABLE public.pengguna ADD COLUMN IF NOT EXISTS sm_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.lihat_staf(_staf uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pengguna s
    JOIN public.pengguna m ON m.auth_user_id = auth.uid()
    WHERE s.id = _staf AND (
      s.auth_user_id = auth.uid()
      OR m.peran IN ('DIREKSI','IT')
      OR (m.peran = 'TEAM_LEADER' AND (s.id = m.id OR s.team_leader_id = m.id))
      OR (m.peran = 'SALES_MANAGER' AND (s.id = m.id OR s.sm_id = m.id OR EXISTS (SELECT 1 FROM public.pengguna t WHERE t.id = s.team_leader_id AND t.sm_id = m.id)))
      OR (m.peran = 'ADMIN' AND EXISTS (
        SELECT 1 FROM public.admin_tl_assignments a
        WHERE a.admin_id = m.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id)
      ))
    )
  )
$$;
REVOKE ALL ON FUNCTION public.lihat_staf(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lihat_staf(uuid) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.direktori_staf();
CREATE FUNCTION public.direktori_staf() RETURNS TABLE(pengguna_id uuid, peran public.role_pengguna, nama text, email text, staff_code text, team_leader_id uuid, sm_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, s.email, s.staff_code, s.team_leader_id, s.sm_id
  FROM public.pengguna s
  WHERE public.lihat_staf(s.id)
$$;
REVOKE ALL ON FUNCTION public.direktori_staf() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direktori_staf() TO authenticated;

DROP FUNCTION IF EXISTS public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text);
CREATE FUNCTION public.buat_lead(_nama text, _telepon text, _alamat text, _sumber text, _origin public.origin_lead, _tahap public.status_pipeline, _proyek uuid, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  result uuid;
  v_pemilik uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','TEAM_LEADER','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  IF length(trim(_nama)) NOT BETWEEN 1 AND 200 OR length(_telepon) NOT BETWEEN 6 AND 30 OR length(_alamat) NOT BETWEEN 1 AND 500 OR length(_catatan) > 2000 THEN RAISE EXCEPTION 'Invalid lead fields'; END IF;
  v_pemilik := COALESCE(_pemilik, r.id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','TEAM_LEADER') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  INSERT INTO public.lead (kode, nama, telepon, alamat, sumber_lead, origin, tahap, proyek_id, pemilik_id, catatan)
  VALUES ('L-' || replace(gen_random_uuid()::text, '-', ''), trim(_nama), _telepon, _alamat, _sumber, _origin, _tahap, _proyek, v_pemilik, _catatan)
  RETURNING id INTO result;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan)
  VALUES (v_pemilik, _proyek, result, _sumber, _catatan);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text);
CREATE FUNCTION public.simpan_lead(_id uuid, _nama text, _telepon text, _alamat text, _sumber text, _tahap public.status_pipeline, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  l public.lead;
  v_pemilik uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','TEAM_LEADER','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  v_pemilik := COALESCE(_pemilik, l.pemilik_id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','TEAM_LEADER') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  UPDATE public.lead SET nama = trim(_nama), telepon = _telepon, alamat = _alamat, sumber_lead = _sumber, tahap = _tahap, catatan = _catatan, pemilik_id = v_pemilik, diubah_pada = now(), diverifikasi_oleh = NULL, diverifikasi_pada = NULL WHERE id = _id;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan) VALUES (v_pemilik, l.proyek_id, _id, _sumber, _catatan);
  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.laporan_staf() RETURNS TABLE(user_id uuid, role public.role_pengguna, staff_name text, staff_code text, tl_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, s.staff_code, s.team_leader_id
  FROM public.pengguna s
  JOIN public.pengguna r ON r.auth_user_id = auth.uid()
  WHERE (r.peran = 'SALES' AND s.id = r.id)
     OR (r.peran = 'TEAM_LEADER' AND (s.id = r.id OR s.team_leader_id = r.id))
     OR (r.peran = 'ADMIN' AND (s.id = r.id OR EXISTS (SELECT 1 FROM public.admin_tl_assignments a WHERE a.admin_id = r.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id))))
     OR (r.peran = 'SALES_MANAGER' AND (s.id = r.id OR s.sm_id = r.id OR EXISTS (SELECT 1 FROM public.pengguna t WHERE t.id = s.team_leader_id AND t.sm_id = r.id)))
     OR (r.peran IN ('DIREKSI','IT') AND s.peran IN ('SALES','TEAM_LEADER'))
$$;
REVOKE ALL ON FUNCTION public.laporan_staf() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_staf() TO authenticated;