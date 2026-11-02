import {useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {useNavigate} from '@tanstack/react-router';
import {Save,Send} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {leadSources,leadStatuses,leadFields} from '@/lib/lead-rules';
import {saveLead,requestLeadChange} from '@/lib/leads.functions';
import type {Tables} from '@/integrations/supabase/types';

export function LeadForm({lead,maintenance=false}:{lead?:Tables<'sales_leads'>;maintenance?:boolean}){
 const [name,setName]=useState(lead?.prospect_name||lead?.nickname||''),[phone,setPhone]=useState(lead?.phone||''),[address,setAddress]=useState(lead?.address||''),[source,setSource]=useState(lead?.source||'Day-to-day'),[status,setStatus]=useState(lead?.status||'LEAD'),[note,setNote]=useState('');
 const qc=useQueryClient(),nav=useNavigate(),save=useServerFn(saveLead),request=useServerFn(requestLeadChange);
 const mutation=useMutation({mutationFn:async()=>{const proposed=leadFields.parse({prospect_name:name,phone,address,source,status});if(maintenance&&lead){await request({data:{id:lead.id,proposed,reason:note}});return{id:lead.id};}return save({data:{...proposed,id:lead?.id,note}});},onSuccess:async result=>{await qc.invalidateQueries({queryKey:['revision']});toast.success(maintenance?'Permintaan dikirim ke SM.':'Lead tersimpan.');await nav({to:'/lead/$id',params:{id:result.id}});},onError:error=>toast.error(error instanceof Error?error.message:'Lead belum tersimpan.')});
 return <form className="space-y-5" onSubmit={e=>{e.preventDefault();mutation.mutate();}}>
  <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Nama prospek<Input required maxLength={200} value={name} onChange={e=>setName(e.target.value)} autoComplete="off" className="mt-2"/></label><label className="text-sm font-medium">Telp<Input required type="tel" minLength={6} maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2"/></label></div>
  <label htmlFor="lead-address" className="block text-sm font-medium">Alamat</label><Textarea id="lead-address" required maxLength={500} value={address} onChange={e=>setAddress(e.target.value)} className="mt-2"/>
  <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Sumber leads<Select value={source} onValueChange={setSource}><SelectTrigger className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent>{leadSources.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label><label className="text-sm font-medium">Status pipeline<Select value={status} onValueChange={setStatus}><SelectTrigger className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent>{leadStatuses.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label></div>
  <label htmlFor="lead-note" className="block text-sm font-medium">{maintenance?'Alasan perubahan':'Detail aktivitas'}</label><Textarea id="lead-note" required={maintenance} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} className="mt-2"/>
  <Button type="submit" disabled={mutation.isPending} className="min-h-11 w-full sm:w-auto">{maintenance?<Send/>:<Save/>}{mutation.isPending?'Menyimpan…':maintenance?'Minta persetujuan SM':lead?'Simpan pembaruan':'Simpan leads baru'}</Button>
 </form>;
}