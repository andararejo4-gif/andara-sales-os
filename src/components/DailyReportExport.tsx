import {useState} from 'react';
import {useQuery,useSuspenseQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {Download,FileCheck2,LoaderCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {accountOptions} from '@/lib/account';
import {canExportDaily} from '@/lib/roles';
import {getReportStaff,fetchDailyReport,addManualNote} from '@/lib/daily-report.functions';
import {selectReportOwners,reportEnd,reportPeriods,type ReportPeriod} from '@/lib/daily-report';
import {jakartaDay} from '@/lib/revision';
import {createReportFile,deliverReport,type ReportFormat} from '@/lib/report-download';
import {toast} from 'sonner';
import {useTicketMode} from '@/lib/ticket-mode';

export function DailyReportExport(){
 const {data:account}=useSuspenseQuery(accountOptions);
 if(!account.role||!canExportDaily(account.role))return null;
 return <ReportControls personal={account.role==='se'||account.role==='sales_2'} manager={account.role==='sm'}/>;
}
function ReportControls({personal,manager}:{personal:boolean;manager:boolean}){
 const kelas=useTicketMode(),staffFn=useServerFn(getReportStaff),reportFn=useServerFn(fetchDailyReport),noteFn=useServerFn(addManualNote),qc=useQueryClient();
 const staff=useQuery({queryKey:['daily-report-staff'],queryFn:()=>staffFn()});
 const [day,setDay]=useState(jakartaDay(new Date())),[format,setFormat]=useState<ReportFormat>('pdf'),[mode,setMode]=useState('all'),[period,setPeriod]=useState<ReportPeriod>('daily'),[note,setNote]=useState('');
 const [selected,setSelected]=useState<string[]>([]),[teams,setTeams]=useState<string[]>([]),[ready,setReady]=useState<{blob:Blob;filename:string;count:number}|null>(null);
 const owners=selectReportOwners(staff.data??[],selected,teams);
 const toggle=(id:string,list:string[],set:(ids:string[])=>void)=>{setReady(null);set(list.includes(id)?list.filter(v=>v!==id):[...list,id]);};
 const prepare=useMutation({mutationFn:async()=>{
  const to=reportEnd(period,day),report=await reportFn({data:{from:day,to,...(kelas?{kelas}:{}),...(!personal&&mode==='selected'?{ownerIds:owners}:{})}});
  const count=report.activities.length+report.leads.length+report.kpis.length;
  return {blob:await createReportFile(report,day===to?day:`${day} s/d ${to}`,format,`Laporan ${reportPeriods[period]}`),filename:`Laporan-${reportPeriods[period]}-Andara-${day}.${format}`,count};
 },onSuccess:setReady,onError:error=>toast.error(error.message)});
 const saveNote=useMutation({mutationFn:()=>noteFn({data:{note}}),onSuccess:()=>{setNote('');setReady(null);void qc.invalidateQueries({queryKey:['revision']});toast.success('Catatan tersimpan.');},onError:error=>toast.error(error.message)});
 return <section className="mb-7 border-y border-border py-5" aria-label="Laporan harian">
  <div className="mb-4 flex items-center gap-2"><Download className="size-5 text-primary"/><h2 className="font-semibold">Laporan {reportPeriods[period]}{personal?' Saya':''}</h2></div>
  <form className="mb-5 space-y-3" onSubmit={e=>{e.preventDefault();if(note.trim())saveNote.mutate();}}>
   <label className="block text-sm font-medium" htmlFor="report-note">Catatan manual (kegiatan di luar lead)<Textarea id="report-note" required maxLength={2000} value={note} disabled={saveNote.isPending} onChange={e=>setNote(e.target.value)} className="mt-2"/></label>
   <Button type="submit" variant="outline" className="min-h-11 w-full sm:w-auto" disabled={saveNote.isPending||!note.trim()}>{saveNote.isPending?<LoaderCircle className="animate-spin"/>:null}Tambah Catatan</Button>
  </form>
  <form className="space-y-4" onSubmit={e=>{e.preventDefault();setReady(null);prepare.mutate();}}>
   <label className="block text-sm font-medium" htmlFor="report-period">Periode<Select value={period} disabled={prepare.isPending} onValueChange={value=>{if(value==='daily'||value==='weekly'||value==='monthly'){setReady(null);setPeriod(value);}}}><SelectTrigger id="report-period" className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(reportPeriods).map(([key,label])=><SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></label>
   <div className="grid grid-cols-2 gap-3">
    <label className="min-w-0 text-sm font-medium" htmlFor="report-day">{period==='daily'?'Tanggal':'Mulai tanggal'} (WIB)<Input id="report-day" type="date" required value={day} disabled={prepare.isPending} onChange={e=>{setReady(null);setDay(e.target.value);}} className="mt-2 min-w-0 w-full"/></label>
    <label className="text-sm font-medium" htmlFor="report-format">Format<Select value={format} disabled={prepare.isPending} onValueChange={value=>{if(value==='pdf'||value==='xlsx'||value==='csv'){setReady(null);setFormat(value);}}}><SelectTrigger id="report-format" className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="xlsx">Excel (.xlsx)</SelectItem><SelectItem value="csv">CSV</SelectItem></SelectContent></Select></label>
   </div>
   {!personal&&<><Select value={mode} disabled={prepare.isPending} onValueChange={v=>{setReady(null);setMode(v);}}><SelectTrigger aria-label="Cakupan laporan" className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{manager?'Seluruh TL & SE':'Seluruh SE dalam tim'}</SelectItem><SelectItem value="selected">Pilih anggota tertentu</SelectItem></SelectContent></Select>
    {mode==='selected'&&<fieldset disabled={prepare.isPending} className="max-h-64 space-y-3 overflow-y-auto border-l-2 border-border pl-3"><legend className="mb-2 text-sm font-medium">Anggota laporan</legend>
     {manager&&(staff.data??[]).filter(s=>s.role==='tl').map(s=><label key={`team-${s.user_id}`} className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={teams.includes(s.user_id)} onCheckedChange={()=>toggle(s.user_id,teams,setTeams)}/><span>Tim TL {s.staff_code} {s.staff_name}</span></label>)}
     {(staff.data??[]).map(s=><label key={s.user_id} className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={selected.includes(s.user_id)} onCheckedChange={()=>toggle(s.user_id,selected,setSelected)}/><span>{s.role.toUpperCase()} {s.staff_code} {s.staff_name||'Nama belum ditetapkan'}</span></label>)}
     {(staff.data??[]).length===0&&<p className="text-sm text-muted-foreground">Belum ada anggota yang ditugaskan.</p>}
    </fieldset>}</>}
   {staff.isError&&<p role="alert" className="text-sm text-destructive">{staff.error.message}<Button variant="link" type="button" onClick={()=>void staff.refetch()}>Coba lagi</Button></p>}
   {ready?<div className="flex flex-wrap items-center gap-3"><Button type="button" className="min-h-11" onClick={()=>void deliverReport(ready.blob,ready.filename).catch(()=>toast.error('Unduhan belum berhasil. Coba lagi.'))}><Download/>Unduh Laporan {reportPeriods[period]}</Button><span className="flex items-center gap-1 text-sm text-muted-foreground"><FileCheck2 className="size-4"/>{ready.count} catatan</span></div>:<Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={prepare.isPending||staff.isPending||staff.isError||(!personal&&mode==='selected'&&owners.length===0)}>{prepare.isPending?<LoaderCircle className="animate-spin"/>:<Download/>}{prepare.isPending?'Menyiapkan laporan…':`Siapkan Laporan ${reportPeriods[period]}`}</Button>}
  </form>
 </section>;
}