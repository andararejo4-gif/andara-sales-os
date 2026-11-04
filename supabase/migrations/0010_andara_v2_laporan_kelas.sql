DROP FUNCTION IF EXISTS public.laporan_data(date, date, uuid[]);
CREATE FUNCTION public.laporan_data(_dari date, _sampai date, _pemilik uuid[] DEFAULT NULL, _kelas text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE owners uuid[]; start_at timestamptz; end_at timestamptz; result jsonb;
BEGIN
  IF NOT (public.peran_saya() IN ('SALES','SALES_2','TEAM_LEADER','TL_2','SALES_MANAGER','ADMIN','DIREKSI','IT')) THEN RAISE EXCEPTION 'Report access denied'; END IF;
  IF _dari IS NULL OR _sampai IS NULL OR _sampai < _dari OR _sampai - _dari > 366 THEN RAISE EXCEPTION 'Invalid report range'; END IF;
  IF _kelas IS NOT NULL AND _kelas NOT IN ('REGULER','BESAR') THEN RAISE EXCEPTION 'Invalid ticket class'; END IF;
  IF _pemilik IS NOT NULL AND (cardinality(_pemilik) = 0 OR EXISTS (SELECT 1 FROM unnest(_pemilik) id WHERE id IS NULL OR NOT EXISTS (SELECT 1 FROM public.laporan_staf() s WHERE s.user_id = id))) THEN RAISE EXCEPTION 'Staff selection outside report hierarchy'; END IF;
  SELECT coalesce(array_agg(s.user_id), ARRAY[]::uuid[]) INTO owners FROM public.laporan_staf() s WHERE _pemilik IS NULL OR s.user_id = ANY(_pemilik);
  start_at := _dari::timestamp AT TIME ZONE 'Asia/Jakarta';
  end_at := (_sampai + 1)::timestamp AT TIME ZONE 'Asia/Jakarta';
  SELECT jsonb_build_object(
    'staff', coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.laporan_staf() s WHERE s.user_id = ANY(owners)), '[]'::jsonb),
    'activities', coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'owner_id', a.pengguna_id, 'kind', a.jenis, 'note', a.catatan, 'occurred_at', a.terjadi_pada) ORDER BY a.terjadi_pada) FROM public.aktivitas a LEFT JOIN public.lead al ON al.id = a.lead_id WHERE a.pengguna_id = ANY(owners) AND a.terjadi_pada >= start_at AND a.terjadi_pada < end_at AND (_kelas IS NULL OR al.id IS NULL OR al.kelas_tiket = _kelas)), '[]'::jsonb),
    'leads', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'owner_id', l.pemilik_id, 'nickname', l.nama, 'status', l.tahap, 'source', l.sumber_lead, 'created_at', l.dibuat_pada) ORDER BY l.dibuat_pada) FROM public.lead l WHERE l.pemilik_id = ANY(owners) AND l.dibuat_pada >= start_at AND l.dibuat_pada < end_at AND (_kelas IS NULL OR l.kelas_tiket = _kelas)), '[]'::jsonb),
    'kpis', coalesce((SELECT jsonb_agg(jsonb_build_object('id', k.id, 'owner_id', k.pengguna_id, 'metric', k.jenis_aktivitas, 'value', k.skor, 'logged_on', (k.dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date)) FROM public.kpi_logs k WHERE k.pengguna_id = ANY(owners) AND k.dibuat_pada >= start_at AND k.dibuat_pada < end_at), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.laporan_data(date, date, uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.laporan_data(date, date, uuid[], text) TO authenticated;
