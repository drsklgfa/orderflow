'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function leave() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="navbar">
      <div className="shell nav-inner">
        <Link href="/" className="brand"><span className="brand-mark">OF</span><span>OrderFlow</span></Link>
        <nav className="nav-links" aria-label="Navegação principal">
          <Link href="/catalog">Produtos</Link>
          {user && <Link href="/cart">Carrinho</Link>}
          {user && <Link href="/orders">Pedidos</Link>}
          {user?.role === 'ADMIN' && <Link href="/admin">Administração</Link>}
        </nav>
        <div className="nav-actions">
          {!loading && !user && <><Link className="button ghost small" href="/login">Entrar</Link><Link className="button primary small" href="/register">Criar conta</Link></>}
          {!loading && user && <><span className="user-chip"><strong>{user.name.split(' ')[0]}</strong><small>{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</small></span><button className="button ghost small" onClick={leave}>Sair</button></>}
        </div>
      </div>
    </header>
  );
}
