'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth(); const router = useRouter();
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await register(name,email,password);router.push('/catalog');router.refresh();}catch(err){setError(err instanceof ApiError?err.message:'Não foi possível criar a conta.');}finally{setBusy(false)}}
  return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow">NOVA CONTA</span><h1>Crie seu cadastro</h1><p>O perfil criado será de cliente. A senha precisa ser forte.</p><form className="form-grid" onSubmit={submit}>{error&&<div className="form-error">{error}</div>}<div className="field"><label htmlFor="name">Nome completo</label><input className="input" id="name" value={name} onChange={e=>setName(e.target.value)} minLength={2} required autoComplete="name" /></div><div className="field"><label htmlFor="email">E-mail</label><input className="input" id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></div><div className="field"><label htmlFor="password">Senha</label><input className="input" id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required autoComplete="new-password" /><small>Use maiúscula, minúscula, número e caractere especial.</small></div><button className="button primary" disabled={busy}>{busy?'Criando...':'Criar conta'}</button></form><div className="auth-footer">Já possui uma conta? <Link href="/login">Entrar</Link></div></div></section>;
}
