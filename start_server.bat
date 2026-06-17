@echo off
cd /d "%~dp0"
if exist package.json (
  npm install
) else (
  echo package.json not found.
  pause
  exit /b 1
)
node run.js
pause
