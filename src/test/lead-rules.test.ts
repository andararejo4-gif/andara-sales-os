import {describe,it,expect} from 'vitest';
import {roles} from '@/lib/roles';
import {canWriteLeads,canVerifyLeads,canApplyMaintenance,leadInput,leadSources,analyticsInput} from '@/lib/lead-rules';

describe('Master update rules',()=>{
 it('only ADM and TL verify lead values',()=>{for(const role of roles)expect(canVerifyLeads(role)).toBe(['adm','tl'].includes(role));});
 it('IT cannot directly create or update leads',()=>expect(canWriteLeads('it')).toBe(false));
 it('IT applies only an SM-approved request',()=>{expect(canApplyMaintenance('it','pending')).toBe(false);expect(canApplyMaintenance('it','approved')).toBe(true);expect(canApplyMaintenance('it','applied')).toBe(false);expect(canApplyMaintenance('se','approved')).toBe(false);});
 it('requires prospect name, phone and address',()=>{const valid={prospect_name:'Angga',phone:'081234567890',address:'Klaten',source:'Call',status:'LEAD'};expect(leadInput.safeParse(valid).success).toBe(true);for(const key of ['prospect_name','phone','address'])expect(leadInput.safeParse({...valid,[key]:''}).success).toBe(false);});
 it('accepts all five required lead sources',()=>expect(leadSources).toEqual(['Day-to-day','Call','Chat','Posting','Indoor']));
 it('rejects executable analytics links',()=>{expect(analyticsInput.safeParse({label:'Analitik',url:'javascript:alert(1)'}).success).toBe(false);expect(analyticsInput.safeParse({label:'Analitik',url:'https://business.facebook.com/latest/insights'}).success).toBe(true);});
});