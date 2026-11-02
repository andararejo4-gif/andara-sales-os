import {useState} from 'react';
import {Link} from '@tanstack/react-router';
import {useMutation,useQueryClient,useSuspenseQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {id} from 'date-fns/locale';
import {format} from 'date-fns';
import {Bell,Check,MapPin,Plus,X} from 'lucide-react';
import {Calendar} from '@/components/ui/calendar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {revisionOptions} from '@/lib/revision-query';
import {accountOptions} from '@/lib/account';
import {createEvent,updateEvent,markReminder} from '@/lib/revision.functions';
import {jakartaDay} from '@/lib/revision';
import {toast} from 'sonner';
const kinds={survey:'Survei lokasi',tour:'Tur',follow_up:'Tindak lanjut'} as const;
export function Agenda({compact=false,filter='all'}:{compact?:boolean;filter?:string}){
 const {data}=useSuspenseQuery(revisionOptions),{data:account}=useSuspenseQuery(accountOptions);
 const qc=useQueryClient(),create=useServerFn(createEvent),update=useServerFn(updateEvent),mark=useServerFn(markReminder);
 const [selected,setSelected]=useState<Date|undefined>(new Date()),[open,setOpen]=useState(false),[title,setTitle]=useState(''),[kind,setKind]=useState<keyof typeof kinds>('survey'),[time,setTime]=useState('09:00'),[location,setLocation]=useState('');
 const refresh=()=>qc.invalidateQueries({queryKey:['revision']});
 const save=useMutation({mutationFn:()=>{if(!selected)throw new Error('Pilih tanggal.');return create({data:{title,kind,location,starts_at:new Date(`${format(selected,'yyyy-MM-dd')}T${time}:00+07:00`).toISOString()}});},onSuccess:()=>{void refresh();setOpen(false);setTitle('');setLocation('');toast.success('Agenda tersimpan.');},onError:()=>toast.error('Agenda belum tersimpan. Coba lagi.')});
 const change=useMutation({mutationFn:({eventId,status}:{eventId:string;status:'done'|'cancelled'})=>update({data:{id:eventId,status}}),onSuccess:refresh,onError:()=>toast.error('Agenda belum diperbarui.')});
 const seen=useMutation({mutationFn:(reminderId:string)=>mark({data:{id:reminderId}}),onSuccess:refresh});
 const events=data.events.filter(e=>e.status==='active'&&(filter==='all'||e.kind===filter));
 const day=selected?format(selected,'yyyy-MM-dd'):'';
 const todayEvents=events.filter(e=>jakartaDay(new Date(e.starts_at))===day);
 const reminderRows=data.reminders.filter(r=>!r.read_at&&events.some(e=>e.id===r.event_id));
 return <div>
  {reminderRows.length>0&&<div className="mb-5 space-y-2">{reminderRows.map(r=>{const event=events.find(e=>e.id===r.event_id);return <div key={r.id} className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/10 p-3"><Bell className="size-5 shrink-0 text-warning"/><p className="min-w-0 flex-1 break-words text-sm"><span className="font-semibold">{r.kind==='day_of'?'Hari H':'H-1'}</span> · {event?.title}</p><Button size="icon" variant="ghost" aria-label={`Tandai dibaca ${event?.title}`} disabled={seen.isPending} onClick={()=>seen.mutate(r.id)}><Check/></Button></div>;})}</div>}
  <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
   <Calendar locale={id} mode="single" selected={selected} onSelect={setSelected} modifiers={{agenda:events.map(e=>new Date(`${jakartaDay(new Date(e.starts_at))}T12:00:00`))}} modifiersClassNames={{agenda:'underline decoration-positive decoration-2 underline-offset-4'}} className="mx-auto rounded-md border border-border bg-card"/>
   <div className="min-w-0"><div className="mb-4 flex items-center justify-between gap-2"><h3 className="font-semibold">{selected?format(selected,'d MMMM yyyy',{locale:id}):'Pilih tanggal'}</h3>{!compact&&<Button aria-label="Tambah agenda" size="icon" onClick={()=>setOpen(!open)} disabled={!selected}>{open?<X/>:<Plus/>}</Button>}</div>
    {todayEvents.length?<div className="divide-y divide-border">{todayEvents.map(e=><article key={e.id} className="py-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm text-primary">{kinds[e.kind as keyof typeof kinds]} · {new Date(e.starts_at).toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'})} WIB</p><p className="mt-1 break-words font-semibold">{e.title}</p>{e.location&&<p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4"/>{e.location}</p>}</div>{!compact&&(e.owner_id===account.userId||account.role==='it')&&<div className="flex"><Button size="icon" variant="ghost" aria-label={`Selesaikan ${e.title}`} disabled={change.isPending} onClick={()=>change.mutate({eventId:e.id,status:'done'})}><Check/></Button><Button size="icon" variant="ghost" aria-label={`Batalkan ${e.title}`} disabled={change.isPending} onClick={()=>change.mutate({eventId:e.id,status:'cancelled'})}><X/></Button></div>}</div></article>)}</div>:<p className="py-6 text-sm text-muted-foreground">Tidak ada agenda pada tanggal ini.</p>}
    {compact&&<Button asChild variant="outline" className="mt-4 h-11"><Link to="/calendar" search={{filter:'all'}}><Plus/>Tambah agenda</Link></Button>}
    {open&&!compact&&<form className="mt-4 space-y-4 border-t border-border pt-5" onSubmit={e=>{e.preventDefault();save.mutate();}}><label className="block text-sm font-medium">Judul<Input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2"/></label><label className="block text-sm font-medium">Jenis<Select value={kind} onValueChange={v=>{if(v==='survey'||v==='tour'||v==='follow_up')setKind(v);}}><SelectTrigger className="mt-2"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(kinds).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></label><label className="block text-sm font-medium">Waktu (WIB)<Input required type="time" value={time} onChange={e=>setTime(e.target.value)} className="mt-2"/></label><label className="block text-sm font-medium">Lokasi<Input maxLength={500} value={location} onChange={e=>setLocation(e.target.value)} className="mt-2"/></label><Button type="submit" disabled={save.isPending}>Simpan agenda</Button></form>}
   </div>
  </div>
 </div>;
}