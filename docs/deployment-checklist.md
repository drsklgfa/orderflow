# Checklist de publicação

## Antes de enviar ao GitHub

- [ ] Substituir o nome do autor no `LICENSE`, se desejado;
- [ ] confirmar que nenhum arquivo `.env` está versionado;
- [ ] executar testes da API;
- [ ] executar build da API e do frontend;
- [ ] revisar credenciais demonstrativas;
- [ ] publicar somente dados fictícios.

## Railway

- [ ] criar PostgreSQL;
- [ ] criar serviço da API com raiz `apps/api`;
- [ ] configurar `DATABASE_URL`;
- [ ] gerar três segredos aleatórios diferentes;
- [ ] cadastrar `CORS_ORIGINS`;
- [ ] definir `COOKIE_SECURE=true`;
- [ ] definir `COOKIE_SAME_SITE=lax`;
- [ ] definir health check `/api/v1/health`;
- [ ] confirmar `/docs` e `/api/v1/health`.

## Vercel

- [ ] importar o repositório;
- [ ] definir raiz `apps/web`;
- [ ] cadastrar `INTERNAL_API_URL=https://DOMINIO-API/api/v1`;
- [ ] realizar deploy;
- [ ] testar cookies no navegador;
- [ ] testar login cliente e admin;
- [ ] testar checkout e painel.

## GitHub

- [ ] branch principal protegida;
- [ ] Actions habilitadas;
- [ ] Dependabot habilitado;
- [ ] secret scanning habilitado;
- [ ] descrição e tópicos do repositório preenchidos;
- [ ] URLs do frontend e Swagger adicionadas ao README.
