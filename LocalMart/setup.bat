@echo off
echo ================================================
echo   LocalMart — Project Setup
echo ================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/3] Installing dependencies (this may take 1-2 minutes)...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Check the output above.
    pause
    exit /b 1
)

echo.
echo [3/3] Setup complete!
echo.
echo ================================================
echo   Run  start-dev.bat  to launch the app
echo   Then open: http://localhost:3000
echo ================================================
echo.
pause
