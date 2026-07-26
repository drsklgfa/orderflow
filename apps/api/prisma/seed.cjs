const { PrismaClient, Role, OrderStatus, StockMovementType } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function upsertDemoUser({ name, email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name, role, isActive: true, passwordHash },
    });
  }

  return prisma.user.create({
    data: { name, email, passwordHash, role },
  });
}

async function main() {
  const admin = await upsertDemoUser({
    name: 'Administrador Demo',
    email: 'admin@orderflow.demo',
    password: 'DemoAdmin123!',
    role: Role.ADMIN,
  });

  const customer = await upsertDemoUser({
    name: 'Cliente Demo',
    email: 'cliente@orderflow.demo',
    password: 'DemoCliente123!',
    role: Role.CUSTOMER,
  });

  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });
  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const products = [
    {
      sku: 'OF-NOTE-001',
      name: 'Notebook Pro 14',
      description: 'Notebook de demonstração com 16 GB de RAM e SSD de 512 GB.',
      priceInCents: 459990,
      stock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
    },
    {
      sku: 'OF-MON-002',
      name: 'Monitor UltraWide 29',
      description: 'Monitor IPS para produtividade e entretenimento.',
      priceInCents: 149990,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
    },
    {
      sku: 'OF-KEY-003',
      name: 'Teclado Mecânico',
      description: 'Teclado mecânico compacto, ABNT2 e iluminação ajustável.',
      priceInCents: 34990,
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    },
    {
      sku: 'OF-MOU-004',
      name: 'Mouse Sem Fio',
      description: 'Mouse ergonômico com bateria recarregável.',
      priceInCents: 18990,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80',
    },
    {
      sku: 'OF-HED-005',
      name: 'Headset Studio',
      description: 'Headset com microfone removível e som espacial.',
      priceInCents: 42990,
      stock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    },
    {
      sku: 'OF-HUB-006',
      name: 'Hub USB-C 8 em 1',
      description: 'Hub com HDMI, USB 3.0, leitor de cartões e Power Delivery.',
      priceInCents: 27990,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80',
    },
  ];

  for (const product of products) {
    const { stock, ...metadata } = product;
    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: { ...metadata, active: true, deletedAt: null },
      create: { ...metadata, stock },
    });

    const initialMovement = await prisma.stockMovement.findFirst({
      where: { productId: saved.id, reason: 'Estoque inicial da demonstração' },
    });

    if (!initialMovement) {
      await prisma.stockMovement.create({
        data: {
          productId: saved.id,
          type: StockMovementType.ENTRY,
          quantity: stock,
          reason: 'Estoque inicial da demonstração',
        },
      });
    }
  }

  const existingOrder = await prisma.order.findUnique({
    where: { number: 'ORD-DEMO-0001' },
  });

  if (!existingOrder) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { sku: 'OF-MOU-004' },
    });

    await prisma.$transaction(async (tx) => {
      const reserved = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });

      if (reserved.count === 0) return;

      const order = await tx.order.create({
        data: {
          number: 'ORD-DEMO-0001',
          userId: customer.id,
          status: OrderStatus.DELIVERED,
          totalInCents: product.priceInCents,
          items: {
            create: [
              {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                unitPriceInCents: product.priceInCents,
                quantity: 1,
                subtotalInCents: product.priceInCents,
              },
            ],
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          orderId: order.id,
          type: StockMovementType.SALE,
          quantity: -1,
          reason: 'Venda demonstrativa ORD-DEMO-0001',
        },
      });
    });
  }

  console.log('Seed concluído. Contas: admin@orderflow.demo e cliente@orderflow.demo');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
