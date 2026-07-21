# OrderFlow

Sistema full stack de pedidos e estoque criado como projeto profissional de portfólio. Inclui autenticação segura, perfis de acesso, catálogo, carrinho, checkout transacional, painel administrativo, movimentações de estoque, testes, documentação Swagger, Docker e configuração para deploy.

## Links depois do deploy

- Frontend: `https://seu-projeto.vercel.app`
- API: `https://sua-api.up.railway.app/api/v1`
- Swagger: `https://sua-api.up.railway.app/docs`
- Health check: `https://sua-api.up.railway.app/api/v1/health`

## Contas demonstrativas

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `cliente@orderflow.demo` | `DemoCliente123!` |
| Administrador | `admin@orderflow.demo` | `DemoAdmin123!` |

As contas são criadas pelo seed do Prisma. Não use essas senhas em um ambiente real com dados pessoais.

## Recursos implementados

### Cliente

- Cadastro e login;
- renovação segura da sessão;
- catálogo com busca;
- carrinho com validação de estoque;
- alteração e remoção de itens;
- checkout com transação serializável;
- chave de idempotência contra pedidos duplicados;
- histórico de pedidos;
- cancelamento de pedidos pendentes.

### Administrador

- dashboard com receita, pedidos, clientes e estoque baixo;
- cadastro e desativação de produtos;
- ajuste de estoque com motivo e histórico;
- consulta de clientes;
- consulta de todos os pedidos;
- progressão controlada dos status;
- cancelamento com reposição automática do estoque;
- auditoria das movimentações.

### Segurança

- senhas com Argon2id;
- access token e refresh token JWT;
- rotação de refresh token e detecção de reutilização;
- cookies `HttpOnly`, `Secure` em produção e `SameSite`;
- proteção CSRF vinculada à sessão;
- autorização `ADMIN` e `CUSTOMER` no backend;
- validação e remoção de campos não permitidos;
- CORS restrito;
- Helmet;
- rate limiting;
- erros padronizados sem exposição de stack trace;
- segredos somente em variáveis de ambiente;
- checks de integridade no PostgreSQL.

## Arquitetura

```text
orderflow/
├── apps/
│   ├── api/                  # NestJS + Prisma + PostgreSQL
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── auth/
│   │       ├── products/
│   │       ├── cart/
│   │       ├── orders/
│   │       ├── admin/
│   │       ├── common/
│   │       └── prisma/
│   └── web/                  # Next.js App Router
│       ├── app/
│       ├── components/
│       └── lib/
├── docs/
├── postman/
├── docker-compose.yml
└── .github/workflows/ci.yml
```

O frontend chama uma rota intermediária do próprio Next.js. Essa rota encaminha as solicitações para a API e permite que os tokens permaneçam em cookies protegidos no mesmo domínio do frontend.

## Rodar tudo com Docker

### Requisitos

- Docker Desktop ou Docker Engine com Compose;
- para execução sem Docker, Node.js 22.11 ou superior dentro da linha 22 LTS;
- portas `3000`, `3001` e `5432` disponíveis.

### Início rápido

```bash
cp .env.example .env
docker compose up --build
```

Acesse:

- Sistema: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/docs`
- Health: `http://localhost:3001/api/v1/health`

Para remover também o volume do banco:

```bash
docker compose down -v
```

## Rodar sem Docker

### Banco PostgreSQL

Crie um banco e configure `apps/api/.env` a partir de `apps/api/.env.example`.

### API

```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

### Frontend

Em outro terminal:

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

## Variáveis de ambiente

### API

| Variável | Exemplo | Finalidade |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Conexão com PostgreSQL |
| `JWT_ACCESS_SECRET` | valor aleatório com 32+ caracteres | Assinatura do access token |
| `JWT_REFRESH_SECRET` | outro valor aleatório | Assinatura do refresh token |
| `COOKIE_SECRET` | outro valor aleatório | Assinatura e proteção de cookies |
| `CORS_ORIGINS` | `https://app.exemplo.com` | Origens permitidas, separadas por vírgula |
| `ACCESS_TOKEN_MINUTES` | `15` | Duração do access token |
| `REFRESH_TOKEN_DAYS` | `7` | Duração do refresh token |
| `ENABLE_SWAGGER` | `true` | Habilita `/docs` |
| `COOKIE_SECURE` | `true` em produção | Exige HTTPS |
| `COOKIE_SAME_SITE` | `lax` | Política SameSite |

