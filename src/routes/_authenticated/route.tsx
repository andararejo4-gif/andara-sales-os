import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { accountOptions } from '@/lib/account';
import { TicketModeGate } from '@/components/TicketModeGate';
export const Route=createFileRoute('/_authenticated')({
 ssr:false,
 beforeLoad:async({context})=>{
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user)throw redirect({to:'/auth',replace:true});
  const account=await context.queryClient.fetchQuery(accountOptions);
  return {account};
 },component:Layout,
});
function Layout(){const {account}=Route.useRouteContext();return <TicketModeGate role={account.role}><Outlet/></TicketModeGate>;}