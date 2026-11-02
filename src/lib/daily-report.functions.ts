import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {dailyReportSchema,reportInput,reportStaffSchema} from '@/lib/daily-report';
import {canExportDaily,isRole} from '@/lib/roles';

export const getReportStaff=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:account,error:accountError}=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).single();
 if(accountError||!account||!isRole(account.role)||!canExportDaily(account.role))throw new Error('Anda tidak memiliki akses laporan harian.');
 const {data,error}=await context.supabase.rpc('daily_report_staff');
 if(error)throw new Error('Daftar anggota laporan gagal dimuat.');
 return reportStaffSchema.array().parse(data??[]);
});
export const fetchDailyReport=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(reportInput).handler(async({data,context})=>{
 const {data:report,error}=await context.supabase.rpc('daily_report_data',{_day:data.day,...(data.ownerIds?{_owners:data.ownerIds}:{})});
 if(error)throw new Error('Laporan gagal dimuat atau pilihan anggota di luar akses Anda.');
 return dailyReportSchema.parse(report);
});