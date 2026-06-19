@echo off
title EmergePet Dev Server
cd /d "%~dp0"
echo.
echo  Starting EmergePet on http://localhost:3333
echo  Press Ctrl+C to stop the server.
echo.
npx next dev --port 3333
pause
