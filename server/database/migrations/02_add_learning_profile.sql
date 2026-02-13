-- 添加学习档案字段到用户表
-- 在Supabase SQL编辑器中执行此脚本

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'learning_topic'
  ) THEN
    ALTER TABLE users ADD COLUMN learning_topic TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'target_goal'
  ) THEN
    ALTER TABLE users ADD COLUMN target_goal TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'current_level'
  ) THEN
    ALTER TABLE users ADD COLUMN current_level TEXT;
  END IF;
END $$;
