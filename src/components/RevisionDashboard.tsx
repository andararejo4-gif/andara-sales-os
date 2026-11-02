import {Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ArrowUpRight,CalendarDays,FileDown,Film,Users,Building2,Wallet} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Section} from '@/components/AppShell';
import {accountOptions} from '@/lib/account';
import {revisionOptions} from '@/lib/revision-query';
import {canExportDaily} from '@/lib/roles';
import {leadAttribution,publicationAttribution} from '@/lib/revision';
import {Agenda} from '@/components/Agenda';
import {AnalyticsLinks} from '@/components/AnalyticsLinks';
import {LeadChanges} from '@/components/LeadChanges';
import {DailyReportExport} from '@/components/DailyReportExport';

export function RevisionDashboard(){
 const {data}=useSuspenseQuery(revisionOptions),{data:account}=useSuspenseQuery(accountOptions);
 const role=account.role;if(!role)return null;
 const metrics=[{label:'Total Lead',value:data.leads.length,kind:'leads',icon:Users},{label:'Proyek',value:data.projects.length,kind:'projects',icon:Building2},{label:'Aktivitas',value:data.activities.length,kind:'activities',icon:FileDown},{label:'Video AI',value:data.videos.length,kind:'videos',icon:Film}] as const;
 const staff=(id:string|null)=>data.staff.find(s=>s.user_id===id);
 return <>
  {(role==='dm'||role==='sm'||role==='dir'||role==='it')&&<AnalyticsLinks/>}
  {(role==='sm'||role==='it')&&<LeadChanges/>}
  {data.kpis.length>0&&<Section title="KPI tercatat"><div className="divide-y divide-border">{data.kpis.slice(0,8).map(k=><p key={k.id} className="flex flex-wrap justify-between gap-2 py-3"><span>{k.metric} · {staff(k.owner_id)?.staff_name||'Staf'}</span><span className="font-semibold">{Number(k.value).toLocaleString('id-ID')} · {k.logged_on}</span></p>)}</div></Section>}
  <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.filter(m=>role!=='dm'||m.kind==='videos'||m.kind==='projects').map(({label,value,kind,icon:Icon})=><Button asChild variant="outline" key={kind} className="h-auto min-h-28 flex-col items-start justify-between whitespace-normal p-4"><Link to="/data/$kind" params={{kind}}><span className="flex w-full items-center justify-between text-muted-foreground"><Icon/><ArrowUpRight/></span><span className="text-2xl font-bold">{value}</span><span>{label}</span></Link></Button>)}</div>
  {(role==='sm'||role==='tl'||role==='dir'||role==='it')&&<Section title="Omzet bulan ini"><Button variant="outline" asChild className="h-auto w-full justify-between whitespace-normal p-5"><Link to="/data/$kind" params={{kind:'transactions'}}><span className="text-left"><span className="mb-2 flex items-center gap-2 text-muted-foreground"><Wallet/> Closing valid</span><span className="block text-2xl font-bold">{data.revenue.label}</span></span><span className="flex items-center gap-3 text-positive">{Number(data.revenue.percent.toFixed(1)).toLocaleString('id-ID')}%<ArrowUpRight/></span></Link></Button></Section>}
   {canExportDaily(role)&&<DailyReportExport/>}
  {(role==='tl'||role==='sm')&&<Section title="Penanggung jawab lead">{data.leads.length?<div className="divide-y divide-border">{data.leads.slice(0,5).map(l=>{const se=staff(l.owner_id);return <Button asChild variant="ghost" key={l.id} className="h-auto w-full justify-start whitespace-normal py-4 text-left"><Link to="/data/$kind" params={{kind:'leads'}}>{leadAttribution(l.nickname,se,staff(se?.tl_id??null),role)}<ArrowUpRight className="ml-auto shrink-0"/></Link></Button>;})}</div>:<p className="text-sm text-muted-foreground">Belum ada lead operasional.</p>}</Section>}
  {(role==='dm'||role==='sm'||role==='dir'||role==='it')&&<Section title="Video AI">{data.videos.length?<div className="divide-y divide-border">{data.videos.slice(0,4).map(v=><article className="py-4" key={v.id}><p className="font-semibold">{v.title}</p>{v.status==='published'?<p className="mt-2 inline-block rounded-md border border-positive/20 bg-positive/10 px-3 py-2 text-sm text-positive">{publicationAttribution(staff(v.publisher_id),staff(v.tl_id))}</p>:<p className="mt-2 text-sm text-muted-foreground">Draf · belum dipublish</p>}</article>)}</div>:<p className="text-sm text-muted-foreground">Belum ada video AI tercatat.</p>}</Section>}
  <Button asChild variant="outline" className="mb-6 h-auto w-full justify-between whitespace-normal p-4"><Link to="/calendar" search={{filter:'survey'}}><span className="flex items-center gap-2"><CalendarDays/>Survei / Tur minggu ini</span><span className="flex items-center gap-3">{data.events.filter(e=>e.status==='active'&&(e.kind==='survey'||e.kind==='tour')&&new Date(e.starts_at).getTime()>=Date.now()&&new Date(e.starts_at).getTime()<Date.now()+7*86400000).length}<ArrowUpRight/></span></Link></Button>
  <Section title="Kalender & Agenda" action={<Button asChild variant="ghost"><Link to="/calendar" search={{filter:'all'}}><CalendarDays/>Semua agenda</Link></Button>}><Agenda compact/></Section>
 </>;
}