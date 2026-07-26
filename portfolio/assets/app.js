const products = [
  { sku: 'OF-NOTE-001', name: 'Notebook Pro 14', description: '16 GB RAM, SSD 512 GB e tela de alta definição.', price: 'R$ 4.599,90', stock: 8, icon: '▰', tone: 'blue' },
  { sku: 'OF-MON-002', name: 'Monitor UltraWide 29', description: 'Painel IPS para produtividade e entretenimento.', price: 'R$ 1.499,90', stock: 12, icon: '▱', tone: 'purple' },
  { sku: 'OF-KEY-003', name: 'Teclado Mecânico', description: 'Formato compacto, ABNT2 e iluminação ajustável.', price: 'R$ 349,90', stock: 20, icon: '⌨', tone: 'gray' },
  { sku: 'OF-MOU-004', name: 'Mouse Sem Fio', description: 'Design ergonômico e bateria recarregável.', price: 'R$ 189,90', stock: 4, icon: '◒', tone: 'green' },
  { sku: 'OF-HED-005', name: 'Headset Studio', description: 'Microfone removível e som espacial.', price: 'R$ 429,90', stock: 10, icon: '◖◗', tone: 'orange' },
  { sku: 'OF-HUB-006', name: 'Hub USB-C 8 em 1', description: 'HDMI, USB 3.0, cartões e Power Delivery.', price: 'R$ 279,90', stock: 15, icon: '▦', tone: 'cyan' }
];

const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.querySelector('p').textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function activateView(view) {
  document.querySelectorAll('.demo-nav').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  document.querySelectorAll('.demo-view').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === view);
  });
  const activePanel = document.querySelector(`[data-panel="${view}"]`);
  if (activePanel && window.innerWidth < 760) {
    document.querySelector('.demo-window')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.querySelectorAll('.demo-nav').forEach((button) => {
  button.addEventListener('click', () => activateView(button.dataset.view));
});

document.querySelectorAll('[data-view-target]').forEach((button) => {
  button.addEventListener('click', () => activateView(button.dataset.viewTarget));
});

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

function renderProducts(term = '') {
  const target = document.querySelector('#product-grid');
  if (!target) return;
  const normalized = term.trim().toLocaleLowerCase('pt-BR');
  const visible = products.filter((product) =>
    `${product.name} ${product.sku}`.toLocaleLowerCase('pt-BR').includes(normalized)
  );

  target.innerHTML = visible.length
    ? visible.map((product) => `
      <article class="product-demo-card">
        <div class="product-visual ${product.tone}"><span>${product.icon}</span></div>
        <div class="product-demo-body">
          <small>${product.sku}</small>
          <h4>${product.name}</h4>
          <p>${product.description}</p>
          <div class="product-demo-meta">
            <strong>${product.price}</strong>
            <span class="${product.stock <= 5 ? 'low' : ''}">${product.stock} em estoque</span>
          </div>
          <button type="button" data-product="${product.name}">Adicionar ao carrinho</button>
        </div>
      </article>`).join('')
    : '<article class="demo-card" style="grid-column:1/-1;text-align:center;padding:35px"><strong>Nenhum produto encontrado.</strong><p style="font-size:9px;color:#7d8799">Tente outro nome ou SKU.</p></article>';

  target.querySelectorAll('[data-product]').forEach((button) => {
    button.addEventListener('click', () => showToast(`${button.dataset.product} adicionado ao carrinho demonstrativo.`));
  });
}

renderProducts();
document.querySelector('#product-search')?.addEventListener('input', (event) => renderProducts(event.target.value));

document.querySelector('#checkout-button')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Processando transação...';
  setTimeout(() => {
    button.textContent = '✓ Pedido ORD-2026-1249 criado';
    showToast('Checkout demonstrativo concluído com idempotência.');
    setTimeout(() => {
      button.disabled = false;
      button.textContent = original;
    }, 2600);
  }, 900);
});

document.querySelectorAll('.qty button').forEach((button) => {
  button.addEventListener('click', () => showToast('Quantidade atualizada na demonstração.'));
});

document.querySelectorAll('.order-filters button, .filters button').forEach((button) => {
  button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    showToast(`Filtro “${button.textContent.trim()}” aplicado.`);
  });
});

const themeToggle = document.querySelector('#theme-toggle');
const savedTheme = localStorage.getItem('orderflow-theme');
if (savedTheme === 'dark') document.documentElement.dataset.theme = 'dark';

themeToggle?.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  if (dark) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem('orderflow-theme', 'light');
  } else {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem('orderflow-theme', 'dark');
  }
});

document.querySelector('#copy-command')?.addEventListener('click', async (event) => {
  const command = event.currentTarget.dataset.command;
  try {
    await navigator.clipboard.writeText(command);
    showToast('Comando de clone copiado.');
  } catch {
    showToast(command);
  }
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.desktop-nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-25% 0px -65% 0px' });
  sections.forEach((section) => observer.observe(section));
}
