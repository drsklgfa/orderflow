import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';

function cookies(response: { headers: Record<string, string | string[] | undefined> }): string[] {
  const value = response.headers['set-cookie'];
  return Array.isArray(value) ? value : value ? [value] : [];
}

describe('OrderFlow API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => app.close());

  it('realiza checkout e devolve o mesmo pedido para a mesma chave de idempotência', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@orderflow.demo', password: 'DemoAdmin123!' })
      .expect(200);
    const adminCookies = cookies(adminLogin);
    const adminCsrf = adminLogin.body.csrfToken as string;

    const product = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Cookie', adminCookies)
      .set('X-CSRF-Token', adminCsrf)
      .send({ sku: `E2E-${randomUUID().slice(0, 8)}`, name: 'Produto E2E', priceInCents: 12990, stock: 2, active: true })
      .expect(201);

    const customer = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Cliente E2E', email: `e2e-${randomUUID()}@orderflow.demo`, password: 'SenhaForte123!' })
      .expect(201);
    const customerCookies = cookies(customer);
    const customerCsrf = customer.body.csrfToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Cookie', customerCookies)
      .set('X-CSRF-Token', customerCsrf)
      .send({ productId: product.body.id, quantity: 1 })
      .expect(201);

    const key = randomUUID();
    const first = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Cookie', customerCookies)
      .set('X-CSRF-Token', customerCsrf)
      .set('Idempotency-Key', key)
      .expect(201);

    const repeated = await request(app.getHttpServer())
      .post('/api/v1/orders/checkout')
      .set('Cookie', customerCookies)
      .set('X-CSRF-Token', customerCsrf)
      .set('Idempotency-Key', key)
      .expect(201);

    expect(repeated.body.id).toBe(first.body.id);
  });

  it('aprova somente um checkout quando dois clientes disputam a última unidade', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@orderflow.demo', password: 'DemoAdmin123!' })
      .expect(200);
    const adminCookies = cookies(adminLogin);
    const adminCsrf = adminLogin.body.csrfToken as string;

    const product = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Cookie', adminCookies)
      .set('X-CSRF-Token', adminCsrf)
      .send({ sku: `RACE-${randomUUID().slice(0, 8)}`, name: 'Última unidade E2E', priceInCents: 5990, stock: 1, active: true })
      .expect(201);

    async function createReadyCustomer(label: string) {
      const account = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name: `Cliente ${label}`, email: `${label}-${randomUUID()}@orderflow.demo`, password: 'SenhaForte123!' })
        .expect(201);
      const sessionCookies = cookies(account);
      const csrf = account.body.csrfToken as string;
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Cookie', sessionCookies)
        .set('X-CSRF-Token', csrf)
        .send({ productId: product.body.id, quantity: 1 })
        .expect(201);
      return { sessionCookies, csrf };
    }

    const [a, b] = await Promise.all([createReadyCustomer('A'), createReadyCustomer('B')]);
    const results = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/orders/checkout').set('Cookie', a.sessionCookies).set('X-CSRF-Token', a.csrf).set('Idempotency-Key', randomUUID()),
      request(app.getHttpServer()).post('/api/v1/orders/checkout').set('Cookie', b.sessionCookies).set('X-CSRF-Token', b.csrf).set('Idempotency-Key', randomUUID()),
    ]);

    const statuses = results.map((result) => result.status).sort();
    expect(statuses).toEqual([201, 409]);
    expect(results.find((result) => result.status === 409)?.body.code).toBe('OUT_OF_STOCK');
  });
});
