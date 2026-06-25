@echo off
echo ================================================
echo   LocalMart — Starting Dev Server (C:\LMapp)
echo ================================================
echo.

cd /d "C:\LMapp"

if not exist "node_modules\next\dist\bin\next" (
    echo ERROR: node_modules not found. Run launch-local.bat first.
    pause
    exit /b 1
)

echo Starting Next.js on http://localhost:3000
echo Press Ctrl+C to stop.
echo.

node node_modules\next\dist\bin\next dev
pause
