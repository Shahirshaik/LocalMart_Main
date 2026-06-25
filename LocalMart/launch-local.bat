@echo off
:: Ensure Node.js is always on PATH regardless of terminal session
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ================================================
echo   LocalMart — Local Setup (outside OneDrive)
echo ================================================
echo.

set "SRC=%~dp0"
set "DEST=C:\LMapp"

echo [1/4] Preparing local folder at %DEST%...
echo   Stopping any running Node processes...
taskkill /f /im node.exe /t >nul 2>&1
ping -n 4 127.0.0.1 >nul 2>&1
if exist "%DEST%" (
    echo   Removing old copy...
    rmdir /s /q "%DEST%"
    ping -n 3 127.0.0.1 >nul 2>&1
)
mkdir "%DEST%"
mkdir "%DEST%\src"
mkdir "%DEST%\supabase"

echo [2/4] Copying project files...
xcopy "%SRC%src" "%DEST%\src" /E /I /Y /Q
xcopy "%SRC%supabase" "%DEST%\supabase" /E /I /Y /Q
copy /Y "%SRC%package.json"        "%DEST%\package.json"
copy /Y "%SRC%next.config.ts"      "%DEST%\next.config.ts"
copy /Y "%SRC%tsconfig.json"       "%DEST%\tsconfig.json"
copy /Y "%SRC%tailwind.config.ts"  "%DEST%\tailwind.config.ts"
copy /Y "%SRC%postcss.config.mjs"  "%DEST%\postcss.config.mjs"
copy /Y "%SRC%.env.local"          "%DEST%\.env.local"
echo Done copying files.

echo [3/4] Installing npm dependencies in %DEST%...
cd /d "%DEST%"
call npm install

if %errorlevel% neq 0 (
    echo ERROR: npm install failed. See above for details.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   [4/4] Starting dev server...
echo   Open: http://localhost:3000
echo   Press Ctrl+C to stop.
echo ================================================
echo.
call npm run dev
pause
