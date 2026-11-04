ALTER TABLE public.lead ADD COLUMN IF NOT EXISTS nilai_lead numeric NOT NULL DEFAULT 0 CHECK (nilai_lead >= 0);
ALTER TABLE public.lead ADD COLUMN IF NOT EXISTS diverifikasi_oleh uuid REFERENCES public.pengguna(id) ON DELETE SET NULL;
ALTER TABLE public.lead ADD COLUMN IF NOT EXISTS diverifikasi_pada timestamptz;

CREATE FUNCTION public.punya_peran(_uid uuid, _peran public.role_pengguna) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.pengguna p WHERE p.id = _uid AND p.peran = _peran)
$$;
REVOKE ALL ON FUNCTION public.punya_peran(uuid, public.role_pengguna) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.punya_peran(uuid, public.role_pengguna) TO authenticated, service_role;

CREATE FUNCTION public.fitur_akses(_fitur text, _tulis boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pengguna r
    WHERE r.auth_user_id = auth.uid() AND (
      r.peran = 'IT' OR CASE _fitur
        WHEN 'team' THEN r.peran IN ('TEAM_LEADER','SALES_MANAGER','DIREKSI')
        WHEN 'verification' THEN CASE WHEN _tulis THEN r.peran = 'ADMIN' ELSE r.peran IN ('ADMIN','SALES_MANAGER') END
        WHEN 'content' THEN CASE WHEN _tulis THEN r.peran = 'DIGITAL_MARKETING' ELSE r.peran IN ('DIGITAL_MARKETING','SALES_MANAGER','DIREKSI') END
        WHEN 'projects' THEN CASE WHEN _tulis THEN r.peran IN ('TEAM_LEADER','SALES_MANAGER') ELSE r.peran IN ('TEAM_LEADER','SALES_MANAGER','DIREKSI') END
        WHEN 'portfolio' THEN r.peran = 'DIREKSI'
        ELSE false END
    )
  )
$$;
REVOKE ALL ON FUNCTION public.fitur_akses(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fitur_akses(text, boolean) TO authenticated, service_role;

CREATE TABLE public.aktivitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  proyek_id uuid REFERENCES public.proyek(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.lead(id) ON DELETE SET NULL,
  jenis text NOT NULL,
  catatan text NOT NULL DEFAULT '',
  terjadi_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL DEFAULT public.pengguna_saya(),
  proyek_id uuid REFERENCES public.proyek(id) ON DELETE SET NULL,
  judul text NOT NULL CHECK (length(judul) BETWEEN 1 AND 200),
  jenis text NOT NULL CHECK (jenis IN ('survey','tour','follow_up')),
  mulai_pada timestamptz NOT NULL,
  lokasi text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','done','cancelled')),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pengingat_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agenda(id) ON DELETE CASCADE,
  penerima_id uuid NOT NULL,
  jenis text NOT NULL CHECK (jenis IN ('h_minus_1','day_of')),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  dibaca_pada timestamptz,
  UNIQUE (agenda_id, penerima_id, jenis)
);

CREATE TABLE public.pekerjaan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pemilik_id uuid NOT NULL DEFAULT public.pengguna_saya(),
  proyek_id uuid REFERENCES public.proyek(id) ON DELETE SET NULL,
  fitur text NOT NULL CHECK (fitur IN ('team','verification','content','projects','portfolio')),
  judul text NOT NULL CHECK (length(judul) BETWEEN 1 AND 200),
  catatan text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.log_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aktor_id uuid,
  aksi text NOT NULL,
  record_id uuid,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.permintaan_perubahan_lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.lead(id) ON DELETE CASCADE,
  diminta_oleh uuid NOT NULL DEFAULT public.pengguna_saya(),
  usulan jsonb NOT NULL,
  alasan text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','applied','rejected')),
  disetujui_oleh uuid,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diterapkan_pada timestamptz
);

CREATE TABLE public.tautan_analitik (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 100),
  url text NOT NULL CHECK (url LIKE 'https://%'),
  dibuat_oleh uuid NOT NULL DEFAULT public.pengguna_saya()
);

