-- Add learning_plan to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS learning_plan TEXT DEFAULT '';

-- Add ai_encouragement to diaries table
ALTER TABLE public.diaries 
ADD COLUMN IF NOT EXISTS ai_encouragement TEXT DEFAULT '';
