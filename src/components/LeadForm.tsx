import {useState} from 'react';
import {useMutation,useQueryClient,useSuspenseQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {useNavigate} from '@tanstack/react-router';
import {Save,Send} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {leadStatuses,leadFields,sourcesFor,sourceLabel,ticketClassOf,ticketLabels} from '@/lib/lead-rules';
import {saveLead,requestLeadChange} from '@/lib/leads.functions';
import {revisionOptions} from '@/lib/revision-query';
import type {AppRole} from '@/lib/roles';
import {useTicketMode} from '@/lib/ticket-mode';

type LeadDraft={id?:string;prospect_name?:string|null;nickname?:string|null;phone?:string|null;address?:string|null;source?:string|null;status?:string|null;owner_id?:string|null;estimated_value?:number|null};

export function LeadForm({lead,maintenance=false,role}:{lead?:LeadDraft;maintenance?:boolean;role?:AppRole|null}){
 const [name,setName]=useState(lead?.prospect_name||lead?.nickname||''),[phone,setPhone]=useState(lead?.phone||''),[address,setAddress]=useState(lead?.address||''),[source,setSource]=useState(lead?.source||'Day-to-day'),[status,setStatus]=useState(lead?.status||'LEAD'),[note,setNote]=useState(''),[ownerId,setOwnerId]=useState(lead?.owner_id||''),[nominal,setNominal]=useState(lead?.estimated_value?String(lead.estimated_value):'');
 const mode=useTicketMode(),qc=useQueryClient(),nav=useNavigate(),save=useServerFn(saveLead),request=useServerFn(requestLeadChange);
 const amount=Number(nominal||0),kelas=mode??ticketClassOf(amount),sources=sourcesFor(kelas),src=sources.some(s=>s===source)?source:sources[0]!,mismatch=!maintenance&&mode!==null&&ticketClassOf(amount)!==mode;
 const {data:revision}=useSuspenseQuery(revisionOptions);
 const staff=revision.staff.filter(s=>s.role==='se'||s.role==='sales_2'||s.role==='tl'||s.role==='tl_2');
 const canAssign=role==='sm'||role==='tl'||role==='tl_2';
 const mutation=useMutation({mutationFn:async()=>{const proposed=leadFields.parse({prospect_name:name,phone,address,source:src,status});if(maintenance&&lead){await request({data:{id:lead.id!,proposed,reason:note}});return{id:lead.id!};}return save({data:{...proposed,id:lead?.id,note,owner_id:ownerId||undefined,kelas,nominal:amount}});},onSuccess:async result=>{await qc.invalidateQueries({queryKey:['revision']});toast.success(maintenance?'Permintaan dikirim ke SM.':'Lead tersimpan.');await nav({to:'/lead/$id',params:{id:result.id}});},onError:error=>toast.error(error instanceof Error?error.message:'Lead belum tersimpan.')});
 return <form className="space-y-5" onSubmit={e=>{e.preventDefault();mutation.mutate();}}>
  <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Nama prospek<Input required maxLength={200} value={name} onChange={e=>setName(e.target.value)} autoComplete="off" className="mt-2"/></label><label className="text-sm font-medium">Telp<Input required type="tel" minLength={6} maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2"/></label></div>
  <label htmlFor="lead-address" className="block text-sm font-medium">Alamat</label><Textarea id="lead-address" required maxLength={500} value={address} onChange={e=>setAddress(e.target.value)} className="mt-2"/>
  <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Sumber leads<Select value={src} onValueChange={setSource}><SelectTrigger className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent>{sources.map(s=><SelectItem key={s} value={s}>{sourceLabel(s)}</SelectItem>)}</SelectContent></Select></label><label className="text-sm font-medium">Status pipeline<Select value={status} onValueChange={setStatus}><SelectTrigger className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent>{leadStatuses.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label></div>
  {canAssign&&!maintenance&&<label className="block text-sm font-medium">Pemilik (SE/TL)<Select value={ownerId} onValueChange={setOwnerId}><SelectTrigger className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="">Diri sendiri</SelectItem>{staff.map(s=><SelectItem key={s.user_id} value={s.user_id}>{s.role==='se'||s.role==='sales_2'?'SE':'TL'} {s.staff_code} {s.staff_name}</SelectItem>)}</SelectContent></Select></label>}
  {!maintenance&&<label className="block text-sm font-medium">Nominal perkiraan (Rp)<Input required type="number" min="0" step="1" inputMode="numeric" value={nominal} onChange={e=>setNominal(e.target.value)} className="mt-2"/>{mismatch&&mode&&<span role="alert" className="mt-2 block text-sm text-destructive">Nominal tidak sesuai mode {ticketLabels[mode]}. Ganti mode dari header atau ubah nominal.</span>}</label>}
  <label htmlFor="lead-note" className="block text-sm font-medium">{maintenance?'Alasan perubahan':'Detail aktivitas'}</label><Textarea id="lead-note" required={maintenance} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} className="mt-2"/>
  <Button type="submit" disabled={mutation.isPending||mismatch} className="min-h-11 w-full sm:w-auto">{maintenance?<Send/>:<Save/>}{mutation.isPending?'Menyimpan…':maintenance?'Minta persetujuan SM':lead?'Simpan pembaruan':'Simpan leads baru'}</Button>
 </form>;
}