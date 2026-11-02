import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
import {leadInput,leadFields,analyticsInput,canManageAnalytics} from '@/lib/lead-rules';
import {isRole} from '@/lib/roles';

export const saveLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(leadInput).handler(async({data,context})=>{
 const fields={_name:data.prospect_name,_phone:data.phone,_address:data.address,_source:data.source,_status:data.status,_note:data.note};
 const {data:id,error}=data.id?await context.supabase.rpc('save_sales_lead',{...fields,_id:data.id}):await context.supabase.rpc('create_sales_lead',fields);
 if(error||!id)throw new Error('Lead belum tersimpan. Periksa isian dan hak akses Anda.');
 return{id};
});
export const verifyLead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),value:z.number().finite().nonnegative()})).handler(async({data,context})=>{
 const {error}=await context.supabase.rpc('verify_sales_lead',{_id:data.id,_value:data.value});if(error)throw new Error('Verifikasi memerlukan ADM atau TL dalam lingkup lead.');return{ok:true};
});
export const requestLeadChange=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),proposed:leadFields,reason:z.string().trim().min(1).max(2000)})).handler(async({data,context})=>{
 const {error}=await context.supabase.rpc('request_lead_change',{_lead:data.id,_proposed:data.proposed,_reason:data.reason});if(error)throw new Error('Permintaan perubahan belum tersimpan.');return{ok:true};
});
export const reviewLeadChange=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),approve:z.boolean()})).handler(async({data,context})=>{
 const {error}=await context.supabase.rpc('review_lead_change',{_request:data.id,_approve:data.approve});if(error)throw new Error('Hanya SM dalam lingkup lead dapat menyetujui.');return{ok:true};
});
export const applyLeadChange=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async({data,context})=>{
 const {error}=await context.supabase.rpc('apply_lead_change',{_request:data.id});if(error)throw new Error('Perubahan belum disetujui SM atau sudah diterapkan.');return{ok:true};
});
export const saveAnalyticsLink=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(analyticsInput).handler(async({data,context})=>{
 const {data:account}=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).single();
 if(!account||!isRole(account.role)||!canManageAnalytics(account.role))throw new Error('Akses pengaturan tautan ditolak.');
 const {error}=await context.supabase.from('social_analytics_links').insert({...data,created_by:context.userId});if(error)throw new Error('Tautan belum tersimpan.');return{ok:true};
});