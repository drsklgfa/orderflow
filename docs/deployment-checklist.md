# Checklist de publicação

## Antes de enviar ao GitHub

- [ ] confirmar que nenhum arquivo `.env` real está versionado;
- [ ] copiar todo o conteúdo do pacote corrigido sobre a pasta local `orderflow`;
- [ ] executar `ATUALIZAR_GITHUB.bat` ou `ATUALIZAR_GITHUB.ps1`;
- [ ] confirmar que o workflow de CI ficou verde.

## Railway

- [ ] manter o diretório raiz do serviço como `/apps/api`;
- [ ] manter o PostgreSQL no mesmo projeto;
- [ ] manter `DATABASE_URL=${{Postgres.DATABASE_URL}}` no serviço `orderflow`;
- [ ] cadastrar três segredos diferentes com pelo menos 32 caracteres;
- [ ] definir `NODE_ENV=production`;
- [ ] definir `COOKIE_SECURE=true`;
- [ ] definir `COOKIE_SAME_SITE=lax`;
- [ ] definir `ENABLE_SWAGGER=true`;
- [ ] usar a porta pública `3001`;
- [ ] não criar nem manter Custom Start Command manual: `railway.toml` já define o comando correto;
- [ ] confirmar `https://SEU-DOMINIO/api/v1/health`;
- [ ] confirmar `https://SEU-DOMINIO/docs`.

Variáveis mínimas da API:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=valor-aleatorio-com-mais-de-32-caracteres
JWT_REFRESH_SECRET=outro-valor-aleatorio-com-mais-de-32-caracteres
COOKIE_SECRET=terceiro-valor-aleatorio-com-mais-de-32-caracteres
CORS_ORIGINS=http://localhost:3000
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=7
ENABLE_SWAGGER=true
COOKIE_SAME_SITE=lax
COOKIE_SECURE=true
```

## Vercel

- [ ] importar o mesmo repositório;
- [ ] definir `apps/web` como Root Directory;
- [ ] cadastrar `INTERNAL_API_URL=https://orderflow-prod.up.railway.app`;
- [ ] realizar deploy;
- [ ] testar login de cliente e administrador;
- [ ] testar carrinho, checkout, pedidos e painel administrativo.

## GitHub

- [ ] Actions habilitadas;
- [ ] Dependabot habilitado;
- [ ] secret scanning habilitado;
- [ ] URLs do frontend e Swagger adicionadas ao README após o deploy.
