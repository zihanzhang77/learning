# FocusFlow Dashboard - 专注学习时间管理应用

一个前后端一体的专注学习时间管理应用，使用 React + TypeScript + Express + Supabase 构建。

## 功能特性

- 📊 **仪表盘**: 查看今日学习进度、累计学习时长、每周活跃度
- ⏱️ **专注计时器**: 开始/暂停/重置学习计时，记录学习时长
- 📈 **数据统计**: 查看不同时间段（今日/本周/本月/累计）的学习统计数据
- 👤 **个人中心**: 查看个人资料、设置学习目标、查看成就

## 技术栈

### 前端
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS

### 后端
- Node.js
- Express
- TypeScript
- Supabase (PostgreSQL)

## 项目结构

```
focusflow-dashboard/
├── src/                    # 前端源代码
│   ├── context/           # React Context (用户状态管理)
│   ├── services/          # API服务层
│   └── pages/             # 页面组件
├── server/                # 后端服务器
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── routes/        # API路由
│   │   └── index.ts       # 服务器入口
│   └── database/          # 数据库脚本
└── package.json           # 前端依赖
```

## 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 账户

### 1. 安装依赖

#### 前端
```bash
npm install
```

#### 后端
```bash
cd server
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 获取项目 URL 和 Anon Key
3. 在 Supabase SQL 编辑器中执行 `server/database/schema.sql` 创建数据库表

### 3. 配置环境变量

#### 后端环境变量 (`server/.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

#### 前端环境变量 (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. 启动应用

#### 启动后端服务器
```bash
cd server
npm run dev
```

后端服务器将在 `http://localhost:3001` 运行

#### 启动前端开发服务器
```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 运行

## API 接口

### 用户接口
- `GET /api/user/:userId` - 获取用户信息
- `POST /api/user` - 创建用户
- `PUT /api/user/:userId` - 更新用户信息

### 计时器接口
- `POST /api/timer/start` - 开始计时
- `POST /api/timer/end` - 结束计时
- `GET /api/timer/today/:userId` - 获取今日学习记录
- `GET /api/timer/streak/:userId` - 获取连续学习天数

### 统计接口
- `GET /api/stats/:userId?period=week` - 获取统计数据（day/week/month/all）
- `GET /api/stats/:userId/weekly` - 获取每周活跃度数据

### 目标接口
- `GET /api/goal/:userId` - 获取用户目标
- `POST /api/goal` - 创建或更新目标
- `PUT /api/goal/:userId` - 更新目标

## 数据库表结构

### users (用户表)
- `id` - UUID (主键)
- `name` - 用户名
- `email` - 邮箱
- `avatar_url` - 头像URL
- `level` - 用户等级
- `created_at` - 创建时间
- `updated_at` - 更新时间

### study_sessions (学习会话表)
- `id` - UUID (主键)
- `user_id` - 用户ID (外键)
- `duration_seconds` - 学习时长（秒）
- `started_at` - 开始时间
- `ended_at` - 结束时间
- `status` - 状态 (active/completed/cancelled)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### user_goals (用户目标表)
- `id` - UUID (主键)
- `user_id` - 用户ID (外键)
- `total_study_hours` - 累计学习目标（小时）
- `daily_study_hours` - 每日学习目标（小时）
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 开发说明

### 后端开发
```bash
cd server
npm run dev    # 开发模式（热重载）
npm run build  # 构建
npm start      # 生产模式
```

### 前端开发
```bash
npm run dev    # 开发模式
npm run build  # 构建
npm run preview # 预览构建结果
```

## 注意事项

1. 当前使用默认用户ID (`default-user-123`)，在生产环境中应该集成认证系统
2. Supabase RLS (Row Level Security) 策略已设置为允许所有操作，生产环境需要根据实际需求调整
3. 确保后端服务器在启动前端之前运行

## 许可证

MIT
