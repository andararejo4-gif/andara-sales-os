import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Navigation, Plus, Check } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { screenAccess } from '@/lib/roles';
import { revisionOptions } from '@/lib/revision-query';
import { simpanRute, updateRute } from '@/lib/revision.functions';
import { jakartaDay } from '@/lib/revision';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/rute')({
  beforeLoad: ({ context }) => { if (!context.account.role || screenAccess(context.account.role, 26) === 'none') throw redirect({ to: '/dashboard', replace: true }); },
  loader: ({ context }) => context.queryClient.ensureQueryData(revisionOptions),
  head: () => ({ meta: [{ title: 'Rute Harian — Andara Sales OS' }, { name: 'description', content: 'Urutan titik canvassing hari ini dari database.' }, { property: 'og:title', content: 'Rute Harian — Andara Sales OS' }, { property: 'og:description', content: 'Urutan titik canvassing operasional.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Rute,
});

function Rute() {
  const { data } = useSuspenseQuery(revisionOptions);
  const { account } = Route.useRouteContext();
  const qc = useQueryClient(), simpan = useServerFn(simpanRute), update = useServerFn(updateRute);
  const [open, setOpen] = useState(false), [nama, setNama] = useState(''), [alamat, setAlamat] = useState(''), [jam, setJam] = useState(''), [pintu, setPintu] = useState('');
  const today = jakartaDay(new Date());
  const rows = data.rute.filter((r) => r.tanggal === today);
  const total = rows.reduce((s, r) => s + Number(r.pintu), 0);
  const save = useMutation({ mutationFn: () => simpan({ data: { nama, alamat, jam, pintu: Number(pintu), jarak: '', tanggal: today } }), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['revision'] }); setOpen(false); setNama(''); setAlamat(''); setJam(''); setPintu(''); toast.success('Rute tersimpan.'); }, onError: () => toast.error('Rute belum tersimpan.') });
  const change = useMutation({ mutationFn: (id: string) => update({ data: { id, status: 'selesai' } }), onSuccess: () => void qc.invalidateQueries({ queryKey: ['revision'] }), onError: () => toast.error('Status belum tersimpan.') });
  return <AppShell title="Rute Harian" subtitle={`${rows.length} titik · ${total} pintu`}>
    <div className="mb-5"><Button onClick={() => setOpen(!open)}><Plus/>{open ? 'Batal' : 'Tambah titik'}</Button>
    {open && <form className="mt-5 space-y-4 border-y border-border py-5" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}><Input required placeholder="Nama lokasi" value={nama} onChange={(e) => setNama(e.target.value)}/><Input required placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)}/><div className="grid grid-cols-2 gap-3"><Input placeholder="Jam (mis. 09.00)" value={jam} onChange={(e) => setJam(e.target.value)}/><Input type="number" min="0" placeholder="Pintu" value={pintu} onChange={(e) => setPintu(e.target.value)}/></div><Button type="submit" disabled={save.isPending}>Simpan titik</Button></form>}
    </div>
    {rows.length === 0 ? <p className="border-y border-border py-12 text-center text-muted-foreground">Belum ada rute hari ini.</p> : <ol className="space-y-3">{rows.map((r, i) => { const on = r.status === 'berjalan'; return <li key={r.id} className={`surface flex items-center gap-4 p-4 ${on ? 'ring-2 ring-primary' : ''} ${r.status === 'selesai' ? 'opacity-55' : ''}`}><div className={`grid size-11 shrink-0 place-items-center rounded-xl font-bold ${on ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{i + 1}</div><div className="min-w-0 flex-1"><p className="font-semibold">{r.nama}</p><p className="text-[13px] text-muted-foreground">{r.jam} · {r.alamat} · {r.pintu} pintu · {r.jarak}</p></div>{on && <a href="#" aria-label="Navigasi" className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Navigation className="size-5"/></a>}{r.status !== 'selesai' && <Button variant="outline" size="icon" aria-label="Tandai selesai" disabled={change.isPending} onClick={() => change.mutate(r.id)}><Check/></Button>}{r.status === 'selesai' && <span className="text-[13px] font-semibold text-success">Selesai</span>}</li>; })}</ol>}
  </AppShell>;
}