CREATE INDEX idx_aktivitas_pengguna_tanggal ON public.aktivitas (pengguna_id, terjadi_pada);
CREATE INDEX idx_agenda_pengguna_mulai ON public.agenda (pengguna_id, mulai_pada);
CREATE INDEX idx_pekerjaan_fitur ON public.pekerjaan (fitur, pemilik_id, proyek_id);
ALTER TABLE public.aktivitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY aktivitas_select ON public.aktivitas FOR SELECT TO authenticated USING (public.lihat_staf(pengguna_id) OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY aktivitas_insert ON public.aktivitas FOR INSERT TO authenticated WITH CHECK (public.lihat_staf(pengguna_id));

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY agenda_select ON public.agenda FOR SELECT TO authenticated USING (public.lihat_staf(pengguna_id) OR public.peran_saya() IN ('DIREKSI','IT') OR (proyek_id IS NOT NULL AND public.lihat_proyek(proyek_id)));
CREATE POLICY agenda_insert ON public.agenda FOR INSERT TO authenticated WITH CHECK (public.lihat_staf(pengguna_id));
CREATE POLICY agenda_update ON public.agenda FOR UPDATE TO authenticated USING (pengguna_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (pengguna_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));

ALTER TABLE public.pengingat_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY pengingat_select ON public.pengingat_agenda FOR SELECT TO authenticated USING (penerima_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY pengingat_update ON public.pengingat_agenda FOR UPDATE TO authenticated USING (penerima_id = public.pengguna_saya()) WITH CHECK (penerima_id = public.pengguna_saya());

ALTER TABLE public.pekerjaan ENABLE ROW LEVEL SECURITY;
CREATE POLICY pekerjaan_select ON public.pekerjaan FOR SELECT TO authenticated USING (public.fitur_akses(fitur, false) AND public.lihat_staf(pemilik_id));
CREATE POLICY pekerjaan_insert ON public.pekerjaan FOR INSERT TO authenticated WITH CHECK (public.fitur_akses(fitur, true) AND public.lihat_staf(pemilik_id));
CREATE POLICY pekerjaan_update ON public.pekerjaan FOR UPDATE TO authenticated USING (pemilik_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT')) WITH CHECK (pemilik_id = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT'));

ALTER TABLE public.log_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_select ON public.log_audit FOR SELECT TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT'));
CREATE POLICY audit_insert ON public.log_audit FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.permintaan_perubahan_lead ENABLE ROW LEVEL SECURITY;
CREATE POLICY perubahan_select ON public.permintaan_perubahan_lead FOR SELECT TO authenticated USING (diminta_oleh = public.pengguna_saya() OR public.peran_saya() IN ('DIREKSI','IT') OR (public.peran_saya() = 'SALES_MANAGER' AND EXISTS (SELECT 1 FROM public.lead l WHERE l.id = lead_id AND public.lihat_proyek(l.proyek_id))));
CREATE POLICY perubahan_insert ON public.permintaan_perubahan_lead FOR INSERT TO authenticated WITH CHECK (public.peran_saya() = 'IT' AND diminta_oleh = public.pengguna_saya());

ALTER TABLE public.tautan_analitik ENABLE ROW LEVEL SECURITY;
CREATE POLICY tautan_select ON public.tautan_analitik FOR SELECT TO authenticated USING (public.peran_saya() IN ('DIREKSI','IT','DIGITAL_MARKETING','SALES_MANAGER'));
CREATE POLICY tautan_insert ON public.tautan_analitik FOR INSERT TO authenticated WITH CHECK (dibuat_oleh = public.pengguna_saya() AND public.peran_saya() IN ('SALES_MANAGER','IT','DIREKSI'));
CREATE POLICY tautan_update ON public.tautan_analitik FOR UPDATE TO authenticated USING (public.peran_saya() IN ('SALES_MANAGER','IT','DIREKSI')) WITH CHECK (public.peran_saya() IN ('SALES_MANAGER','IT','DIREKSI'));
CREATE POLICY tautan_delete ON public.tautan_analitik FOR DELETE TO authenticated USING (public.peran_saya() IN ('SALES_MANAGER','IT','DIREKSI'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aktivitas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda TO authenticated;
GRANT SELECT, UPDATE ON public.pengingat_agenda TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pekerjaan TO authenticated;
GRANT SELECT, INSERT ON public.log_audit TO authenticated;
GRANT SELECT, INSERT ON public.permintaan_perubahan_lead TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tautan_analitik TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

CREATE FUNCTION public.direktori_staf() RETURNS TABLE(pengguna_id uuid, peran public.role_pengguna, nama text, email text, team_leader_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, s.email, s.team_leader_id
  FROM public.pengguna s
  WHERE public.lihat_staf(s.id)
$$;
REVOKE ALL ON FUNCTION public.direktori_staf() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direktori_staf() TO authenticated;

CREATE FUNCTION public.buat_lead(_nama text, _telepon text, _alamat text, _sumber text, _origin public.origin_lead, _tahap public.status_pipeline, _proyek uuid, _catatan text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  result uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','TEAM_LEADER','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  IF length(trim(_nama)) NOT BETWEEN 1 AND 200 OR length(_telepon) NOT BETWEEN 6 AND 30 OR length(_alamat) NOT BETWEEN 1 AND 500 OR length(_catatan) > 2000 THEN RAISE EXCEPTION 'Invalid lead fields'; END IF;
  INSERT INTO public.lead (kode, nama, telepon, alamat, sumber_lead, origin, tahap, proyek_id, pemilik_id, catatan)
  VALUES ('L-' || replace(gen_random_uuid()::text, '-', ''), trim(_nama), _telepon, _alamat, _sumber, _origin, _tahap, _proyek, r.id, _catatan)
  RETURNING id INTO result;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan)
  VALUES (r.id, _proyek, result, _sumber, _catatan);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text) TO authenticated;

CREATE FUNCTION public.simpan_lead(_id uuid, _nama text, _telepon text, _alamat text, _sumber text, _tahap public.status_pipeline, _catatan text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  l public.lead;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','TEAM_LEADER','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  UPDATE public.lead SET nama = trim(_nama), telepon = _telepon, alamat = _alamat, sumber_lead = _sumber, tahap = _tahap, catatan = _catatan, diubah_pada = now(), diverifikasi_oleh = NULL, diverifikasi_pada = NULL WHERE id = _id;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan) VALUES (r.id, l.proyek_id, _id, _sumber, _catatan);
  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text) TO authenticated;

CREATE FUNCTION public.verifikasi_lead(_id uuid, _nilai numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pengguna; l public.lead;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('TEAM_LEADER','ADMIN') OR _nilai < 0 THEN RAISE EXCEPTION 'Verification denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  UPDATE public.lead SET nilai_lead = _nilai, diverifikasi_oleh = r.id, diverifikasi_pada = now() WHERE id = _id;
END;
$$;
REVOKE ALL ON FUNCTION public.verifikasi_lead(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verifikasi_lead(uuid, numeric) TO authenticated;

CREATE FUNCTION public.minta_perubahan_lead(_lead uuid, _usulan jsonb, _alasan text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pengguna; result uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran <> 'IT' OR NOT EXISTS (SELECT 1 FROM public.lead WHERE id = _lead) THEN RAISE EXCEPTION 'Maintenance access denied'; END IF;
  IF length(trim(_alasan)) NOT BETWEEN 1 AND 2000 OR jsonb_typeof(_usulan) <> 'object' OR length(trim(_usulan->>'nama')) NOT BETWEEN 1 AND 200 OR length(_usulan->>'telepon') NOT BETWEEN 6 AND 30 OR length(_usulan->>'alamat') NOT BETWEEN 1 AND 500 OR (_usulan->>'tahap') NOT IN ('NA','NO','ENG','LEAD','QL','HOT','VISIT','BOOK','CV','NURTURE','LOST') OR NOT (_usulan ?& ARRAY['nama','telepon','alamat','sumber_lead','tahap']) THEN RAISE EXCEPTION 'Invalid change request'; END IF;
  INSERT INTO public.permintaan_perubahan_lead (lead_id, diminta_oleh, usulan, alasan)
  VALUES (_lead, r.id, jsonb_build_object('nama', trim(_usulan->>'nama'), 'telepon', _usulan->>'telepon', 'alamat', _usulan->>'alamat', 'sumber_lead', _usulan->>'sumber_lead', 'tahap', _usulan->>'tahap'), trim(_alasan))
  RETURNING id INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.minta_perubahan_lead(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.minta_perubahan_lead(uuid, jsonb, text) TO authenticated;

CREATE FUNCTION public.tinjau_perubahan_lead(_req uuid, _setuju boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pengguna;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran <> 'SALES_MANAGER' THEN RAISE EXCEPTION 'SM approval required'; END IF;
  UPDATE public.permintaan_perubahan_lead q SET status = CASE WHEN _setuju THEN 'approved' ELSE 'rejected' END, disetujui_oleh = r.id
  WHERE q.id = _req AND q.status = 'pending' AND EXISTS (SELECT 1 FROM public.lead l WHERE l.id = q.lead_id AND public.lihat_proyek(l.proyek_id));
  IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.tinjau_perubahan_lead(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tinjau_perubahan_lead(uuid, boolean) TO authenticated;

CREATE FUNCTION public.terapkan_perubahan_lead(_req uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pengguna; q public.permintaan_perubahan_lead; p jsonb;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran <> 'IT' THEN RAISE EXCEPTION 'Maintenance access denied'; END IF;
  SELECT * INTO q FROM public.permintaan_perubahan_lead WHERE id = _req AND diminta_oleh = r.id AND status = 'approved' FOR UPDATE;
  IF q.id IS NULL OR NOT public.punya_peran(q.disetujui_oleh, 'SALES_MANAGER') THEN RAISE EXCEPTION 'SM approval required'; END IF;
  p := q.usulan;
  UPDATE public.lead SET nama = p->>'nama', telepon = p->>'telepon', alamat = p->>'alamat', sumber_lead = p->>'sumber_lead', tahap = (p->>'tahap')::public.status_pipeline, diubah_pada = now(), diverifikasi_oleh = NULL, diverifikasi_pada = NULL WHERE id = q.lead_id;
  UPDATE public.permintaan_perubahan_lead SET status = 'applied', diterapkan_pada = now() WHERE id = q.id;
END;
$$;
REVOKE ALL ON FUNCTION public.terapkan_perubahan_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.terapkan_perubahan_lead(uuid) TO authenticated;

CREATE FUNCTION public.generate_pengingat_agenda() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.pengingat_agenda (agenda_id, penerima_id, jenis)
  SELECT e.id, e.pengguna_id, CASE WHEN (e.mulai_pada AT TIME ZONE 'Asia/Jakarta')::date = (now() AT TIME ZONE 'Asia/Jakarta')::date THEN 'day_of' ELSE 'h_minus_1' END
  FROM public.agenda e
  WHERE e.status = 'active' AND (e.mulai_pada AT TIME ZONE 'Asia/Jakarta')::date IN ((now() AT TIME ZONE 'Asia/Jakarta')::date, (now() AT TIME ZONE 'Asia/Jakarta')::date + 1)
  ON CONFLICT (agenda_id, penerima_id, jenis) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_pengingat_agenda() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_pengingat_agenda() TO service_role;

CREATE FUNCTION public.laporan_staf() RETURNS TABLE(pengguna_id uuid, peran public.role_pengguna, nama text, team_leader_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, s.team_leader_id
  FROM public.pengguna s
  JOIN public.pengguna r ON r.auth_user_id = auth.uid()
  WHERE (r.peran = 'SALES' AND s.id = r.id)
     OR (r.peran = 'TEAM_LEADER' AND (s.id = r.id OR s.team_leader_id = r.id))
     OR (r.peran = 'ADMIN' AND (s.id = r.id OR EXISTS (SELECT 1 FROM public.admin_tl_assignments a WHERE a.admin_id = r.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id))))
     OR (r.peran = 'SALES_MANAGER' AND s.peran IN ('SALES','TEAM_LEADER'))
     OR (r.peran IN ('DIREKSI','IT') AND s.peran IN ('SALES','TEAM_LEADER'))
$$;
REVOKE ALL ON FUNCTION public.laporan_staf() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_staf() TO authenticated;

CREATE FUNCTION public.laporan_data(_hari date, _pemilik uuid[] DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE owners uuid[]; start_at timestamptz; result jsonb;
BEGIN
  IF NOT (public.peran_saya() IN ('SALES','TEAM_LEADER','SALES_MANAGER','ADMIN','DIREKSI','IT')) THEN RAISE EXCEPTION 'Daily report access denied'; END IF;
  IF _hari IS NULL THEN RAISE EXCEPTION 'Report date required'; END IF;
  IF _pemilik IS NOT NULL AND (cardinality(_pemilik) = 0 OR EXISTS (SELECT 1 FROM unnest(_pemilik) id WHERE id IS NULL OR NOT EXISTS (SELECT 1 FROM public.laporan_staf() s WHERE s.pengguna_id = id))) THEN RAISE EXCEPTION 'Staff selection outside report hierarchy'; END IF;
  SELECT coalesce(array_agg(s.pengguna_id), ARRAY[]::uuid[]) INTO owners FROM public.laporan_staf() s WHERE _pemilik IS NULL OR s.pengguna_id = ANY(_pemilik);
  start_at := _hari::timestamp AT TIME ZONE 'Asia/Jakarta';
  SELECT jsonb_build_object(
    'staff', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.laporan_staf() s WHERE s.pengguna_id = ANY(owners)), '[]'::jsonb),
    'activities', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.terjadi_pada) FROM public.aktivitas a WHERE a.pengguna_id = ANY(owners) AND a.terjadi_pada >= start_at AND a.terjadi_pada < start_at + interval '1 day'), '[]'::jsonb),
    'leads', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'owner_id', l.pemilik_id, 'nickname', l.nama, 'status', l.tahap, 'source', l.sumber_lead, 'created_at', l.dibuat_pada) ORDER BY l.dibuat_pada) FROM public.lead l WHERE l.pemilik_id = ANY(owners) AND l.dibuat_pada >= start_at AND l.dibuat_pada < start_at + interval '1 day'), '[]'::jsonb),
    'kpis', coalesce((SELECT jsonb_agg(jsonb_build_object('id', k.id, 'owner_id', k.pengguna_id, 'metric', k.jenis_aktivitas, 'value', k.skor, 'logged_on', k.dibuat_pada::date)) FROM public.kpi_logs k WHERE k.pengguna_id = ANY(owners) AND k.dibuat_pada::date = _hari), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.laporan_data(date, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_data(date, uuid[]) TO authenticated;

CREATE FUNCTION public.catat_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.log_audit (aktor_id, aksi, record_id) VALUES (public.pengguna_saya(), TG_TABLE_NAME || ':' || TG_OP, NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.catat_audit() FROM PUBLIC;
CREATE TRIGGER audit_lead AFTER INSERT OR UPDATE ON public.lead FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_transaksi AFTER INSERT OR UPDATE ON public.transaksi FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_agenda AFTER INSERT OR UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_pengguna AFTER INSERT OR UPDATE ON public.pengguna FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_perubahan AFTER INSERT OR UPDATE ON public.permintaan_perubahan_lead FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_tautan AFTER INSERT OR UPDATE ON public.tautan_analitik FOR EACH ROW EXECUTE FUNCTION public.catat_audit();

CREATE FUNCTION public.laporan_staf() RETURNS TABLE(pengguna_id uuid, peran public.role_pengguna, nama text, team_leader_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, s.team_leader_id
  FROM public.pengguna s
  JOIN public.pengguna r ON r.auth_user_id = auth.uid()
  WHERE (r.peran = 'SALES' AND s.id = r.id)
     OR (r.peran = 'TEAM_LEADER' AND (s.id = r.id OR s.team_leader_id = r.id))
     OR (r.peran = 'ADMIN' AND (s.id = r.id OR EXISTS (SELECT 1 FROM public.admin_tl_assignments a WHERE a.admin_id = r.id AND (a.team_leader_id = s.id OR a.team_leader_id = s.team_leader_id))))
     OR (r.peran = 'SALES_MANAGER' AND s.peran IN ('SALES','TEAM_LEADER'))
     OR (r.peran IN ('DIREKSI','IT') AND s.peran IN ('SALES','TEAM_LEADER'))
$$;
REVOKE ALL ON FUNCTION public.laporan_staf() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_staf() TO authenticated;

CREATE FUNCTION public.laporan_data(_hari date, _pemilik uuid[] DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE owners uuid[]; start_at timestamptz; result jsonb;
BEGIN
  IF NOT (public.peran_saya() IN ('SALES','TEAM_LEADER','SALES_MANAGER','ADMIN','DIREKSI','IT')) THEN RAISE EXCEPTION 'Daily report access denied'; END IF;
  IF _hari IS NULL THEN RAISE EXCEPTION 'Report date required'; END IF;
  IF _pemilik IS NOT NULL AND (cardinality(_pemilik) = 0 OR EXISTS (SELECT 1 FROM unnest(_pemilik) id WHERE id IS NULL OR NOT EXISTS (SELECT 1 FROM public.laporan_staf() s WHERE s.pengguna_id = id))) THEN RAISE EXCEPTION 'Staff selection outside report hierarchy'; END IF;
  SELECT coalesce(array_agg(s.pengguna_id), ARRAY[]::uuid[]) INTO owners FROM public.laporan_staf() s WHERE _pemilik IS NULL OR s.pengguna_id = ANY(_pemilik);
  start_at := _hari::timestamp AT TIME ZONE 'Asia/Jakarta';
  SELECT jsonb_build_object(
    'staff', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.laporan_staf() s WHERE s.pengguna_id = ANY(owners)), '[]'::jsonb),
    'activities', coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.terjadi_pada) FROM public.aktivitas a WHERE a.pengguna_id = ANY(owners) AND a.terjadi_pada >= start_at AND a.terjadi_pada < start_at + interval '1 day'), '[]'::jsonb),
    'leads', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'owner_id', l.pemilik_id, 'nickname', l.nama, 'status', l.tahap, 'source', l.sumber_lead, 'created_at', l.dibuat_pada) ORDER BY l.dibuat_pada) FROM public.lead l WHERE l.pemilik_id = ANY(owners) AND l.dibuat_pada >= start_at AND l.dibuat_pada < start_at + interval '1 day'), '[]'::jsonb),
    'kpis', coalesce((SELECT jsonb_agg(jsonb_build_object('id', k.id, 'owner_id', k.pengguna_id, 'metric', k.jenis_aktivitas, 'value', k.skor, 'logged_on', k.dibuat_pada::date)) FROM public.kpi_logs k WHERE k.pengguna_id = ANY(owners) AND k.dibuat_pada::date = _hari), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.laporan_data(date, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_data(date, uuid[]) TO authenticated;

CREATE FUNCTION public.catat_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.log_audit (aktor_id, aksi, record_id) VALUES (public.pengguna_saya(), TG_TABLE_NAME || ':' || TG_OP, NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.catat_audit() FROM PUBLIC;
CREATE TRIGGER audit_lead AFTER INSERT OR UPDATE ON public.lead FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_transaksi AFTER INSERT OR UPDATE ON public.transaksi FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_agenda AFTER INSERT OR UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_pengguna AFTER INSERT OR UPDATE ON public.pengguna FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_perubahan AFTER INSERT OR UPDATE ON public.permintaan_perubahan_lead FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
CREATE TRIGGER audit_tautan AFTER INSERT OR UPDATE ON public.tautan_analitik FOR EACH ROW EXECUTE FUNCTION public.catat_audit();
