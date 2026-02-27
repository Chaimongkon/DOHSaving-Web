@echo off
echo ============================================
echo   DOHSaving-Web - Deploy Script
echo ============================================
echo.

cd /d C:\WebApps\DOHSaving-Web

echo [1/5] Pulling latest code from Git...
call git pull
if %errorlevel% neq 0 (
    echo ERROR: git pull failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [3/5] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: prisma generate failed!
    pause
    exit /b 1
)

echo.
echo [4/5] Building Next.js...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm run build failed!
    pause
    exit /b 1
)

echo.
echo [5/5] Restarting PM2...
call pm2 restart dohsaving-web
if %errorlevel% neq 0 (
    echo PM2 process not found, starting new...
    call pm2 start ecosystem.config.js
)
call pm2 save

echo.
echo ============================================
echo   Deploy DONE!
echo   http://192.168.100.8:3000
echo ============================================
pause
