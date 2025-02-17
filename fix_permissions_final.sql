-- 1. Grant usage on schema public (fixes "permission denied for schema public")
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant table permissions (fixes "permission denied for relation reports")
GRANT ALL ON TABLE public.reports TO authenticated;
GRANT ALL ON TABLE public.reports TO service_role;

-- 3. Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4. Clean up ANY existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;

-- 5. Recreate granular RLS policies
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE USING (auth.uid()::text = user_id);
