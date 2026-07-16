@echo off
title TrackMe
cd /d D:\TrackMe

:: Check if node is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Start Vite dev server in the background
start /b "" cmd /c "npm run dev > D:\TrackMe\server.log 2>&1"

:: Wait for server to be ready (check up to 15 seconds)
echo Starting TrackMe...
set /a attempts=0
:wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 goto open_browser
if %attempts% lss 15 goto wait_loop

:: Fallback: open anyway after 15s
:open_browser
start "" "http://localhost:8080"
exit
