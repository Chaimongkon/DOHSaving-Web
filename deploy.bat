@echo off
echo ============================================
echo   DOHSaving-Web - Deploy Script
echo ============================================
echo.

cd /d C:\WebApps\DOHSaving-Web

echo [1/6] Pulling latest code from Git...
call git pull
if %errorlevel% neq 0 (
    echo ERROR: git pull failed!
    pause
    exit /b 1
)

echo.
echo [2/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [3/6] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: prisma generate failed!
    pause
    exit /b 1
)

echo.
echo [4/6] Building Next.js (standalone)...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm run build failed!
    pause
    exit /b 1
)

echo.
echo [5/6] Copying static assets to standalone...
REM standalone ไม่ include public/ และ .next/static/ ต้อง copy เอง
if exist ".next\standalone" (
    xcopy /E /I /Y "public" ".next\standalone\public"
    xcopy /E /I /Y ".next\static" ".next\standalone\.next\static"
    REM Copy .env.production สำหรับ runtime environment variables
    if exist ".env.production" copy /Y ".env.production" ".next\standalone\.env.production"
    echo Static assets copied successfully!
) else (
    echo WARNING: .next\standalone not found, skipping copy.
)

echo.
echo [6/6] Restarting PM2...
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

