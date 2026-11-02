import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { roleLabels } from '@/lib/roles';
import '@lovable.dev/cloud-auth-js/styles.css';
export function Login() {
 const navigate=useNavigate();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false),[forgot,setForgot]=useState(false);
 useEffect(()=>{let alive=true;supabase.auth.getUser().then(({data})=>{if(alive&&data.user)void navigate({to:'/dashboard',replace:true});});return()=>{alive=false;};},[navigate]);
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try {
   if(forgot){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'});if(error)throw error;setSent(true);}
   else {const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;await navigate({to:'/dashboard',replace:true});}
  }catch{setError(forgot?'De herstelmail kon niet worden verstuurd. Probeer opnieuw.':'Email atau kata sandi tidak sesuai, atau akun belum dikonfirmasi.');}finally{setBusy(false);}
 }
 async function oauth(provider:'google'|'lovable'){
  setBusy(true);setError('');try{const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:window.location.origin+'/auth'});if(result.error)throw result.error;if(!result.redirected)await navigate({to:'/dashboard',replace:true});}catch{setError('Login belum berhasil. Silakan coba lagi.');}finally{setBusy(false);}
 }
 return <main className="flex min-h-screen flex-col bg-background">
  <header className="flex items-center justify-between border-b border-border px-6 py-5 md:px-10"><div className="flex items-center gap-3"><img src="/icon-512.png" alt="Andara" className="size-10 rounded-lg"/><span className="font-bold">Andara <span className="font-medium text-muted-foreground">Sales OS</span></span></div><LockKeyhole className="size-5 text-muted-foreground"/></header>
  <div className="mx-auto w-full max-w-md flex-1 px-6 py-12 md:py-16">
   <p className="mb-3 text-[13px] font-semibold uppercase text-success">PT Andara Rejo Makmur</p>
   <h1 className="text-[28px] font-bold">{forgot?'Pulihkan akun':'Masuk ke Andara'}</h1>
   <p className="mt-2 text-muted-foreground">{forgot?'Kirim tautan untuk mengganti kata sandi.':'Selamat datang kembali.'}</p>
   <form onSubmit={submit} className="mt-8 space-y-5">
    <div><label htmlFor="email" className="mb-2 block text-[13px] font-semibold">Email kerja</label><div className="relative"><Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground"/><Input id="email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className="h-12 bg-card pl-10" placeholder="nama@perusahaan.com"/></div></div>
    {!forgot&&<div><label htmlFor="password" className="mb-2 block text-[13px] font-semibold">Kata sandi</label><div className="relative"><Input id="password" type={show?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="h-12 bg-card pr-12"/><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-12" aria-label={show?'Sembunyikan kata sandi':'Lihat kata sandi'} onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</Button></div></div>}
    {error&&<p role="alert" className="text-[13px] text-destructive">{error}</p>}
    {sent&&<p role="status" className="text-[13px] text-success">Jika email terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan spam.</p>}
    <Button disabled={busy} type="submit" className="h-12 w-full text-[15px]">{busy?'Mohon tunggu…':forgot?'Kirim tautan pemulihan':'Masuk'}<ArrowRight/></Button>
   </form>
   <Button variant="link" className="mt-2 h-11 px-0" onClick={()=>{setForgot(!forgot);setError('');setSent(false);}}>{forgot?'Kembali ke login':'Lupa kata sandi?'}</Button>
   {!forgot&&<div className="mt-5 space-y-3 border-t border-border pt-5"><Button variant="outline" disabled={busy} className="h-12 w-full bg-card" onClick={()=>oauth('google')}>Masuk dengan Google</Button><Button disabled={busy} className="lovable-auth-button w-full" onClick={()=>oauth('lovable')}>Sign in with Lovable</Button></div>}
   <div className="mt-8 border-t border-border pt-5"><p className="text-[13px] font-semibold text-muted-foreground">Enam peran · satu akun masing-masing</p><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{Object.values(roleLabels).join(' · ')}</p></div>
  </div><footer className="px-6 pb-6 text-center text-[13px] text-muted-foreground">Internal & rahasia · Andara Rejo Makmur</footer>
 </main>;
}