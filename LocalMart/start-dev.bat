@echo off
echo ================================================
echo   LocalMart — Starting Dev Server
echo ================================================
echo.

cd /d "%~dp0"

echo Starting Next.js on http://localhost:3000
echo Press Ctrl+C to stop.
echo.

node node_modules\next\dist\bin\next dev
pause
