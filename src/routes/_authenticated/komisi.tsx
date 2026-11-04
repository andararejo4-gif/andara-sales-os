import { createFileRoute, redirect } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AppShell, Section } from '@/components/AppShell';
import { screenAccess, roleLabels } from '@/lib/roles';
import { revisionOptions } from '@/lib/revision-query';
export const Route = createFileRoute('/_authenticated/komisi')({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 14) === 'none') throw redirect({ to: '/dashboard' }); },
  loader: ({ context }) => context.queryClient.ensureQueryData(revisionOptions),
  head: () => ({ meta: [{ title: 'Komisi — Andara Sales OS' }, { name: 'description', content: 'Komisi tersimpan dan status pencairan sesuai lingkup Anda.' }, { property: 'og:title', content: 'Komisi — Andara Sales OS' }, { property: 'og:description', content: 'Ringkasan komisi dan milestone pencairan Andara.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Komisi,
});
function Komisi() {
  const { data } = useSuspenseQuery(revisionOptions), { account } = Route.useRouteContext();
  const rows = data.commissions.filter((c) => ['sm', 'dir', 'it'].includes(account.role ?? '') || c.owner_id === account.userId);
  const rp = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
  const statuses = { PENDING: 'Menunggu', DISETUJUI: 'Disetujui', DICAIRKAN: 'Sudah cair', DITOLAK: 'Ditolak' };
  const projectOf = (txId: string) => { const t = data.transactions.find((x) => x.id === txId); return data.projects.find((p) => p.id === t?.project_id)?.name || 'Proyek'; };
  return <AppShell title="Komisi" hideFab><div className="mb-7 grid grid-cols-2 gap-3 border-y border-border py-5"><div><p className="text-sm text-muted-foreground">Total komisi</p><p className="mt-2 break-words text-xl font-bold">{rp(rows.reduce((s, c) => s + Number(c.amount), 0))}</p></div><div><p className="text-sm text-muted-foreground">Sudah cair</p><p className="mt-2 break-words text-xl font-bold text-positive">{rp(rows.filter((c) => c.status === 'DICAIRKAN').reduce((s, c) => s + Number(c.amount), 0))}</p></div></div><Section title="Pencairan komisi">{rows.length ? <div className="divide-y divide-border">{rows.map((c) => <article key={c.id} className="flex flex-wrap justify-between gap-3 py-5"><div><p className="font-semibold">{roleLabels[c.peran as keyof typeof roleLabels] ?? c.peran}</p><p className="mt-2 text-sm text-muted-foreground">{statuses[c.status as keyof typeof statuses] ?? c.status} · {projectOf(c.transaksi_id)}</p></div><p className="font-semibold">{rp(c.amount)}</p></article>)}</div> : <p className="py-8 text-center text-muted-foreground">Belum ada komisi tercatat.</p>}</Section></AppShell>;
}