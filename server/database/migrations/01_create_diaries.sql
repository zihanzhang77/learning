-- 创建日记表
CREATE TABLE IF NOT EXISTS diaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建唯一索引，确保每天只能有一篇日记（根据需求可能是一篇，也可以是多篇，但“每日进展”通常隐含唯一性，或者允许追加。这里假设每天一篇主要记录，或者按ID区分）
-- 为了支持历史检索，加上 user_id 和 date 的索引
CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON diaries(user_id, date);

-- 开启 RLS (Row Level Security) - 如果 Supabase 开启了的话，这里作为示例
-- ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- 创建策略 (Policies)
-- CREATE POLICY "Users can manage their own diaries" ON diaries
--   FOR ALL USING (auth.uid() = user_id);
