import { describe,it,expect } from 'vitest';
import { roles,screenAccess,workspaceAllowed } from '@/lib/roles';
describe('Document role permissions',()=>{
 it('supports exactly the six document roles',()=>expect(roles).toEqual(['se','tl','adm','dm','sm','dir']));
 it('all six roles have their dashboard',()=>{for(const role of roles)expect(screenAccess(role,1)).toBe('full');});
 it('sales and leaders may record activities, managers only read',()=>{expect(screenAccess('se',7)).toBe('full');expect(screenAccess('tl',7)).toBe('full');expect(screenAccess('sm',7)).toBe('read');expect(screenAccess('adm',7)).toBe('none');expect(screenAccess('dm',7)).toBe('none');expect(screenAccess('dir',7)).toBe('none');});
 it('digital marketing cannot read lead details',()=>expect(screenAccess('dm',3)).toBe('none'));
 it('only directors can access commission scheme settings',()=>{for(const role of roles)expect(screenAccess(role,17)).toBe(role==='dir'?'full':'none');});
 it('commission dashboards are self-only for supporting roles',()=>{for(const role of ['se','tl','adm','dm'] as const)expect(screenAccess(role,14)).toBe('own');expect(screenAccess('sm',14)).toBe('full');expect(screenAccess('dir',14)).toBe('full');});
 it('only marketing manages channel settings',()=>{for(const role of roles)expect(screenAccess(role,22)).toBe(role==='dm'?'full':'none');});
 it('only admins write verification work',()=>{expect(workspaceAllowed('adm','verification',true)).toBe(true);expect(workspaceAllowed('sm','verification',true)).toBe(false);expect(workspaceAllowed('se','verification')).toBe(false);});
 it('only directors access the portfolio workspace',()=>{for(const role of roles)expect(workspaceAllowed(role,'portfolio')).toBe(role==='dir');});
 it('managers can read content without publishing',()=>{expect(workspaceAllowed('sm','content')).toBe(true);expect(workspaceAllowed('sm','content',true)).toBe(false);expect(workspaceAllowed('dm','content',true)).toBe(true);});
});