import {useSuspenseQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {Check,X,Play} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {revisionOptions} from '@/lib/revision-query';
import {accountOptions} from '@/lib/account';
import {applyLeadChange,reviewLeadChange} from '@/lib/leads.functions';
import {canApplyMaintenance} from '@/lib/lead-rules';

export function LeadChanges({leadId}:{leadId?:string}){
 const {data}=useSuspenseQuery(revisionOptions),{data:account}=useSuspenseQuery(accountOptions),qc=useQueryClient(),review=useServerFn(reviewLeadChange),apply=useServerFn(applyLeadChange);
 const mutation=useMutation({mutationFn:({id,action}:{id:string;action:'approve'|'reject'|'apply'})=>action==='apply'?apply({data:{id}}):review({data:{id,approve:action==='approve'}}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['revision']});toast.success('Permintaan diperbarui.');},onError:error=>toast.error(error.message)});
 const rows=data.changes.filter(c=>!leadId||c.lead_id===leadId);
 if(!rows.length)return null;
 const labels:Record<string,string>={pending:'Menunggu SM',approved:'Disetujui SM',rejected:'Ditolak',applied:'Sudah diterapkan'};
 return <section className="mt-7 border-t border-border pt-5"><h2 className="mb-3 font-semibold">Permintaan perubahan IT</h2><div className="divide-y divide-border">{rows.map(row=><article className="py-4" key={row.id}><p className="font-medium">{data.leads.find(l=>l.id===row.lead_id)?.nickname||'Lead'} · {labels[row.status]}</p><p className="mt-2 break-words text-sm text-muted-foreground">{row.reason}</p><dl className="mt-3 grid gap-1 text-sm">{row.proposed&&typeof row.proposed==='object'&&!Array.isArray(row.proposed)&&Object.entries(row.proposed).map(([key,value])=><div key={key} className="flex flex-wrap gap-2"><dt className="text-muted-foreground">{{prospect_name:'Nama',phone:'Telp',address:'Alamat',source:'Sumber',status:'Status'}[key]??key}:</dt><dd className="break-all">{String(value??'')}</dd></div>)}</dl><div className="mt-3 flex flex-wrap gap-2">{account.role==='sm'&&row.status==='pending'&&<><Button disabled={mutation.isPending} onClick={()=>mutation.mutate({id:row.id,action:'approve'})}><Check/>Setujui</Button><Button variant="outline" disabled={mutation.isPending} onClick={()=>mutation.mutate({id:row.id,action:'reject'})}><X/>Tolak</Button></>}{canApplyMaintenance(account.role,row.status)&&<Button disabled={mutation.isPending} onClick={()=>mutation.mutate({id:row.id,action:'apply'})}><Play/>Terapkan perubahan</Button>}</div></article>)}</div></section>;
}