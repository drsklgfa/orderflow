import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'OrderFlow | Pedidos e Estoque',
  description: 'Sistema demonstrativo completo para gestão de produtos, carrinho, pedidos e estoque.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="footer"><div className="shell footer-inner"><span>OrderFlow © 2026</span><span>API segura • PostgreSQL • NestJS • Next.js</span></div></footer>
        </AuthProvider>
      </body>
    </html>
  );
}
