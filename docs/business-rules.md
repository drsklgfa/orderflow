# Regras de negócio

## Usuários

1. E-mail é único e normalizado em minúsculas.
2. Cadastro público cria somente perfil `CUSTOMER`.
3. Senhas exigem ao menos 10 caracteres, maiúscula, minúscula, número e símbolo.
4. Usuário desativado não consegue autenticar ou renovar sessão.
5. Clientes acessam somente os próprios pedidos.

## Produtos

1. SKU é único e armazenado em maiúsculas.
2. Preço é armazenado em centavos e deve ser positivo.
3. Estoque nunca pode ser negativo.
4. Exclusão é lógica: o produto é desativado e recebe `deletedAt`.
5. Alteração comum do produto não modifica diretamente o estoque; ajustes usam endpoint próprio e criam movimentação.
6. Nome e preço são copiados para `OrderItem`, preservando o histórico.

## Carrinho

1. Existe um carrinho por usuário.
2. Quantidade deve estar entre 1 e 99.
3. Produto inativo ou excluído não pode ser adicionado.
4. A quantidade do carrinho não pode ultrapassar o estoque no momento da inclusão, mas é revalidada no checkout.
5. O servidor ignora qualquer preço informado pelo cliente.

## Pedidos

1. Carrinho vazio não pode ser finalizado.
2. Checkout exige chave de idempotência.
3. Reserva de estoque, criação do pedido, itens, movimentações e limpeza do carrinho pertencem à mesma transação.
4. Falha em qualquer item cancela tudo.
5. Cliente cancela somente pedido `PENDING`.
6. Cancelamento repõe o estoque e gera movimentação `RETURN`.
7. Transições administrativas permitidas:

```text
PENDING -> PAID ou CANCELLED
PAID -> PROCESSING ou CANCELLED
PROCESSING -> SHIPPED
SHIPPED -> DELIVERED
DELIVERED -> nenhuma
CANCELLED -> nenhuma
```

## Receita do dashboard

A receita considera pedidos `PAID`, `PROCESSING`, `SHIPPED` e `DELIVERED`. Pedidos pendentes e cancelados não entram no total.
