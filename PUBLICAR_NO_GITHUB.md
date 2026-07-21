# Substituir a versão atual no GitHub

1. Extraia o pacote corrigido.
2. Copie todos os arquivos de dentro da pasta extraída para a pasta local que já está ligada ao repositório `drsklgfa/orderflow`.
3. Confirme **Substituir os arquivos no destino**. Não apague a pasta oculta `.git` da sua pasta local.
4. Dentro da pasta local `orderflow`, execute `ATUALIZAR_GITHUB.bat`.

O script fará automaticamente:

```text
git add -A
git commit
git branch -M main
git push
```

A Railway deverá detectar o push e iniciar um novo deploy. O arquivo `railway.toml` passa a controlar o comando de início, então não é necessário alterar novamente o Custom Start Command no painel.
