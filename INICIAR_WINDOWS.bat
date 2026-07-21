@echo off
setlocal
cd /d "%~dp0"
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker nao foi encontrado. Instale e abra o Docker Desktop antes de continuar.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
echo Iniciando OrderFlow...
docker compose up --build
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar o projeto. Confira se o Docker Desktop esta aberto e se as portas 3000, 3001 e 5432 estao livres.
  pause
)
