@echo off
echo Starting Backend Server (port 3001)...
start "Backend Server" cmd /k "cd server && npm run dev"

echo Starting Frontend (port 3000)...
start "Frontend" cmd /k "yarn start"

echo.
echo Both servers are starting in separate windows.
pause
