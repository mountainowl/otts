@echo off
setlocal
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%LOCALAPPDATA%\Programs\Python\Launcher;%PATH%"

where bun >nul 2>&1
if errorlevel 1 (
  echo Bun is required. Install it from https://bun.sh and run this file again.
  pause
  exit /b 1
)

where py >nul 2>&1
if errorlevel 1 (
  where python >nul 2>&1
  if errorlevel 1 (
    echo Python is required. Install Python 3.12 and run this file again.
    pause
    exit /b 1
  )
)

if not exist "node_modules\vite\package.json" (
  echo Preparing Vaani...
  call bun install --frozen-lockfile
  if errorlevel 1 goto :failed
)

if not exist ".venv\Scripts\python.exe" (
  echo Preparing the CPU speech service. This one-time step needs internet access...
  call bun run setup:cpu
  if errorlevel 1 goto :failed
)

set "VAANI_OPEN_BROWSER=1"
echo Starting Vaani. Keep this window open while using the application.
call bun run dev:cpu
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo Vaani could not start. Review the message above, then try again.
pause
exit /b 1
