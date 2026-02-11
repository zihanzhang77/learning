-- 创建签到表
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);

-- 启用Row Level Security (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;