import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { accountOptions } from '@/lib/account';
export const Route=createFileRoute('/_authenticated')({
 ssr:false,
 beforeLoad:async({context})=>{
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user)throw redirect({to:'/auth',replace:true});
  const account=await context.queryClient.fetchQuery(accountOptions);
  return {account};
 },component:Outlet,
});