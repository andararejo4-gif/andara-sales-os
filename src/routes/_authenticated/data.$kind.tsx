import {useState} from 'react';
import {createFileRoute,redirect} from '@tanstack/react-router';
import {useSuspenseQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {Plus,ArrowUpRight} from 'lucide-react';
import {AppShell} from '@/components/AppShell';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {accountOptions} from '@/lib/account';
import {revisionOptions} from '@/lib/revision-query';
import {recordLabels,type RecordKind,leadAttribution,publicationAttribution,rupiahShort} from '@/lib/revision';
import {canCreateProject} from '@/lib/roles';
import {createProject} from '@/lib/revision.functions';
import {DailyReportExport} from '@/components/DailyReportExport';
import {toast} from 'sonner';
import {Link} from '@tanstack/react-router';
import {AnalyticsLinks} from '@/components/AnalyticsLinks';
import {canWriteLeads} from '@/lib/lead-rules';
function isKind(value:string):value is RecordKind{return value in recordLabels;}
export const Route=createFileRoute('/_authenticated/data/$kind')({beforeLoad:({params,context})=>{if(!isKind(params.kind)||!context.account.role||(params.kind==='audit'&&context.account.role!=='it')||(context.account.role==='dm'&&['leads','transactions','activities','staff'].includes(params.kind)))throw redirect({to:'/dashboard'});return{kind:params.kind};},loader:({context})=>context.queryClient.ensureQueryData(revisionOptions),head:({params})=>{const title=isKind(params.kind)?recordLabels[params.kind]:'Data Andara';return{meta:[{title:`${title} — Andara Sales OS`},{name:'description',content:`Catatan operasional ${title} sesuai lingkup jabatan.`},{property:'og:title',content:`${title} — Andara Sales OS`},{property:'og:description',content:`Rincian ${title} Andara.`},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]};},component:Records});
function Records(){
 const {kind}=Route.useRouteContext(),{data}=useSuspenseQuery(revisionOptions),{data:account}=useSuspenseQuery(accountOptions);
 const role=account.role,qc=useQueryClient(),create=useServerFn(createProject);
 const [open,setOpen]=useState(false),[name,setName]=useState(''),[target,setTarget]=useState('');
 const save=useMutation({mutationFn:()=>create({data:{name,target:Number(target)}}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['revision']});setOpen(false);setName('');setTarget('');toast.success('Proyek tersimpan.');},onError:()=>toast.error('Proyek belum tersimpan.')});
 const staff=(id:string|null)=>data.staff.find(s=>s.user_id===id);
 const rows:{id:string;title:string;detail:string;badge?:string;url?:string|null}[]=kind==='projects'?data.projects.map(p=>({id:p.id,title:p.name,detail:`Target ${rupiahShort(Number(p.target_amount))}`})):kind==='leads'?data.leads.map(l=>{const se=staff(l.owner_id);return{id:l.id,title:role==='tl'||role==='tl_2'||role==='sm'?leadAttribution(l.nickname,se,staff(se?.tl_id??null),role):l.nickname,detail:l.status};}):kind==='transactions'?data.transactions.map(t=>({id:t.id,title:`${rupiahShort(Number(t.amount))} · ${t.status}`,detail:`${t.closed_on} · ${data.projects.find(p=>p.id===t.project_id)?.name??'Proyek'}`})):kind==='activities'?data.activities.map(a=>({id:a.id,title:`${a.kind} · ${staff(a.owner_id)?.staff_name||'Sales'}`,detail:`${new Date(a.occurred_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} · ${a.note}`})):kind==='videos'?data.videos.map(v=>({id:v.id,title:v.title,detail:v.status==='published'?'Bank Konten · Dipublikasikan':'Bank Konten · Draf',badge:v.status==='published'?publicationAttribution(staff(v.publisher_id),staff(v.tl_id)):undefined,url:v.asset_url})):kind==='staff'?data.staff.map(s=>({id:s.user_id,title:`${s.role.toUpperCase()} ${s.staff_code} ${s.staff_name||'Nama belum ditetapkan'}`,detail:s.tl_id?`TL ${staff(s.tl_id)?.staff_name||'Belum lengkap'}`:'—'})):data.audit.map(a=>({id:a.id,title:a.action,detail:`${new Date(a.created_at).toLocaleString('id-ID')} · ${a.record_id??'—'}`}));
 return <AppShell title={recordLabels[kind]} hideFab>
  {kind==='videos'&&<AnalyticsLinks/>}
  {kind==='leads'&&canWriteLeads(role)&&<Button asChild className="mb-5"><Link to="/aktivitas/baru"><Plus/>Leads Baru</Link></Button>}
  {kind==='projects'&&role&&canCreateProject(role)&&<div className="mb-6"><Button onClick={()=>setOpen(!open)}><Plus/>Tambah proyek</Button>{open&&<form className="mt-5 space-y-4 border-y border-border py-5" onSubmit={e=>{e.preventDefault();save.mutate();}}><label className="block text-sm font-medium">Nama proyek<Input required maxLength={200} value={name} onChange={e=>setName(e.target.value)} className="mt-2"/></label><label className="block text-sm font-medium">Target omzet bulanan (Rp)<Input required type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)} className="mt-2"/></label><Button type="submit" disabled={save.isPending}>Simpan proyek</Button></form>}</div>}
   {kind==='activities'&&<DailyReportExport/>}
  {rows.length?<div className="divide-y divide-border">{rows.map(row=><article key={row.id} className="py-5"><p className="break-words font-semibold">{kind==='leads'?<Link to="/lead/$id" params={{id:row.id}} className="text-primary">{row.title}</Link>:row.title}</p><p className="mt-2 break-words text-sm text-muted-foreground">{row.detail}</p>{row.badge&&<p className="mt-3 inline-block rounded-md bg-positive px-3 py-2 text-sm font-medium text-primary-foreground">{row.badge}</p>}{row.url&&<Button asChild variant="link"><a href={row.url} target="_blank" rel="noreferrer">Lihat konten<ArrowUpRight/></a></Button>}</article>)}</div>:<p className="border-y border-border py-12 text-center text-muted-foreground">Belum ada catatan operasional.</p>}
 </AppShell>;
}