# FocusFlow 项目设置指南

## 完整设置步骤

### 1. 安装依赖

#### 前端依赖
```bash
npm install
```

#### 后端依赖
```bash
cd server
npm install
cd ..
```

### 2. 设置 Supabase

1. 访问 [Supabase](https://supabase.com) 并登录
2. 创建新项目
3. 等待项目创建完成
4. 进入项目设置，获取以下信息：
   - **Project URL** (例如: `https://xxxxx.supabase.co`)
   - **anon/public key** (在 API Settings 中)

### 3. 创建数据库表

1. 在 Supabase 项目中，进入 **SQL Editor**
2. 点击 **New Query**
3. 复制 `server/database/schema.sql` 文件的内容
4. 粘贴到 SQL 编辑器中
5. 点击 **Run** 执行 SQL 脚本

这将创建以下表：
- `users` - 用户表
- `study_sessions` - 学习会话表
- `user_goals` - 用户目标表

### 4. 配置环境变量

#### 后端环境变量

在 `server` 目录下创建 `.env` 文件：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3001
```

#### 前端环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:3001/api
```

### 5. 启动应用

#### 方式一：使用启动脚本（推荐）

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

#### 方式二：手动启动

**终端 1 - 启动后端:**
```bash
cd server
npm run dev
```

**终端 2 - 启动前端:**
```bash
npm run dev
```

### 6. 访问应用

- 前端: http://localhost:3000
- 后端API: http://localhost:3001
- API健康检查: http://localhost:3001/api/health

## 验证设置

1. 打开浏览器访问 http://localhost:3000
2. 应用应该自动创建默认用户并显示仪表盘
3. 尝试使用计时器功能，开始一个学习会话
4. 检查统计数据是否正常显示

## 常见问题

### 后端无法连接 Supabase

- 检查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
- 确保 Supabase 项目已创建并处于活动状态

### 前端无法连接后端

- 确保后端服务器正在运行（http://localhost:3001）
- 检查 `.env` 文件中的 `VITE_API_URL` 是否正确
- 检查浏览器控制台是否有 CORS 错误

### 数据库表不存在

- 确保已在 Supabase SQL 编辑器中执行了 `schema.sql` 脚本
- 检查 Supabase 项目中的 Table Editor，确认表已创建

### 用户数据不显示

- 检查浏览器控制台的网络请求
- 确认后端 API 返回了正确的数据
- 检查 Supabase 数据库中的数据是否存在

## 下一步

- 集成用户认证系统（如 Supabase Auth）
- 添加更多统计功能
- 优化 UI/UX
- 添加数据导出功能
