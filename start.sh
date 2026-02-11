#!/bin/bash

echo "启动 FocusFlow 应用..."
echo ""

echo "启动后端服务器..."
cd server && npm run dev &
BACKEND_PID=$!

sleep 3

echo "启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "应用已启动！"
echo "后端: http://localhost:3001"
echo "前端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
