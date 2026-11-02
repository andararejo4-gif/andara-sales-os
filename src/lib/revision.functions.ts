import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
import {canCreateProject,canExportDaily,isRole} from '@/lib/roles';
import {csvCell,revenueSummary} from '@/lib/revision';

export const getRevision=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const db=context.supabase;
 const {data:role,error:roleError}=await db.from('user_roles').select('role,team_id,project_id').eq('user_id',context.userId).single();
 if(roleError||!role)throw new Error('Akses belum ditetapkan.');
 const results=await Promise.all([db.from('sales_projects').select('*').order('created_at',{ascending:false}),db.from('sales_leads').select('*').order('created_at',{ascending:false}),db.from('sales_transactions').select('*'),db.from('sales_activities').select('*').order('occurred_at',{ascending:false}),db.from('ai_videos').select('*').order('created_at',{ascending:false}),db.from('calendar_events').select('*').order('starts_at'),db.from('event_reminders').select('*').eq('recipient_id',context.userId).order('created_at',{ascending:false}),db.rpc('staff_directory'),db.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(100)]);
 if(results.some(r=>r.error))throw new Error('Les données gagal dimuat. Coba lagi.');
 const [projects,leads,transactions,activities,videos,events,reminders,staff,audit]=results;
 const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date());
 return{projects:projects?.data??[],leads:leads?.data??[],transactions:transactions?.data??[],activities:activities?.data??[],videos:videos?.data??[],events:events?.data??[],reminders:reminders?.data??[],staff:staff?.data??[],audit:audit?.data??[],revenue:revenueSummary((transactions?.data??[]).filter(t=>t.closed_on.startsWith(month)),(projects?.data??[]).reduce((s,p)=>s+Number(p.target_amount),0))};
});

export const createProject=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({name:z.string().trim().min(1).max(200),target:z.number().nonnegative()})).handler(async({data,context})=>{
 const {data:account}=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).single();
 if(!account||!isRole(account.role)||!canCreateProject(account.role))throw new Error('Hanya TL dan SM dapat menambah proyek.');
 const {data:project,error}=await context.supabase.from('sales_projects').insert({name:data.name,target_amount:data.target,created_by:context.userId}).select('id').single();
 if(error||!project)throw new Error('Proyek belum tersimpan.');return project;
});
export const createEvent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({title:z.string().trim().min(1).max(200),kind:z.enum(['survey','tour','follow_up']),starts_at:z.string().datetime(),location:z.string().max(500)})).handler(async({data,context})=>{
 const {data:account}=await context.supabase.from('user_roles').select('role,team_id,project_id').eq('user_id',context.userId).single();if(!account)throw new Error('Akses belum ditetapkan.');
 const {data:event,error}=await context.supabase.from('calendar_events').insert({...data,owner_id:context.userId,team_id:account.team_id,project_id:account.project_id}).select('id').single();if(error||!event)throw new Error('Agenda belum tersimpan.');return event;
});
export const updateEvent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid(),status:z.enum(['done','cancelled'])})).handler(async({data,context})=>{const {data:row,error}=await context.supabase.from('calendar_events').update({status:data.status}).eq('id',data.id).select('id').single();if(error||!row)throw new Error('Agenda belum diperbarui.');return{ok:true};});
export const markReminder=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async({data,context})=>{const {error}=await context.supabase.from('event_reminders').update({read_at:new Date().toISOString()}).eq('id',data.id).eq('recipient_id',context.userId);if(error)throw new Error('Pengingat belum diperbarui.');return{ok:true};});
export const exportDaily=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),seId:z.string().uuid().optional()})).handler(async({data,context})=>{
 const {data:account}=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).single();if(!account||!isRole(account.role)||!canExportDaily(account.role))throw new Error('Hanya TL dan ADM dapat mengunduh laporan.');
 const {data:staff,error:staffError}=await context.supabase.rpc('staff_directory');if(staffError)throw new Error('Penanggung jawab gagal dimuat.');
 const sales=(staff??[]).filter(s=>s.role==='se'&&(!data.seId||s.user_id===data.seId));if(data.seId&&!sales.length)throw new Error('Sales di luar lingkup akses.');
 const start=new Date(`${data.day}T00:00:00+07:00`);if(Number.isNaN(start.getTime()))throw new Error('Tanggal tidak valid.');
 const {data:rows,error}=await context.supabase.from('sales_activities').select('*').in('owner_id',sales.map(s=>s.user_id)).gte('occurred_at',start.toISOString()).lt('occurred_at',new Date(start.getTime()+86400000).toISOString()).order('occurred_at');if(error)throw new Error('Laporan gagal dimuat.');
 const lines=[['Tanggal','SE ID','Nama SE','Aktivitas','Catatan'],...(rows??[]).map(r=>{const se=sales.find(s=>s.user_id===r.owner_id);return [r.occurred_at,se?.staff_code,se?.staff_name,r.kind,r.note];})];return{csv:'\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n'),count:rows?.length??0};
});