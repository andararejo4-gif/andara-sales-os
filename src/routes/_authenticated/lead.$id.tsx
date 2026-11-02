import {useState} from 'react';
import {createFileRoute,redirect,Link,notFound} from '@tanstack/react-router';
import {useSuspenseQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {Pencil,CheckCircle,Phone,MapPin} from 'lucide-react';
import {toast} from 'sonner';
import {AppShell,Section,StatusBadge} from '@/components/AppShell';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {LeadForm} from '@/components/LeadForm';
import {LeadChanges} from '@/components/LeadChanges';
import {revisionOptions} from '@/lib/revision-query';
import {canWriteLeads,canVerifyLeads} from '@/lib/lead-rules';
import {verifyLead} from '@/lib/leads.functions';
import {samarkan,type Status} from '@/lib/data';
export const Route=createFileRoute('/_authenticated/lead/$id')({
 beforeLoad:({context})=>{if(!context.account.role||context.account.role==='dm')throw redirect({to:'/dashboard'});},
 loader:async({context,params})=>{const data=await context.queryClient.ensureQueryData(revisionOptions);if(!data.leads.some(l=>l.id===params.id))throw notFound();},
 head:()=>({meta:[{title:'Rincian Prospek — Andara Sales OS'},{name:'description',content:'Biodata, pipeline, riwayat aktivitas dan verifikasi lead.'},{property:'og:title',content:'Rincian Prospek — Andara Sales OS'},{property:'og:description',content:'Kelola dan verifikasi lead sesuai hak akses.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 notFoundComponent:()=> <div className="p-10 text-center">Lead tidak ditemukan. <Link to="/lead">Kembali</Link></div>,component:LeadDetail,
});
function LeadDetail(){
 const {data}=useSuspenseQuery(revisionOptions),{account}=Route.useRouteContext(),{id}=Route.useParams();
 const lead=data.leads.find(l=>l.id===id),[editing,setEditing]=useState(false),[value,setValue]=useState(''),qc=useQueryClient(),verify=useServerFn(verifyLead);
 const mutation=useMutation({mutationFn:()=>verify({data:{id,value:Number(value)}}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['revision']});toast.success('Nilai lead terverifikasi.');},onError:error=>toast.error(error.message)});
 if(!lead)return null;
 const writable=canWriteLeads(account.role)&&(account.role!=='se'||lead.owner_id===account.userId);
 return <AppShell title={lead.nickname} subtitle={data.projects.find(p=>p.id===lead.project_id)?.name} hideFab>
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><StatusBadge status={lead.status as Status}/>{(writable||account.role==='it')&&<Button variant="outline" onClick={()=>setEditing(!editing)}><Pencil/>{account.role==='it'?'Ajukan perubahan':'Update Leads/Prospek'}</Button>}</div>
 {editing?<LeadForm key={lead.id} lead={lead} maintenance={account.role==='it'}/>:<><dl className="mb-7 grid gap-4 border-y border-border py-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Nama prospek</dt><dd className="mt-1 font-medium">{lead.prospect_name||lead.nickname}</dd></div><div><dt className="flex gap-2 text-sm text-muted-foreground"><Phone className="size-4"/>Telp</dt><dd className="mt-1">{lead.phone?samarkan(lead.phone):'—'}</dd></div><div><dt className="flex gap-2 text-sm text-muted-foreground"><MapPin className="size-4"/>Alamat</dt><dd className="mt-1 break-words">{lead.address||'—'}</dd></div><div><dt className="text-sm text-muted-foreground">Sumber leads</dt><dd className="mt-1">{lead.source}</dd></div></dl>
 <Section title="Verifikasi nilai lead"><p className="mb-3">Rp {Number(lead.lead_value).toLocaleString('id-ID')} · {lead.verified_at?'Terverifikasi':'Belum diverifikasi'}</p>{canVerifyLeads(account.role)&&<form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();mutation.mutate();}}><label className="text-sm font-medium">Nilai lead (Rp)<Input required min="0" type="number" value={value} onChange={e=>setValue(e.target.value)} className="mt-2"/></label><Button disabled={mutation.isPending} type="submit"><CheckCircle/>Konfirmasi nilai</Button></form>}</Section>
 <Section title="Riwayat aktivitas">{data.activities.filter(a=>a.lead_id===id).map(a=><article key={a.id} className="border-b border-border py-4"><p className="font-medium">{a.kind}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(a.occurred_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</p><p className="mt-2 break-words">{a.note||'—'}</p></article>)}</Section></>}
 <LeadChanges leadId={id}/>
 </AppShell>;
}
