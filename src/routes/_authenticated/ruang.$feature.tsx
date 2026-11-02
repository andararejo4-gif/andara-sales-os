import { createFileRoute,redirect } from '@tanstack/react-router';
import { workspaces,workspaceAllowed,type Workspace as WorkspaceKey } from '@/lib/roles';
import { Workspace,workOptions } from '@/components/Workspace';
function validFeature(value:string): value is WorkspaceKey {return Object.keys(workspaces).some(k=>k===value);}
export const Route=createFileRoute('/_authenticated/ruang/$feature')({
 beforeLoad:({params,context})=>{if(!validFeature(params.feature)||!context.account.role||!workspaceAllowed(context.account.role,params.feature))throw redirect({to:'/dashboard',replace:true});return{feature:params.feature};},
 loader:({context})=>context.queryClient.ensureQueryData(workOptions(context.feature)),
 head:({params})=>{const title=validFeature(params.feature)?workspaces[params.feature].title:'Ruang Kerja';return{meta:[{title:`${title} — Andara Sales OS`},{name:'description',content:`Ruang kerja ${title} untuk tim Andara.`},{property:'og:title',content:`${title} — Andara Sales OS`},{property:'og:description',content:`Prioritas dan pekerjaan ${title}.`},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]};},
 component:WorkspacePage,
});
function WorkspacePage(){const {feature}=Route.useRouteContext();return <Workspace feature={feature}/>;}