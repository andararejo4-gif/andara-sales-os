import {describe,it,expect} from 'vitest';
import {selectReportOwners,reportInput,reportRows,reportCsv,type DailyReport} from '@/lib/daily-report';
const staff=[{user_id:'tl1',role:'tl',staff_code:'T1',staff_name:'TL Satu',tl_id:null},{user_id:'se1',role:'se',staff_code:'S1',staff_name:'SE Satu',tl_id:'tl1'},{user_id:'se2',role:'se',staff_code:'S2',staff_name:'SE Dua',tl_id:'tl2'}];
describe('Daily report rules',()=>{
 it('selects a whole TL hierarchy without another TL SE',()=>expect(selectReportOwners(staff,[],['tl1'])).toEqual(['tl1','se1']));
 it('supports multiple individually selected staff',()=>expect(selectReportOwners(staff,['se1','se2'],[])).toEqual(['se1','se2']));
 it('does not accept an empty explicit selection',()=>expect(reportInput.safeParse({day:'2026-11-02',ownerIds:[]}).success).toBe(false));
 it('rejects impossible dates',()=>expect(reportInput.safeParse({day:'2026-02-30'}).success).toBe(false));
 it('accepts Jakarta report day',()=>expect(reportInput.safeParse({day:'2026-11-02'}).success).toBe(true));
 const report:DailyReport={staff,activities:[{id:'a',owner_id:'se1',kind:'D2D',note:'=1+1',occurred_at:'2026-11-01T18:00:00Z'}],leads:[{id:'l',owner_id:'se1',nickname:'Joko',status:'HOT',source:'Call',created_at:'2026-11-02T01:00:00Z'}],kpis:[{id:'k',owner_id:'se1',metric:'Kunjungan',value:3,logged_on:'2026-11-02'}]};
 it('includes visits, incoming prospects and persisted daily progress',()=>expect(reportRows(report).map(r=>r[5])).toEqual(['Aktivitas','Prospek masuk','Progres harian']));
 it('exports persisted prospect status rather than demo values',()=>expect(reportRows(report)[1]?.[7]).toBe('HOT'));
 it('escapes formula injection in CSV',()=>expect(reportCsv(report)).toContain('"\'=1+1"'));
});