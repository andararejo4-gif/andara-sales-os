ALTER TABLE public.proyek ADD COLUMN IF NOT EXISTS target_omzet numeric NOT NULL DEFAULT 0 CHECK (target_omzet >= 0);
ALTER TABLE public.transaksi ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'CV' CHECK (status IN ('BOOK','CV','CANCELLED'));

DROP FUNCTION IF EXISTS public.laporan_staf();
CREATE FUNCTION public.laporan_staf() RETURNS TABLE(user_id uuid, role public.role_pengguna, staff_name text, staff_code text, tl_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.peran, s.nama, '', s.team_leader_id
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

DROP FUNCTION IF EXISTS public.laporan_data(date, uuid[]);
CREATE FUNCTION public.laporan_data(_hari date, _pemilik uuid[] DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE owners uuid[]; start_at timestamptz; result jsonb;
BEGIN
  IF NOT (public.peran_saya() IN ('SALES','TEAM_LEADER','SALES_MANAGER','ADMIN','DIREKSI','IT')) THEN RAISE EXCEPTION 'Daily report access denied'; END IF;
  IF _hari IS NULL THEN RAISE EXCEPTION 'Report date required'; END IF;
  IF _pemilik IS NOT NULL AND (cardinality(_pemilik) = 0 OR EXISTS (SELECT 1 FROM unnest(_pemilik) id WHERE id IS NULL OR NOT EXISTS (SELECT 1 FROM public.laporan_staf() s WHERE s.user_id = id))) THEN RAISE EXCEPTION 'Staff selection outside report hierarchy'; END IF;
  SELECT coalesce(array_agg(s.user_id), ARRAY[]::uuid[]) INTO owners FROM public.laporan_staf() s WHERE _pemilik IS NULL OR s.user_id = ANY(_pemilik);
  start_at := _hari::timestamp AT TIME ZONE 'Asia/Jakarta';
  SELECT jsonb_build_object(
    'staff', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.laporan_staf() s WHERE s.user_id = ANY(owners)), '[]'::jsonb),
    'activities', coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'owner_id', a.pengguna_id, 'kind', a.jenis, 'note', a.catatan, 'occurred_at', a.terjadi_pada) ORDER BY a.terjadi_pada) FROM public.aktivitas a WHERE a.pengguna_id = ANY(owners) AND a.terjadi_pada >= start_at AND a.terjadi_pada < start_at + interval '1 day'), '[]'::jsonb),
    'leads', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'owner_id', l.pemilik_id, 'nickname', l.nama, 'status', l.tahap, 'source', l.sumber_lead, 'created_at', l.dibuat_pada) ORDER BY l.dibuat_pada) FROM public.lead l WHERE l.pemilik_id = ANY(owners) AND l.dibuat_pada >= start_at AND l.dibuat_pada < start_at + interval '1 day'), '[]'::jsonb),
    'kpis', coalesce((SELECT jsonb_agg(jsonb_build_object('id', k.id, 'owner_id', k.pengguna_id, 'metric', k.jenis_aktivitas, 'value', k.skor, 'logged_on', k.dibuat_pada::date)) FROM public.kpi_logs k WHERE k.pengguna_id = ANY(owners) AND k.dibuat_pada::date = _hari), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.laporan_data(date, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_data(date, uuid[]) TO authenticated;