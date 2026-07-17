-- ==============================================
-- Table: scheduled_jobs
-- ==============================================

CREATE TABLE public.scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('challenge_activate', 'notification')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  target_id UUID,
  payload JSONB DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_pending
  ON public.scheduled_jobs(status, scheduled_at)
  WHERE status = 'pending';

ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scheduled jobs admin all" ON public.scheduled_jobs;
CREATE POLICY "Scheduled jobs admin all"
  ON public.scheduled_jobs
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
