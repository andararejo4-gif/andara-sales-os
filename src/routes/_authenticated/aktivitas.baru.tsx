import {createFileRoute,redirect} from '@tanstack/react-router';
import {AppShell} from '@/components/AppShell';
import {LeadForm} from '@/components/LeadForm';
import {canWriteLeads} from '@/lib/lead-rules';
import {revisionOptions} from '@/lib/revision-query';
export const Route=createFileRoute('/_authenticated/aktivitas/baru')({
 beforeLoad:({context})=>{if(!canWriteLeads(context.account.role))throw redirect({to:'/dashboard'});},
 loader:({context})=>context.queryClient.ensureQueryData(revisionOptions),
 head:()=>({meta:[{title:'Leads Baru — Andara Sales OS'},{name:'description',content:'Biodata prospek dan detail aktivitas penjualan Andara.'},{property:'og:title',content:'Leads Baru — Andara Sales OS'},{property:'og:description',content:'Pencatatan prospek dan sumber leads.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:LeadsBaru,
});
function LeadsBaru(){const {account}=Route.useRouteContext();return <AppShell title="Leads Baru" hideFab><div className="mx-auto max-w-2xl"><LeadForm role={account.role}/></div></AppShell>;}