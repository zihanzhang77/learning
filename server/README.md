# FocusFlow 后端服务器

Express + TypeScript + Supabase 后端API服务器

## 安装

```bash
npm install
```

## 配置

1. 复制 `.env.example` 为 `.env`
2. 填写 Supabase 配置信息

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

## 运行

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 生产模式
```bash
npm start
```

## 数据库设置

在 Supabase SQL 编辑器中执行 `database/schema.sql` 创建数据库表结构。
