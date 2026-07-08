@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo    Thndr Companion  -  جاري التشغيل...
echo ============================================
echo.

REM --- 1) Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js غير مثبت على الجهاز.
  echo     حمّل نسخة LTS من https://nodejs.org ثم شغّل هذا الملف مرة أخرى.
  echo.
  pause
  exit /b 1
)

REM --- 2) Install dependencies on first run ---
if not exist "node_modules" (
  echo تثبيت المكتبات لأول مرة... ^(قد يستغرق دقيقة^)
  call npm install
  if errorlevel 1 (
    echo.
    echo [!] فشل تثبيت المكتبات. راجع الرسالة بالأعلى.
    pause
    exit /b 1
  )
  echo.
)

REM --- 3) Create .env from example if missing ---
if not exist ".env" (
  if exist ".env.example" copy ".env.example" ".env" >nul
)

REM --- 4) Open the browser (small delay so the server is ready) ---
start "" /min cmd /c "timeout /t 3 >nul & start """" http://localhost:3000"

echo التطبيق يعمل الآن على:  http://localhost:3000
echo.
echo (لإيقاف التطبيق: اقفل هذه النافذة أو اضغط Ctrl+C)
echo ============================================
echo.

REM --- 5) Start the server (blocks here while running) ---
call npm start

pause
