# Supabase 数据库设置指南

## 步骤 1: 获取 Supabase API Key

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目（URL: `https://ymannyxsbkvtcxactcgz.supabase.co`）
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL**: `https://ymannyxsbkvtcxactcgz.supabase.co` ✅ (已提供)
   - **anon public key**: 复制这个 key

## 步骤 2: 配置环境变量

在 `server` 目录下创建 `.env` 文件：

```env
SUPABASE_URL=https://ymannyxsbkvtcxactcgz.supabase.co
SUPABASE_ANON_KEY=你的anon_key粘贴在这里
PORT=3001
```

## 步骤 3: 在 Supabase 中创建数据库表

### 方法一：使用 SQL Editor（推荐）

1. 在 Supabase Dashboard 中，点击左侧菜单的 **SQL Editor**
2. 点击 **New Query** 按钮
3. 复制 `server/database/schema.sql` 文件的全部内容
4. 粘贴到 SQL 编辑器中
5. 点击 **Run** 或按 `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac) 执行

### 方法二：使用 Table Editor（手动创建）

如果 SQL 执行失败，可以手动创建表：

#### 创建 users 表
1. 进入 **Table Editor** → **New Table**
2. 表名: `users`
3. 添加列：
   - `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
   - `name` (text, Not Null)
   - `email` (text, Unique)
   - `avatar_url` (text)
   - `level` (int4, Default: `1`)
   - `created_at` (timestamptz, Default: `now()`)
   - `updated_at` (timestamptz, Default: `now()`)

#### 创建 study_sessions 表
1. 新建表: `study_sessions`
2. 添加列：
   - `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
   - `user_id` (uuid, Foreign Key → users.id, On Delete: Cascade)
   - `duration_seconds` (int4, Default: `0`)
   - `started_at` (timestamptz, Default: `now()`)
   - `ended_at` (timestamptz, Nullable)
   - `status` (text, Default: `'active'`, Check: `status IN ('active', 'completed', 'cancelled')`)
   - `created_at` (timestamptz, Default: `now()`)
   - `updated_at` (timestamptz, Default: `now()`)

#### 创建 user_goals 表
1. 新建表: `user_goals`
2. 添加列：
   - `id` (uuid, Primary Key, Default: `gen_random_uuid()`)
   - `user_id` (uuid, Foreign Key → users.id, On Delete: Cascade)
   - `total_study_hours` (numeric(10,2), Default: `200`)
   - `daily_study_hours` (numeric(10,2), Default: `2`)
   - `created_at` (timestamptz, Default: `now()`)
   - `updated_at` (timestamptz, Default: `now()`)

## 步骤 4: 配置 Row Level Security (RLS)

1. 在 **Table Editor** 中，选择每个表
2. 进入 **Policies** 标签
3. 为每个表创建策略，允许所有操作（开发环境）

或者使用 SQL：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作）
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on study_sessions" ON study_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_goals" ON user_goals
  FOR ALL USING (true) WITH CHECK (true);
```

## 步骤 5: 验证设置

1. 在 Supabase Dashboard 的 **Table Editor** 中，确认三个表都已创建：
   - ✅ `users`
   - ✅ `study_sessions`
   - ✅ `user_goals`

2. 启动后端服务器：
   ```bash
   cd server
   npm run dev
   ```

3. 检查控制台，应该没有 Supabase 连接错误

## 快速 SQL 脚本

如果需要在 Supabase SQL Editor 中快速执行，使用以下完整脚本：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学习会话表
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户目标表
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_study_hours DECIMAL(10, 2) DEFAULT 200,
  daily_study_hours DECIMAL(10, 2) DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on study_sessions" ON study_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_goals" ON user_goals
  FOR ALL USING (true) WITH CHECK (true);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 完成！

设置完成后，您的应用将使用 Supabase PostgreSQL 数据库存储所有数据。
