-- Add learning plan related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_start_date DATE,
ADD COLUMN IF NOT EXISTS plan_end_date DATE,
ADD COLUMN IF NOT EXISTS learning_plan TEXT;

-- Verify the columns were added (optional, for manual verification)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
