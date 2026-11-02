import {z} from 'zod';
import {csvCell} from '@/lib/revision';

export const reportStaffSchema=z.object({user_id:z.string(),role:z.string(),staff_name:z.string(),staff_code:z.string(),tl_id:z.string().nullable()});
export type ReportStaff=z.infer<typeof reportStaffSchema>;
export const dailyReportSchema=z.object({
 staff:z.array(reportStaffSchema),
 activities:z.array(z.object({id:z.string(),owner_id:z.string(),kind:z.string(),note:z.string(),occurred_at:z.string()})),
 leads:z.array(z.object({id:z.string(),owner_id:z.string(),nickname:z.string(),status:z.string(),source:z.string(),created_at:z.string()})),
 kpis:z.array(z.object({id:z.string(),owner_id:z.string(),metric:z.string(),value:z.coerce.number(),logged_on:z.string()})),
});
export type DailyReport=z.infer<typeof dailyReportSchema>;
export const reportInput=z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(day=>{const date=new Date(`${day}T00:00:00Z`);return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===day;},'Tanggal tidak valid.'),ownerIds:z.array(z.string().uuid()).min(1).max(1000).optional()});
export function selectReportOwners(staff:ReportStaff[],selected:string[],teamIds:string[]){return staff.filter(s=>selected.includes(s.user_id)||teamIds.includes(s.user_id)||Boolean(s.tl_id&&teamIds.includes(s.tl_id))).map(s=>s.user_id);}
export const reportHeaders=['Waktu (WIB)','Peran','ID Staf','Nama Staf','TL ID','Kategori','Aktivitas / Prospek','Status / Nilai','Catatan'];
export function reportRows(report:DailyReport){
 const prefix=(id:string,time:string)=>{const staff=report.staff.find(s=>s.user_id===id);return [time,staff?.role.toUpperCase()??'',staff?.staff_code??'',staff?.staff_name??'',report.staff.find(s=>s.user_id===staff?.tl_id)?.staff_code??staff?.tl_id??''];};
 const time=(stamp:string)=>new Date(stamp).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
 return [...report.activities.map(a=>[...prefix(a.owner_id,time(a.occurred_at)),'Aktivitas',a.kind,'',a.note]),...report.leads.map(l=>[...prefix(l.owner_id,time(l.created_at)),'Prospek masuk',l.nickname,l.status,l.source]),...report.kpis.map(k=>[...prefix(k.owner_id,k.logged_on),'Progres harian',k.metric,String(k.value),''])];
}
export function reportCsv(report:DailyReport){return '\uFEFF'+[reportHeaders,...reportRows(report)].map(row=>row.map(csvCell).join(',')).join('\r\n');}