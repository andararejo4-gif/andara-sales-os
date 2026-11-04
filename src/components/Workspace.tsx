import { useState,type FormEvent } from 'react';
import { useMutation,useQueryClient,useSuspenseQuery,queryOptions } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ClipboardList,Plus,CheckCircle2,Clock } from 'lucide-react';
import { AppShell,Section } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { accountOptions } from '@/lib/account';
import { listWork,addWork,updateWork } from '@/lib/work.functions';
import { workspaceAllowed,workspaces,workspaceMetrics,type Workspace as WorkspaceKey } from '@/lib/roles';
import { toast } from 'sonner';
import { RevisionDashboard } from '@/components/RevisionDashboard';
import { DailyReportExport } from '@/components/DailyReportExport';
export const workOptions=(feature:WorkspaceKey)=>queryOptions({queryKey:['work',feature],queryFn:()=>listWork({data:{feature}})});
const statuses={pending:'Menunggu',in_progress:'Dikerjakan',done:'Selesai'} as const;
export function Workspace({feature}: {feature:WorkspaceKey}) {
 const {data:account}=useSuspenseQuery(accountOptions);const {data:items}=useSuspenseQuery(workOptions(feature));
 const qc=useQueryClient(),create=useServerFn(addWork),update=useServerFn(updateWork);
 const [title,setTitle]=useState(''),[note,setNote]=useState(''),[open,setOpen]=useState(false);
 const writable=account.role&&workspaceAllowed(account.role,feature,true),config=workspaces[feature];
 const save=useMutation({mutationFn:()=>create({data:{feature,title,note}}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['work',feature]});setOpen(false);setTitle('');setNote('');toast.success('Pekerjaan tersimpan.');},onError:()=>toast.error('Belum tersimpan. Coba lagi.')});
 const change=useMutation({mutationFn:({id,status}:{id:string,status:'pending'|'in_progress'|'done'})=>update({data:{id,status}}),onSuccess:()=>qc.invalidateQueries({queryKey:['work',feature]}),onError:()=>toast.error('Status belum tersimpan. Coba lagi.')});
 function submit(e:FormEvent){e.preventDefault();save.mutate();}
 return <AppShell title={config.title} subtitle={account.role?`${account.email} · ${writable?'Ruang kerja':'Hanya lihat'}`:undefined} hideFab>
  <RevisionDashboard/>
  <Section title={config.sections[0]} action={writable?<Button className="h-11" onClick={()=>setOpen(!open)}><Plus/>{open?'Batal':'Tambah'}</Button>:undefined}>
   {open&&<form onSubmit={submit} className="mb-6 space-y-4 border-y border-border py-5"><label className="block text-[13px] font-semibold">Judul pekerjaan<Input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 h-12 bg-card"/></label><label className="block text-[13px] font-semibold">Catatan<Textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} className="mt-2 bg-card"/></label><Button disabled={save.isPending} className="h-11" type="submit">Simpan</Button></form>}
   {items.length===0?<div className="flex flex-col items-center border-y border-border py-10 text-center"><ClipboardList className="mb-3 size-8 text-muted-foreground"/><p className="font-semibold">Belum ada pekerjaan tercatat</p>{writable&&<Button variant="link" className="mt-2 h-11" onClick={()=>setOpen(true)}><Plus/>Tambah pekerjaan</Button>}</div>:<div className="divide-y divide-border">{items.map(i=><article key={i.id} className="flex flex-wrap items-start gap-3 py-4">{i.status==='done'?<CheckCircle2 className="mt-1 size-5 text-success"/>:<Clock className="mt-1 size-5 text-warning"/>}<div className="min-w-0 flex-1"><p className="break-words font-semibold">{i.title}</p><p className="mt-1 whitespace-pre-wrap break-words text-[13px] text-muted-foreground">{i.note}</p></div>{writable&&i.owner_id===account.userId?<Select disabled={change.isPending} value={i.status} onValueChange={v=>{if(v==='pending'||v==='in_progress'||v==='done')change.mutate({id:i.id,status:v});}}><SelectTrigger aria-label={`Status ${i.title}`} className="h-11 w-36 bg-card"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(statuses).map(([key,label])=><SelectItem value={key} key={key}>{label}</SelectItem>)}</SelectContent></Select>:<span className="text-[13px] text-muted-foreground">{statuses[i.status as keyof typeof statuses]}</span>}</article>)}</div>}
  </Section>
  <div className="grid gap-6 md:grid-cols-2">{config.sections.slice(1).map((section,i)=><Section title={section} key={section}><p className="text-[13px] text-muted-foreground">{i===2?'Belum ada laporan kemarin.':'Belum ada data.'}</p></Section>)}</div>
  <DailyReportExport/>
 </AppShell>;
}