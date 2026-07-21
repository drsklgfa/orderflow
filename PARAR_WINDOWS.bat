@echo off
setlocal
cd /d "%~dp0"
docker compose down
echo OrderFlow parado. Os dados do banco foram preservados.
pause