Gere segredos com, por exemplo:

```bash
openssl rand -base64 48
```

### Frontend

| Variável | Exemplo | Finalidade |
|---|---|---|
| `INTERNAL_API_URL` | `https://api.exemplo.com/api/v1` | Endereço privado usado pelo proxy do Next.js |
| `NEXT_PUBLIC_APP_NAME` | `OrderFlow` | Nome público da aplicação |

## Deploy sugerido

### 1. GitHub

1. Crie um repositório vazio.
2. Envie todo o conteúdo desta pasta.
3. Ative Dependabot e secret scanning nas configurações de segurança.
4. Confirme que o workflow de CI passou.

### 2. Railway: API e PostgreSQL

1. Crie um projeto e adicione PostgreSQL.
2. Crie um serviço pelo repositório GitHub.
3. Defina `apps/api` como diretório raiz do serviço.
4. Use o Dockerfile existente.
5. Configure as variáveis da API.
6. Use a `DATABASE_URL` fornecida pelo PostgreSQL.
7. Configure o health check como `/api/v1/health`.
8. Gere um domínio público para a API.

O Dockerfile executa `prisma migrate deploy`, o seed idempotente e depois inicia a API.

### 3. Vercel: frontend

1. Importe o mesmo repositório.
2. Defina `apps/web` como diretório raiz.
3. Cadastre `INTERNAL_API_URL` com a URL da API terminando em `/api/v1`.
4. Faça o deploy.

Depois, atualize `CORS_ORIGINS` na API com o domínio definitivo da Vercel e use:

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

## Fluxo do checkout

1. O cliente envia `Idempotency-Key`.
2. A API abre uma transação `Serializable`.
3. A chave é registrada para impedir duplicidade.
4. Cada produto é atualizado somente quando `stock >= quantity`.
5. Se algum produto falhar, toda a transação sofre rollback.
6. O pedido e seus itens são criados.
7. As movimentações de estoque são registradas.
8. O carrinho é limpo.
9. A chave recebe o identificador do pedido criado.

A camada de banco ainda possui `CHECK (stock >= 0)`, oferecendo uma segunda proteção.

## Principais endpoints

### Autenticação

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Produtos e carrinho

- `GET /api/v1/products`
- `POST /api/v1/products` — Admin
- `PATCH /api/v1/products/:id` — Admin
- `PATCH /api/v1/products/:id/stock` — Admin
- `DELETE /api/v1/products/:id` — Admin
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:productId`
- `DELETE /api/v1/cart/items/:productId`

### Pedidos

- `POST /api/v1/orders/checkout`
- `GET /api/v1/orders/me`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/cancel`

### Administração

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/products`
- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:id/status`
- `GET /api/v1/admin/customers`
- `GET /api/v1/admin/inventory/movements`

## Testes e qualidade

```bash
cd apps/api
npm test
npm run test:cov
npm run test:e2e
npm run build

cd ../web
npm run build
```

O GitHub Actions cria um PostgreSQL temporário, aplica as migrations, executa o seed, roda testes unitários e testes E2E, valida a concorrência da última unidade e gera os builds em pushes e pull requests.

## Resposta de erro padronizada

```json
{
  "statusCode": 409,
  "code": "OUT_OF_STOCK",
  "message": "Estoque insuficiente para o produto.",
  "details": {
    "productId": "uuid",
    "requested": 2
  },
  "path": "/api/v1/orders/checkout",
  "timestamp": "2026-07-20T20:00:00.000Z"
}
```

## Documentação adicional

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/business-rules.md`](docs/business-rules.md)
- [`docs/deployment-checklist.md`](docs/deployment-checklist.md)
- [`postman/OrderFlow.postman_collection.json`](postman/OrderFlow.postman_collection.json)

## Licença

MIT.
