export const roleLabels = { se: 'Sales Executive', sales_2: 'Sales Executive 2', tl: 'Team Leader', tl_2: 'Team Leader 2', adm: 'Admin Sales', dm: 'Digital Marketing', sm: 'Sales Manager', dir: 'Direksi', it: 'TI · Pemeliharaan' } as const;
export type AppRole = keyof typeof roleLabels;
export type Access = 'full' | 'read' | 'own' | 'none';
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
const columns = ['se','tl','adm','dm','sm','dir'];
export function screenAccess(role: AppRole, screen: number): Access { if (role === 'it') return 'full'; const col = role === 'sales_2' ? 'se' : role === 'tl_2' ? 'tl' : role; return rows[screen - 1]?.[columns.indexOf(col)] ?? 'none'; }
export const workspaces = {
  team: { title: 'Kinerja Tim', roles: ['tl','tl_2','sm','dir'], writers: ['tl','tl_2','sm','dir'], sections: ['Kinerja tim','Eskalasi masuk','Yang perlu dibantu','Ringkasan kemarin'] },
  verification: { title: 'Verifikasi & Berkas', roles: ['adm','sm'], writers: ['adm'], sections: ['Antrean verifikasi','Berkas menunggu','Penagihan','Ringkasan kemarin'] },
  content: { title: 'Bank Konten', roles: ['dm','sm','dir'], writers: ['dm'], sections: ['Kinerja konten','Kanal terbaik','Biaya per lead','Ringkasan kemarin'] },
  projects: { title: 'Pencapaian Prospek', roles: ['tl','tl_2','sm','dir'], writers: ['tl','tl_2','sm'], sections: ['Pencapaian proyek','Anomali','Keputusan menunggu','Ringkasan kemarin'] },
  portfolio: { title: 'Portofolio Direksi', roles: ['dir'], writers: ['dir'], sections: ['Ringkasan portofolio','Penanda merah','Keputusan menunggu','Ringkasan kemarin'] },
} as const;
export type Workspace = keyof typeof workspaces;
export const primaryWorkspace: Record<Exclude<AppRole,'se'|'sales_2'>, Workspace> = { tl:'team',tl_2:'team',adm:'verification',dm:'content',sm:'projects',dir:'portfolio',it:'portfolio' };
export const workspaceMetrics: Record<Workspace,string[]> = {
  team:['Capaian per anggota','Lead jatuh tempo','SLA lampau','Audit lead & berkas','Sengketa sumber','Rute & K3'],
  verification:['Lead masuk & duplikat','Lead belum dialokasi','Kelengkapan berkas','Rekonsiliasi tiga jalur','Versi harga & stok','Paket komisi'],
  content:['Inquiry unik','Biaya per lead','Biaya per closing','Anggaran terpakai','Antrean tanggapan','Kinerja per platform'],
  projects:['Papan portofolio per wilayah','Cakupan pipeline','Akurasi ramalan','Kesehatan funnel','Beban kerja tim','Hambatan & penanggung jawab'],
  portfolio:['Omzet & margin per proyek','Laju serapan stok','Biaya akuisisi per closing','Rasio biaya tenaga penjualan','Proyeksi 3 bulan','Persetujuan & pengecualian harga'],
};
export function workspaceAllowed(role: AppRole, key: Workspace, write = false) { return role==='it'||(write ? workspaces[key].writers : workspaces[key].roles).some(r => r === role); }
export function canCreateProject(role:AppRole){return role==='tl'||role==='tl_2'||role==='sm';}
export function canExportDaily(role:AppRole){return role==='se'||role==='sales_2'||role==='tl'||role==='tl_2'||role==='sm'||role==='adm';}
export function isLargeTicket(role:AppRole|null){return role==='sales_2'||role==='tl_2';}
export const dbRole: Record<AppRole, string> = { se:'SALES',sales_2:'SALES_2',tl:'TEAM_LEADER',tl_2:'TL_2',adm:'ADMIN',dm:'DIGITAL_MARKETING',sm:'SALES_MANAGER',dir:'DIREKSI',it:'IT' };
export function fromDbRole(value: string): AppRole | null { const entry = (Object.entries(dbRole) as [AppRole, string][]).find(([, v]) => v === value); return entry ? entry[0] : null; }