import {z} from 'zod';
import type {AppRole} from '@/lib/roles';

export const leadSources=['Day-to-day','Call','Chat','Posting','Indoor'] as const;
export const leadStatuses=['NA','NO','ENG','LEAD','QL','HOT','VISIT','BOOK','CV','NURTURE','LOST'] as const;
export const leadFields=z.object({prospect_name:z.string().trim().min(1).max(200),phone:z.string().trim().min(6).max(30),address:z.string().trim().min(1).max(500),source:z.enum(leadSources),status:z.enum(leadStatuses)});
export const leadInput=leadFields.extend({id:z.string().uuid().optional(),note:z.string().trim().max(2000).default('')});
export function canWriteLeads(role:AppRole|null){return role==='se'||role==='tl'||role==='sm';}
export function canVerifyLeads(role:AppRole|null){return role==='adm'||role==='tl';}
export function canApplyMaintenance(role:AppRole|null,status:string){return role==='it'&&status==='approved';}
export function canManageAnalytics(role:AppRole|null){return role==='sm'||role==='it';}
export const analyticsInput=z.object({label:z.string().trim().min(1).max(100),url:z.string().url().refine(value=>new URL(value).protocol==='https:','Gunakan tautan HTTPS.')});