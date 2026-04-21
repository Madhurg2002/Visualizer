@echo off
echo ============================================
echo  Installing Frontend Dependencies (Yarn)...
echo ============================================
yarn install

echo.
echo ============================================
echo  Installing Backend Dependencies (npm)...
echo ============================================
cd server
npm install
cd ..

echo.
echo All dependencies installed successfully!
pause
