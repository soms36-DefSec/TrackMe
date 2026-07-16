@echo off
title TrackMe — Install Startup

echo ============================================
echo  TrackMe Startup Installer
echo ============================================
echo.

:: Step 1: Copy project to D:\TrackMe if not already there
if not exist "D:\TrackMe" (
    echo [1/3] Copying project to D:\TrackMe...
    xcopy /E /I /H /Y "%~dp0." "D:\TrackMe" >nul
    echo       Done.
) else (
    echo [1/3] D:\TrackMe already exists, skipping copy.
)

:: Copy the start.bat to D:\TrackMe in case it's not there
copy /Y "%~dp0start.bat" "D:\TrackMe\start.bat" >nul

:: Step 2: Install dependencies
echo [2/3] Installing npm dependencies...
cd /d D:\TrackMe
call npm install
echo       Done.

:: Step 3: Create shortcut in Windows Startup folder
echo [3/3] Adding TrackMe to Windows startup...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP%\TrackMe.bat

copy /Y "D:\TrackMe\start.bat" "%SHORTCUT%" >nul

echo.
echo ============================================
echo  Installation complete!
echo  TrackMe will now launch automatically
echo  every time you log into Windows.
echo.
echo  To test it now, press any key.
echo ============================================
pause >nul

call "D:\TrackMe\start.bat"
