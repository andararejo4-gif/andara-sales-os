ALTER TABLE public.lead ADD COLUMN IF NOT EXISTS nilai_perkiraan numeric NOT NULL DEFAULT 0 CHECK (nilai_perkiraan >= 0);

DROP FUNCTION IF EXISTS public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid, text);
CREATE FUNCTION public.buat_lead(_nama text, _telepon text, _alamat text, _sumber text, _origin public.origin_lead, _tahap public.status_pipeline, _proyek uuid, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL, _kelas text DEFAULT 'REGULER', _nilai numeric DEFAULT 0) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  result uuid;
  v_pemilik uuid;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  IF _kelas NOT IN ('REGULER','BESAR') THEN RAISE EXCEPTION 'Invalid ticket class'; END IF;
  IF _nilai IS NULL OR _nilai < 0 THEN RAISE EXCEPTION 'Invalid nominal'; END IF;
  IF (_nilai > public.ambang_tiket_besar()) <> (_kelas = 'BESAR') THEN RAISE EXCEPTION 'Nominal tidak sesuai kelas tiket'; END IF;
  IF _kelas = 'BESAR' AND _sumber NOT IN ('Posting','Indoor') THEN RAISE EXCEPTION 'Sumber tidak tersedia untuk tiket di atas 500 jt'; END IF;
  IF length(trim(_nama)) NOT BETWEEN 1 AND 200 OR length(_telepon) NOT BETWEEN 6 AND 30 OR length(_alamat) NOT BETWEEN 1 AND 500 OR length(_catatan) > 2000 THEN RAISE EXCEPTION 'Invalid lead fields'; END IF;
  v_pemilik := COALESCE(_pemilik, r.id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  INSERT INTO public.lead (kode, nama, telepon, alamat, sumber_lead, origin, tahap, proyek_id, pemilik_id, catatan, kelas_tiket, nilai_perkiraan)
  VALUES ('L-' || replace(gen_random_uuid()::text, '-', ''), trim(_nama), _telepon, _alamat, _sumber, _origin, _tahap, _proyek, v_pemilik, _catatan, _kelas, _nilai)
  RETURNING id INTO result;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan)
  VALUES (v_pemilik, _proyek, result, _sumber, _catatan);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_lead(text, text, text, text, public.origin_lead, public.status_pipeline, uuid, text, uuid, text, numeric) TO authenticated;

DROP FUNCTION IF EXISTS public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text, uuid);
CREATE FUNCTION public.simpan_lead(_id uuid, _nama text, _telepon text, _alamat text, _sumber text, _tahap public.status_pipeline, _catatan text DEFAULT '', _pemilik uuid DEFAULT NULL, _nilai numeric DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.pengguna;
  l public.lead;
  v_pemilik uuid;
  v_nilai numeric;
  v_kelas text;
BEGIN
  SELECT * INTO r FROM public.pengguna WHERE auth_user_id = auth.uid();
  IF r.peran NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER') THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  SELECT * INTO l FROM public.lead WHERE id = _id FOR UPDATE;
  IF l.id IS NULL OR NOT public.lihat_staf(l.pemilik_id) THEN RAISE EXCEPTION 'Lead access denied'; END IF;
  v_nilai := COALESCE(_nilai, l.nilai_perkiraan);
  IF v_nilai < 0 THEN RAISE EXCEPTION 'Invalid nominal'; END IF;
  v_kelas := CASE WHEN v_nilai > public.ambang_tiket_besar() THEN 'BESAR' ELSE 'REGULER' END;
  IF v_kelas = 'BESAR' AND _sumber NOT IN ('Posting','Indoor') THEN RAISE EXCEPTION 'Sumber tidak tersedia untuk tiket di atas 500 jt'; END IF;
  v_pemilik := COALESCE(_pemilik, l.pemilik_id);
  IF NOT public.lihat_staf(v_pemilik) OR (SELECT peran FROM public.pengguna WHERE id = v_pemilik) NOT IN ('SALES','SALES_2','TEAM_LEADER','TL_2') THEN RAISE EXCEPTION 'Pemilik di luar lingkup akses'; END IF;
  UPDATE public.lead SET nama = trim(_nama), telepon = _telepon, alamat = _alamat, sumber_lead = _sumber, tahap = _tahap, catatan = _catatan, pemilik_id = v_pemilik, nilai_perkiraan = v_nilai, kelas_tiket = v_kelas, diubah_pada = now(), diverifikasi_oleh = NULL, diverifikasi_pada = NULL WHERE id = _id;
  INSERT INTO public.aktivitas (pengguna_id, proyek_id, lead_id, jenis, catatan) VALUES (v_pemilik, l.proyek_id, _id, _sumber, _catatan);
  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text, uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.simpan_lead(uuid, text, text, text, text, public.status_pipeline, text, uuid, numeric) TO authenticated;
