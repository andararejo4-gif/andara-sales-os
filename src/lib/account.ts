import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isRole } from '@/lib/roles';
export const accountOptions = queryOptions({
 queryKey: ['account'], staleTime: 0,
 queryFn: async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Silakan masuk kembali.');
  const { data, error: roleError } = await supabase.from('user_roles').select('role,team_id,project_id').eq('user_id',user.id).maybeSingle();
  if (roleError) throw new Error('Hak akses gagal dimuat. Coba lagi.');
  return { userId:user.id, email:user.email ?? '', role:data && isRole(data.role) ? data.role : null, teamId:data?.team_id ?? null, projectId:data?.project_id ?? null };
 }
});