import type {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {SignOut} from '@/components/SignOut';
import {ticketLabels,ticketClasses,usesTicketMode} from '@/lib/lead-rules';
import {setTicketMode,useTicketMode} from '@/lib/ticket-mode';
import type {AppRole} from '@/lib/roles';

export function TicketModeGate({role,children}:{role:AppRole|null;children:ReactNode}){
 const mode=useTicketMode();
 if(!usesTicketMode(role)||mode)return <>{children}</>;
 return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 py-10">
  <h1 className="text-[28px] font-bold">Pilih kelas tiket</h1>
  <p className="text-muted-foreground">Pilih jenis lead yang Anda kerjakan hari ini. Pilihan dapat diganti kapan saja dari header.</p>
  {ticketClasses.map(c=><Button key={c} className="h-16 text-base" variant={c==='BESAR'?'default':'outline'} onClick={()=>setTicketMode(c)}>{ticketLabels[c]}</Button>)}
  <div className="mt-2"><SignOut/></div>
 </main>;
}
