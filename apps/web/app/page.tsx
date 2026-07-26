import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <span className="eyebrow">PROJETO FULL STACK PARA PORTFÓLIO</span>
            <h1>Pedidos e estoque com regras de negócio de verdade.</h1>
            <p className="hero-copy">Uma aplicação completa com autenticação segura, carrinho, checkout transacional, painel administrativo, auditoria de estoque e API documentada.</p>
            <div className="hero-actions"><Link className="button primary large" href="/catalog">Explorar produtos</Link><Link className="button secondary large" href="/login">Usar conta demo</Link></div>
            <div className="demo-strip"><div><strong>Cliente</strong><span>cliente@orderflow.demo</span><code>DemoCliente123!</code></div><div><strong>Administrador</strong><span>admin@orderflow.demo</span><code>DemoAdmin123!</code></div></div>
          </div>
          <div className="hero-panel">
            <div className="window-head"><span></span><span></span><span></span></div>
            <div className="metric-grid"><article><small>Pedidos</small><strong>1.248</strong><em>+12,5%</em></article><article><small>Receita</small><strong>R$ 86 mil</strong><em>+8,2%</em></article><article><small>Produtos</small><strong>84</strong><em>ativos</em></article><article><small>Estoque baixo</small><strong>6</strong><em>atenção</em></article></div>
            <div className="fake-chart"><span style={{ height: '35%' }}></span><span style={{ height: '52%' }}></span><span style={{ height: '46%' }}></span><span style={{ height: '72%' }}></span><span style={{ height: '62%' }}></span><span style={{ height: '88%' }}></span><span style={{ height: '78%' }}></span></div>
          </div>
        </div>
      </section>
      <section className="section"><div className="shell"><div className="section-heading"><span className="eyebrow">DIFERENCIAIS</span><h2>Mais do que um CRUD simples</h2></div><div className="feature-grid">
        <article className="feature-card"><b>01</b><h3>Checkout atômico</h3><p>Reserva de estoque e criação do pedido na mesma transação, com rollback completo em caso de erro.</p></article>
        <article className="feature-card"><b>02</b><h3>Autenticação segura</h3><p>Access token, refresh token rotativo, cookies HttpOnly, proteção CSRF e autorização por perfil.</p></article>
        <article className="feature-card"><b>03</b><h3>Operação real</h3><p>Docker, migrations, seed, testes, documentação Swagger, monitoramento de saúde e deploy automatizado.</p></article>
      </div></div></section>
    </>
  );
}
