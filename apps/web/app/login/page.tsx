'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function enter(selectedEmail = email, selectedPassword = password) {
    setBusy(true); setError('');
    try {
      const user = await login(selectedEmail, selectedPassword);
      router.push(user.role === 'ADMIN' ? '/admin' : '/catalog');
      router.refresh();
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent) { event.preventDefault(); await enter(); }

  return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow">ACESSO SEGURO</span><h1>Entrar no OrderFlow</h1><p>Use sua conta ou acesse o ambiente demonstrativo.</p>
    <div className="demo-buttons"><button className="button secondary" onClick={() => enter('cliente@orderflow.demo','DemoCliente123!')} disabled={busy}>Demo cliente</button><button className="button secondary" onClick={() => enter('admin@orderflow.demo','DemoAdmin123!')} disabled={busy}>Demo admin</button></div>
    <div className="divider">ou informe seus dados</div>
    <form className="form-grid" onSubmit={submit}>{error && <div className="form-error">{error}</div>}<div className="field"><label htmlFor="email">E-mail</label><input className="input" id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" /></div><div className="field"><label htmlFor="password">Senha</label><input className="input" id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="current-password" /></div><button className="button primary" disabled={busy}>{busy?'Entrando...':'Entrar'}</button></form>
    <div className="auth-footer">Ainda não possui conta? <Link href="/register">Criar cadastro</Link></div>
  </div></section>;
}
