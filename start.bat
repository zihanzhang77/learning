@echo off
cd /d "%~dp0"
echo 启动 FocusFlow 应用...
echo.

echo 启动后端服务器...
start "FocusFlow-后端" cmd /k "cd /d "%~dp0server" && npm run dev"

timeout /t 4 /nobreak >nul

echo 启动前端开发服务器...
start "FocusFlow-前端" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ========================================
echo  在浏览器中打开:  http://localhost:3000
echo ========================================
echo 后端 API: http://localhost:3001
echo.
echo 请等待几秒后访问上述地址，不要关闭弹出的两个窗口。
pause
