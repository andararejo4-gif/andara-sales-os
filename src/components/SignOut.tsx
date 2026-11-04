import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setTicketMode } from '@/lib/ticket-mode';
export function SignOut() {
 const qc=useQueryClient(), navigate=useNavigate();
 return <Button variant="ghost" className="h-11" title="Keluar" onClick={async()=>{
  await qc.cancelQueries(); qc.clear(); setTicketMode(null);
  const {error}=await supabase.auth.signOut();
  if(error){toast.error('Belum berhasil keluar. Coba lagi.');return;}
  await navigate({to:'/auth',replace:true});
 }}><LogOut/>Keluar</Button>;
}