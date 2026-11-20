@echo off
cd /d "%~dp0api"
echo Iniciando Backend Lumen (Lumiere) en http://127.0.0.1:8000 ...
php -S 127.0.0.1:8000
pause
