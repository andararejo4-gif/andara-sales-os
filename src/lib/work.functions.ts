import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
const feature=z.enum(['team','verification','content','projects','portfolio']);
export const listWork=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).inputValidator(z.object({feature})).handler(async({data,context})=>{
 const {data:allowed,error:accessError}=await context.supabase.rpc('feature_access',{_feature:data.feature,_write:false});
 if(accessError||!allowed)throw new Error('Akses tidak diizinkan.');
 const {data:items,error}=await context.supabase.from('work_items').select('id,title,note,status,created_at,owner_id').eq('feature',data.feature).order('created_at',{ascending:false});
 if(error)throw new Error('Daftar pekerjaan gagal dimuat.');return items;
});
export const addWork=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({feature,title:z.string().trim().min(1).max(200),note:z.string().max(2000)})).handler(async({data,context})=>{
 const {data:allowed}=await context.supabase.rpc('feature_access',{_feature:data.feature,_write:true});if(!allowed)throw new Error('Akses tidak diizinkan.');
 const {data:role,error:roleError}=await context.supabase.from('user_roles').select('team_id,project_id').eq('user_id',context.userId).single();
 if(roleError||!role)throw new Error('Peran belum ditetapkan.');
 const {error}=await context.supabase.from('work_items').insert({...data,owner_id:context.userId,team_id:role.team_id,project_id:role.project_id});
 if(error)throw new Error('Pekerjaan belum tersimpan.');return {ok:true};
});
export const updateWork=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),status:z.enum(['pending','in_progress','done'])})).handler(async({data,context})=>{
 const {data:item,error}=await context.supabase.from('work_items').select('id').eq('id',data.id).eq('owner_id',context.userId).single();
 if(error||!item)throw new Error('Akses tidak diizinkan.');
 const {data:updated,error:updateError}=await context.supabase.from('work_items').update({status:data.status}).eq('id',data.id).eq('owner_id',context.userId).select('id').single();
 if(updateError||!updated)throw new Error('Status belum tersimpan.');return {ok:true};
});