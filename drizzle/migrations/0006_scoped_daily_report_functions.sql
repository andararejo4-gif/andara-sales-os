CREATE FUNCTION public.daily_report_staff() RETURNS TABLE(user_id uuid, role public.app_role, staff_name text, staff_code text, tl_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT s.user_id,s.role,s.staff_name,s.staff_code,s.tl_id FROM public.user_roles s JOIN public.user_roles r ON r.user_id=auth.uid()
 WHERE (r.role='se' AND s.user_id=r.user_id AND s.role='se')
 OR (r.role='tl' AND s.role='se' AND s.tl_id=r.user_id)
 OR (r.role='adm' AND s.role='se' AND EXISTS(SELECT 1 FROM public.admin_tl_assignments a WHERE a.admin_id=r.user_id AND a.tl_id=s.tl_id))
 OR (r.role='sm' AND s.role IN ('tl','se') AND s.user_id<>r.user_id AND (
 (r.project_id IS NOT NULL AND s.project_id=r.project_id)
 OR EXISTS(SELECT 1 FROM public.sales_projects p WHERE p.id=s.project_id AND p.created_by=r.user_id)
 OR (s.role='se' AND EXISTS(SELECT 1 FROM public.user_roles t WHERE t.user_id=s.tl_id AND t.role='tl' AND ((r.project_id IS NOT NULL AND t.project_id=r.project_id) OR EXISTS(SELECT 1 FROM public.sales_projects p WHERE p.id=t.project_id AND p.created_by=r.user_id))))
 )); $$;
REVOKE ALL ON FUNCTION public.daily_report_staff() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.daily_report_staff() TO authenticated;
CREATE FUNCTION public.daily_report_data(_day date,_owners uuid[] DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE owners uuid[]; start_at timestamptz; result jsonb;
BEGIN
 IF NOT (public.has_role(auth.uid(),'se') OR public.has_role(auth.uid(),'tl') OR public.has_role(auth.uid(),'sm') OR public.has_role(auth.uid(),'adm')) THEN RAISE EXCEPTION 'Daily report access denied'; END IF;
 IF _day IS NULL THEN RAISE EXCEPTION 'Report date required'; END IF;
 IF _owners IS NOT NULL AND (cardinality(_owners)=0 OR EXISTS(SELECT 1 FROM unnest(_owners) id WHERE id IS NULL OR NOT EXISTS(SELECT 1 FROM public.daily_report_staff() s WHERE s.user_id=id))) THEN RAISE EXCEPTION 'Staff selection outside report hierarchy'; END IF;
 SELECT coalesce(array_agg(s.user_id),ARRAY[]::uuid[]) INTO owners FROM public.daily_report_staff() s WHERE _owners IS NULL OR s.user_id=ANY(_owners);
 start_at := _day::timestamp AT TIME ZONE 'Asia/Jakarta';
 SELECT jsonb_build_object(
 'staff',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.daily_report_staff() s WHERE s.user_id=ANY(owners)),'[]'::jsonb),
 'activities',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.occurred_at) FROM public.sales_activities a WHERE a.owner_id=ANY(owners) AND a.occurred_at>=start_at AND a.occurred_at<start_at+interval '1 day'),'[]'::jsonb),
 'leads',coalesce((SELECT jsonb_agg(jsonb_build_object('id',l.id,'owner_id',l.owner_id,'nickname',l.nickname,'status',l.status,'source',l.source,'created_at',l.created_at) ORDER BY l.created_at) FROM public.sales_leads l WHERE l.owner_id=ANY(owners) AND l.created_at>=start_at AND l.created_at<start_at+interval '1 day'),'[]'::jsonb),
 'kpis',coalesce((SELECT jsonb_agg(jsonb_build_object('id',k.id,'owner_id',k.owner_id,'metric',k.metric,'value',k.value,'logged_on',k.logged_on)) FROM public.kpi_logs k WHERE k.owner_id=ANY(owners) AND k.logged_on=_day),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.daily_report_data(date,uuid[]) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.daily_report_data(date,uuid[]) TO authenticated;