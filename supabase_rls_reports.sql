-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;

-- Create comprehensive RLS policies
-- 1. VIEW: Users can see reports where they are the owner
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 2. INSERT: Users can create reports for themselves
CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 3. UPDATE: Users can update their own reports
CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- 4. DELETE: Users can delete their own reports
CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE
  USING (auth.uid()::text = user_id);
