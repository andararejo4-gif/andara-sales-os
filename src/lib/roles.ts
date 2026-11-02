export const roleLabels = { se: 'Sales Executive', tl: 'Team Leader', adm: 'Admin Sales', dm: 'Digital Marketing', sm: 'Sales Manager', dir: 'Direksi' } as const;
export type AppRole = keyof typeof roleLabels;
export type Access = 'full' | 'read' | 'own' | 'none';
// Execution package, pages 8–9. Column order: SE, TL, ADM, DM, SM, DIR.
const rows: Access[][] = [
 ['full','full','full','full','full','full'],
 ['full','full','read','read','full','full'],
 ['full','full','full','none','full','full'],
 ['full','full','full','none','full','full'],
 ['none','full','none','none','full','full'],
 ['full','full','read','none','full','full'],
 ['full','full','none','none','read','none'],
 ['full','full','read','read','full','read'],
 ['full','full','none','none','read','none'],
 ['none','read','full','none','full','full'],
 ['none','read','full','none','full','full'],
 ['none','read','full','none','full','full'],
 ['none','none','full','none','read','none'],
 ['own','own','own','own','full','full'],
 ['own','own','full','none','full','full'],
 ['none','none','read','none','full','full'],
 ['none','none','none','none','none','full'],
 ['full','read','none','full','read','none'],
 ['read','none','none','full','read','none'],
 ['full','none','none','full','read','none'],
 ['none','none','none','full','full','read'],
 ['none','none','none','full','none','none'],
 ['none','none','none','full','full','read'],
 ['none','none','none','full','full','read'],
 ['full','full','none','none','full','read'],
 ['full','full','none','none','read','none'],
 ['none','full','none','none','full','none'],
];
export const roles = Object.keys(roleLabels) as AppRole[];
export function isRole(value: string): value is AppRole { return roles.some(r => r === value); }
export function screenAccess(role: AppRole, screen: number): Access { return rows[screen - 1]?.[roles.indexOf(role)] ?? 'none'; }
export const workspaces = {
 team: { title: 'Kinerja Tim', roles: ['tl','sm','dir'], writers: ['tl','sm','dir'], sections: ['Kinerja tim','Eskalasi masuk','Yang perlu dibantu','Ringkasan kemarin'] },
 verification: { title: 'Verifikasi & Berkas', roles: ['adm','sm'], writers: ['adm'], sections: ['Antrean verifikasi','Berkas menunggu','Penagihan','Ringkasan kemarin'] },
 content: { title: 'Konten & Kanal', roles: ['dm','sm','dir'], writers: ['dm'], sections: ['Kinerja konten','Kanal terbaik','Biaya per lead','Ringkasan kemarin'] },
 projects: { title: 'Pencapaian Proyek', roles: ['sm','dir'], writers: ['sm'], sections: ['Pencapaian proyek','Anomali','Keputusan menunggu','Ringkasan kemarin'] },
 portfolio: { title: 'Portofolio Direksi', roles: ['dir'], writers: ['dir'], sections: ['Ringkasan portofolio','Penanda merah','Keputusan menunggu','Ringkasan kemarin'] },
} as const;
export type Workspace = keyof typeof workspaces;
export const primaryWorkspace: Record<Exclude<AppRole,'se'>, Workspace> = { tl:'team',adm:'verification',dm:'content',sm:'projects',dir:'portfolio' };
export function workspaceAllowed(role: AppRole, key: Workspace, write = false) { return (write ? workspaces[key].writers : workspaces[key].roles).some(r => r === role); }