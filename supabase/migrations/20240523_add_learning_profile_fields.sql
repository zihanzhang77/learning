-- Add learning profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS learning_topic TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS target_goal TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT '';

-- Update RLS policies if necessary to allow users to update their own profile
-- (Assuming existing policies cover update based on user_id)
