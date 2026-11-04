import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromDbRole } from '@/lib/roles';
export const accountOptions = queryOptions({
  queryKey: ['account'], staleTime: 0,
  queryFn: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Silakan masuk kembali.');
    const { data, error: roleError } = await supabase.from('pengguna').select('peran').eq('auth_user_id', user.id).maybeSingle();
    if (roleError) throw new Error('Hak akses gagal dimuat. Coba lagi.');
    return { userId: user.id, email: user.email ?? '', role: data ? fromDbRole(data.peran) : null, teamId: null, projectId: null };
  }
});