import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
import {canCreateProject,canExportDaily,isRole} from '@/lib/roles';
import {revenueSummary} from '@/lib/revision';
import {dailyReportSchema,reportCsv,reportInput} from '@/lib/daily-report';

export const getRevision=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const db=context.supabase;
 const {data:role,error:roleError}=await db.from('user_roles').select('role,team_id,project_id').eq('user_id',context.userId).single();
 if(roleError||!role)throw new Error('Akses belum ditetapkan.');
 const results=await Promise.all([db.from('sales_projects').select('*').order('created_at',{ascending:false}),db.from('sales_leads').select('*').order('created_at',{ascending:false}),db.from('sales_transactions').select('*'),db.from('sales_activities').select('*').order('occurred_at',{ascending:false}),db.from('ai_videos').select('*').order('created_at',{ascending:false}),db.from('calendar_events').select('*').order('starts_at'),db.from('event_reminders').select('*').eq('recipient_id',context.userId).order('created_at',{ascending:false}),db.rpc('staff_directory'),db.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(100),db.from('commissions').select('*'),db.from('kpi_logs').select('*').order('logged_on',{ascending:false}),db.from('social_analytics_links').select('*'),db.from('lead_change_requests').select('*').order('created_at',{ascending:false})]);
 if(results.some(r=>r.error))throw new Error('Data gagal dimuat. Coba lagi.');
 const [projects,leads,transactions,activities,videos,events,reminders,staff,audit,commissions,kpis,analytics,changes]=results;
 const month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date());
 return{projects:projects?.data??[],leads:leads?.data??[],transactions:transactions?.data??[],activities:activities?.data??[],videos:videos?.data??[],events:events?.data??[],reminders:reminders?.data??[],staff:staff?.data??[],audit:audit?.data??[],commissions:commissions?.data??[],kpis:kpis?.data??[],analytics:analytics?.data??[],changes:changes?.data??[],revenue:revenueSummary((transactions?.data??[]).filter(t=>t.closed_on.startsWith(month)),(projects?.data??[]).reduce((s,p)=>s+Number(p.target_amount),0))};
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
  const {data:account}=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).single();if(!account||!isRole(account.role)||!canExportDaily(account.role))throw new Error('Anda tidak memiliki akses laporan harian.');
  reportInput.parse({day:data.day});
  const {data:payload,error}=await context.supabase.rpc('daily_report_data',{_day:data.day,...(data.seId?{_owners:[data.seId]}:{})});if(error)throw new Error('Laporan gagal dimuat atau di luar lingkup akses.');
  const report=dailyReportSchema.parse(payload);return{csv:reportCsv(report),count:report.activities.length+report.leads.length+report.kpis.length};
});