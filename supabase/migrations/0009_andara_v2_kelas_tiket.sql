ALTER TABLE public.lead ADD COLUMN IF NOT EXISTS kelas_tiket text NOT NULL DEFAULT 'REGULER' CHECK (kelas_tiket IN ('REGULER','BESAR'));
CREATE INDEX IF NOT EXISTS idx_lead_kelas ON public.lead (pemilik_id, kelas_tiket);

CREATE OR REPLACE FUNCTION public.ambang_tiket_besar() RETURNS numeric LANGUAGE sql IMMUTABLE AS $$ SELECT 500000000::numeric $$;
GRANT EXECUTE ON FUNCTION public.ambang_tiket_besar() TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid);
CREATE FUNCTION public.buat_lead(_nama text, _telepon text, _alamat text, _sumber text, _origin public.origin_lead, _tahap public.status_pipeline, _proyek uuid, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL, _kelas text DEFAULT 'REGULER') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  result uuid;
  v_pemilik uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  IF _kelas NOT IN ('REGULER','BESAR') THEN RAISE EXCEPTION 'Invalid ticket class'; END IF;
  IF length(trim(_nama)) NOT BETWEEN 1 AND 200 OR length(_telepon) NOT BETWEEN 6 AND 30 OR length(_alamat) NOT BETWEEN 1 AND 500 OR length(_catatan) > 2000 THEN RAISE EXCEPTION 'Invalid lead fields'; END IF;
  v_pemilik := COALESCE(_pemilik, r.id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  INSERT INTO public.lead (kode, nama, telepon, alamat, sumber_lead, origin, tahap, proyek_id, pemilik_id, catatan, kelas_tiket)
  VALUES ('L-' || replace(gen_random_uuid()::text, '-', ''), trim(_nama), _telepon, _alamat, _sumber, _origin, _tahap, _proyek, v_pemilik, _catatan, _kelas)
  RETURNING id INTO result;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan)
  VALUES (v_pemilik, _proyek, result, _sumber, _catatan);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verifikasi_lead(_id uuid, _nilai numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.pengguna; l public.lead;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('TEAM_LEADER','TL_2','ADMIN') OR _nilai < 0 THEN RAISE EXCEPTION 'Verification denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  UPDATE public.lead SET nilai_lead = _nilai, kelas_tiket = CASE WHEN _nilai > public.ambang_tiket_besar() THEN 'BESAR' ELSE 'REGULER' END, diverifikasi_oleh = r.id, diverifikasi_pada = now() WHERE id = _id;
END;
$$;
