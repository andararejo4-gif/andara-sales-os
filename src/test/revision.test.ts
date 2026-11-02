import {describe,it,expect} from 'vitest';
import {canCreateProject,canExportDaily,screenAccess,roles} from '@/lib/roles';
import {revenueSummary,leadAttribution,publicationAttribution,reminderKind,csvCell} from '@/lib/revision';
const se={user_id:'se',staff_code:'004',staff_name:'Angga',tl_id:'tl',role:'se'},tl={user_id:'tl',staff_code:'',staff_name:'Dian',tl_id:null,role:'tl'};
describe('Revision MD rules',()=>{
 it('only TL and SM create projects',()=>{for(const role of roles)expect(canCreateProject(role)).toBe(['tl','sm'].includes(role));});
 it('only TL and ADM export daily reports',()=>{for(const role of roles)expect(canExportDaily(role)).toBe(['tl','adm'].includes(role));});
 it('IT can access all 27 screens',()=>{for(let i=1;i<=27;i++)expect(screenAccess('it',i)).toBe('full');});
 it('SM revenue uses valid CV transactions and actual / target format',()=>expect(revenueSummary([{amount:620000000,status:'CV'},{amount:200000000,status:'BOOK'}],1000000000)).toEqual({actual:620000000,target:1000000000,percent:62,label:'620 jt / 1 M'}));
 it('TL lead hierarchy includes assigned SE',()=>expect(leadAttribution('Pak Joko',se,tl,'tl')).toBe('Pak Joko — TL Dian (SE 004 Angga)'));
 it('SM lead hierarchy repeats TL inside the ownership chain',()=>expect(leadAttribution('Pak Joko',se,tl,'sm')).toBe('Pak Joko — TL Dian (SE 004 Angga - TL Dian)'));
 it('published videos attribute SE and TL',()=>expect(publicationAttribution(se,tl)).toBe('Sudah dipublish oleh SE 004 Angga - TL Dian'));
 it('reminds H-1 using Jakarta dates',()=>expect(reminderKind('2026-11-04T09:00:00+07:00',new Date('2026-11-02T18:00:00Z'))).toBe('h_minus_1'));
 it('reminds on day H using Jakarta dates',()=>expect(reminderKind('2026-11-03T09:00:00+07:00',new Date('2026-11-02T18:00:00Z'))).toBe('day_of'));
 it('does not remind two days early',()=>expect(reminderKind('2026-11-05T09:00:00+07:00',new Date('2026-11-02T18:00:00Z'))).toBeNull());
 it('neutralizes spreadsheet formulas in export',()=>expect(csvCell('=1+1')).toBe('"\'=1+1"'));
});