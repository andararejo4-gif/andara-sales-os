CREATE TYPE public.app_role AS ENUM ('se','tl','adm','dm','sm','dir');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, team_id uuid, project_id uuid, UNIQUE(user_id));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_role_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
CREATE FUNCTION public.feature_access(_feature text, _write boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND CASE _feature
WHEN 'team' THEN r.role IN ('tl','sm','dir')
WHEN 'verification' THEN CASE WHEN _write THEN r.role='adm' ELSE r.role IN ('adm','sm') END
WHEN 'content' THEN CASE WHEN _write THEN r.role='dm' ELSE r.role IN ('dm','sm','dir') END
WHEN 'projects' THEN CASE WHEN _write THEN r.role='sm' ELSE r.role IN ('sm','dir') END
WHEN 'portfolio' THEN r.role='dir'
ELSE false END) $$;
REVOKE ALL ON FUNCTION public.feature_access(text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feature_access(text,boolean) TO authenticated,service_role;
CREATE FUNCTION public.can_read_scope(_owner uuid, _team uuid, _project uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND (r.user_id=_owner OR r.role='dir' OR (r.role='tl' AND r.team_id IS NOT NULL AND r.team_id=_team) OR (r.role IN ('sm','adm','dm') AND r.project_id IS NOT NULL AND r.project_id=_project))) $$;
REVOKE ALL ON FUNCTION public.can_read_scope(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_scope(uuid,uuid,uuid) TO authenticated,service_role;
CREATE TABLE public.work_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid(), team_id uuid, project_id uuid, feature text NOT NULL CHECK(feature IN ('team','verification','content','projects','portfolio')), title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200), note text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','done')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.work_items TO authenticated;
GRANT ALL ON public.work_items TO service_role;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY scoped_read ON public.work_items FOR SELECT TO authenticated USING(public.feature_access(feature,false) AND public.can_read_scope(owner_id,team_id,project_id));
CREATE POLICY own_create ON public.work_items FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid() AND public.feature_access(feature,true) AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND team_id IS NOT DISTINCT FROM r.team_id AND project_id IS NOT DISTINCT FROM r.project_id));
CREATE POLICY own_update ON public.work_items FOR UPDATE TO authenticated USING(owner_id=auth.uid() AND public.feature_access(feature,true)) WITH CHECK(owner_id=auth.uid() AND public.feature_access(feature,true) AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND team_id IS NOT DISTINCT FROM r.team_id AND project_id IS NOT DISTINCT FROM r.project_id));
CREATE INDEX work_items_scope_idx ON public.work_items(feature,owner_id,project_id,team_id);