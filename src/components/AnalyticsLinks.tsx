import {useState} from 'react';
import {useSuspenseQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {ArrowUpRight,Plus} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {revisionOptions} from '@/lib/revision-query';
import {accountOptions} from '@/lib/account';
import {saveAnalyticsLink} from '@/lib/leads.functions';
import {canManageAnalytics} from '@/lib/lead-rules';

export function AnalyticsLinks(){
 const {data}=useSuspenseQuery(revisionOptions),{data:account}=useSuspenseQuery(accountOptions),qc=useQueryClient(),save=useServerFn(saveAnalyticsLink);
 const [open,setOpen]=useState(false),[label,setLabel]=useState(''),[url,setUrl]=useState('');
 const mutation=useMutation({mutationFn:()=>save({data:{label,url}}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['revision']});setOpen(false);setLabel('');setUrl('');toast.success('Tautan analitik tersimpan.');},onError:error=>toast.error(error.message)});
 return <section className="mb-7 border-y border-border py-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Analitik media sosial</h2>{canManageAnalytics(account.role)&&<Button variant="outline" onClick={()=>setOpen(!open)}><Plus/>Tambah tautan</Button>}</div>{data.analytics.length?<div className="flex flex-wrap gap-2">{data.analytics.map(link=><Button asChild variant="outline" key={link.id}><a href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight/></a></Button>)}</div>:<p className="text-sm text-muted-foreground">Tautan perusahaan belum ditetapkan.</p>}{open&&<form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();mutation.mutate();}}><label className="text-sm font-medium">Nama kanal<Input required maxLength={100} className="mt-2" value={label} onChange={e=>setLabel(e.target.value)}/></label><label className="text-sm font-medium">Tautan analitik HTTPS<Input required type="url" className="mt-2" value={url} onChange={e=>setUrl(e.target.value)}/></label><Button type="submit" disabled={mutation.isPending}>Simpan tautan</Button></form>}</section>;
}