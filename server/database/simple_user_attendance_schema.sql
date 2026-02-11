-- 创建签到表
CREATE TABLE IF NOT EXISTS "user-attendance" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_user_attendance_user_date ON "user-attendance"(user_id, date);

-- 启用Row Level Security (RLS)
ALTER TABLE "user-attendance" ENABLE ROW LEVEL SECURITY;