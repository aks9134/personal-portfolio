@echo off
rem Double-click to see the site on this computer at http://localhost:3100
rem If it's already running, this just opens it. Otherwise it builds the site (about a minute) and starts it.
rem Close this window to stop the site.
cd /d "%~dp0"
netstat -ano | findstr ":3100 " | findstr LISTENING >nul
if not errorlevel 1 (
  start "" http://localhost:3100
  exit /b
)
echo Building the site...
call npm.cmd run build || (echo Build failed. & pause & exit /b 1)
start "" http://localhost:3100
call npm.cmd run start -- -p 3100
