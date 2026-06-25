@echo off
:: Ensure Node.js is always on PATH regardless of terminal session
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ================================================
echo   LocalMart — Installing Dependencies
echo ================================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found. Running npm install...
echo.
cd /d "%~dp0"
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed. See above for details.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   SUCCESS: Dependencies installed!
echo   Run launch-local.bat to start the dev server.
echo ================================================
pause
