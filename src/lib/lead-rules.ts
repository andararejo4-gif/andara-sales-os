import {z} from 'zod';
import type {AppRole} from '@/lib/roles';

export const leadSources=['Day-to-day','Call','Chat','Posting','Indoor'] as const;
export const leadStatuses=['NA','NO','ENG','LEAD','QL','HOT','VISIT','BOOK','CV','NURTURE','LOST'] as const;
export const leadFields=z.object({prospect_name:z.string().trim().min(1).max(200),phone:z.string().trim().min(6).max(30),address:z.string().trim().min(1).max(500),source:z.enum(leadSources),status:z.enum(leadStatuses)});
export const LARGE_TICKET_THRESHOLD=500_000_000;
export const ticketClasses=['REGULER','BESAR'] as const;
export type TicketClass=(typeof ticketClasses)[number];
export const ticketLabels:Record<TicketClass,string>={REGULER:'Tiket ≤ 500 jt',BESAR:'Tiket > 500 jt'};
export function ticketClassOf(value:number):TicketClass{return value>LARGE_TICKET_THRESHOLD?'BESAR':'REGULER';}
export function usesTicketMode(role:AppRole|null){return role==='se'||role==='tl'||role==='sales_2'||role==='tl_2';}
export const sourceLabels:Record<string,string>={'Day-to-day':'Door to Door (D2D)'};
export function sourceLabel(source:string){return sourceLabels[source]??source;}
export function sourcesFor(kelas:TicketClass){return kelas==='BESAR'?leadSources.filter(s=>s==='Posting'||s==='Indoor'):[...leadSources];}
export const leadInput=leadFields.extend({id:z.string().uuid().optional(),note:z.string().trim().max(2000).default(''),owner_id:z.string().uuid().optional(),kelas:z.enum(ticketClasses).default('REGULER'),nominal:z.number().finite().nonnegative().max(1_000_000_000_000).default(0)}).refine(v=>ticketClassOf(v.nominal)===v.kelas,{message:'Nominal tidak sesuai kelas tiket.',path:['nominal']}).refine(v=>sourcesFor(v.kelas).some(s=>s===v.source),{message:'Sumber tidak tersedia untuk tiket di atas 500 jt.',path:['source']});
export function canWriteLeads(role:AppRole|null){return role==='se'||role==='sales_2'||role==='tl'||role==='tl_2'||role==='sm';}
export function canVerifyLeads(role:AppRole|null){return role==='adm'||role==='tl'||role==='tl_2';}
export function canApplyMaintenance(role:AppRole|null,status:string){return role==='it'&&status==='approved';}
export function canManageAnalytics(role:AppRole|null){return role==='sm'||role==='it';}
export const analyticsInput=z.object({label:z.string().trim().min(1).max(100),url:z.string().url().refine(value=>new URL(value).protocol==='https:','Gunakan tautan HTTPS.')});