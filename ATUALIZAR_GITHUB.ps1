$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.git')) {
  Write-Host 'ERRO: execute este arquivo dentro da pasta local orderflow que ja esta ligada ao GitHub.' -ForegroundColor Red
  exit 1
}

$obsoleteFiles = @(
  'apps/api/prisma/seed.ts',
  'apps/api/tsconfig.seed.json'
)
foreach ($file in $obsoleteFiles) {
  if (Test-Path $file) { Remove-Item $file -Force }
}

git add -A
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  git commit -m 'Correcao final de build e deploy do OrderFlow'
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} elseif ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
} else {
  Write-Host 'Nenhuma alteracao nova para criar commit.' -ForegroundColor Yellow
}

git branch -M main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git push -u origin main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Arquivos enviados ao GitHub. A Railway iniciara o novo deploy automaticamente.' -ForegroundColor Green
