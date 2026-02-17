-- 1. Add plan columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan_start_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan_end_date DATE;

-- 2. Create RPC for total manual study time (optimization)
CREATE OR REPLACE FUNCTION get_total_manual_study_hours(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(study_hours), 0)
  INTO total
  FROM public.user_time_consumption
  WHERE user_id = user_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;
