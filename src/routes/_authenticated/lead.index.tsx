import {createFileRoute,redirect,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ArrowRight,Plus} from 'lucide-react';
import {AppShell,StatusBadge} from '@/components/AppShell';
import {Button} from '@/components/ui/button';
import {revisionOptions} from '@/lib/revision-query';
import {canWriteLeads,leadStatuses,sourceLabel} from '@/lib/lead-rules';
import {leadAttribution,seMetrics} from '@/lib/revision';
import type {Status} from '@/lib/data';
import {matchesTicketMode,useTicketMode} from '@/lib/ticket-mode';
export const Route=createFileRoute('/_authenticated/lead/')({
 beforeLoad:({context})=>{if(!context.account.role||context.account.role==='dm')throw redirect({to:'/dashboard'});},
 loader:({context})=>context.queryClient.ensureQueryData(revisionOptions),
 head:()=>({meta:[{title:'Lead & Pipeline — Andara Sales OS'},{name:'description',content:'Prospek operasional dan penanggung jawab dalam lingkup Anda.'},{property:'og:title',content:'Lead & Pipeline — Andara Sales OS'},{property:'og:description',content:'Pipeline penjualan dan verifikasi prospek Andara.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:LeadList,
});
function LeadList(){
 const {data:all}=useSuspenseQuery(revisionOptions),{account}=Route.useRouteContext(),mode=useTicketMode(),data={...all,leads:all.leads.filter(l=>matchesTicketMode(l.ticket_class,mode))};
 const staff=(id:string|null)=>data.staff.find(s=>s.user_id===id);
 return <AppShell title="Lead & Pipeline" subtitle={`${data.leads.length} prospek`} hideFab>
 {canWriteLeads(account.role)&&<Button asChild className="mb-6 min-h-11"><Link to="/aktivitas/baru"><Plus/>Leads Baru</Link></Button>}
 {(account.role==='se'||account.role==='sales_2')&&<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{seMetrics(data.leads.filter(l=>l.owner_id===account.userId),new Date()).map(m=><div key={m.label} className="border-l-2 border-primary pl-3"><p className="text-2xl font-bold">{m.value}</p><p className="text-[13px] text-muted-foreground">{m.label}</p></div>)}</div>}
 <div className="mb-6 flex flex-wrap gap-2">{leadStatuses.filter(status=>data.leads.some(l=>l.status===status)).map(status=><span key={status} className="text-sm text-muted-foreground">{status} · {data.leads.filter(l=>l.status===status).length}</span>)}</div>
 {data.leads.length?<div className="divide-y divide-border">{data.leads.map(lead=>{const se=staff(lead.owner_id);return <Button asChild variant="ghost" key={lead.id} className="h-auto w-full justify-between whitespace-normal border-b border-border py-5 text-left"><Link to="/lead/$id" params={{id:lead.id}}><span className="min-w-0 flex-1"><span className="block break-words font-semibold">{account.role==='tl'||account.role==='tl_2'||account.role==='sm'?leadAttribution(lead.nickname,se,staff(se?.tl_id??null),account.role):lead.nickname}</span><span className="mt-2 block text-sm text-muted-foreground">{sourceLabel(lead.source)} · Rp {Number(lead.estimated_value).toLocaleString("id-ID")} · {lead.verified_at?'Terverifikasi':'Belum diverifikasi'}</span></span><span className="ml-3 flex shrink-0 items-center gap-2"><StatusBadge status={lead.status as Status}/><ArrowRight className="size-4"/></span></Link></Button>;})}</div>:<p className="border-y border-border py-12 text-center text-muted-foreground">Belum ada lead operasional.</p>}
 </AppShell>;
}
