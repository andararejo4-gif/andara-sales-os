import {useState} from 'react';
import {useMutation,useQueryClient,useSuspenseQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Section} from '@/components/AppShell';
import {revisionOptions} from '@/lib/revision-query';
import {saveTarget} from '@/lib/revision.functions';
import {jakartaDay,rupiahShort} from '@/lib/revision';

export function SalesTarget(){
 const {data}=useSuspenseQuery(revisionOptions),qc=useQueryClient(),save=useServerFn(saveTarget);
 const month=jakartaDay(new Date()).slice(0,7);
 const [userId,setUserId]=useState(''),[amount,setAmount]=useState('');
 const members=data.staff.filter(s=>s.role==='se'||s.role==='sales_2'||s.role==='tl'||s.role==='tl_2');
 const mutation=useMutation({mutationFn:()=>save({data:{userId,month,amount:Number(amount)}}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['revision']});setAmount('');toast.success('Target tersimpan.');},onError:error=>toast.error(error.message)});
 return <Section title={`Target omzet ${month}`}>
  <form className="space-y-4" onSubmit={e=>{e.preventDefault();mutation.mutate();}}>
   <label className="block text-sm font-medium">Anggota<Select value={userId} onValueChange={setUserId}><SelectTrigger className="mt-2 w-full"><SelectValue placeholder="Pilih SE / TL"/></SelectTrigger><SelectContent>{members.map(s=><SelectItem key={s.user_id} value={s.user_id}>{s.role.startsWith('tl')?'TL':'SE'} {s.staff_code} {s.staff_name}</SelectItem>)}</SelectContent></Select></label>
   <label className="block text-sm font-medium">Target omzet (Rp)<Input required type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-2"/></label>
   <Button type="submit" className="min-h-11" disabled={mutation.isPending||!userId||!amount}>Simpan target</Button>
  </form>
  {data.targets.filter(t=>t.month===month).length>0&&<div className="mt-5 divide-y divide-border">{data.targets.filter(t=>t.month===month).map(t=>{const s=data.staff.find(x=>x.user_id===t.user_id);return <p key={t.id} className="flex justify-between gap-3 py-3 text-sm"><span>{s?.staff_code} {s?.staff_name}</span><span className="font-semibold">{rupiahShort(t.amount)}</span></p>;})}</div>}
 </Section>;
}
