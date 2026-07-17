-- ==============================================
-- Queries: scheduled_jobs
-- ==============================================

-- ==============================================
-- CREATE scheduled job
-- ==============================================
CREATE OR REPLACE FUNCTION create_scheduled_job(
  p_job_type TEXT,
  p_scheduled_at TIMESTAMPTZ,
  p_target_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_job_id UUID;
  v_existing_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can create scheduled jobs';
  END IF;

  IF p_job_type NOT IN ('challenge_activate', 'notification') THEN
    RAISE EXCEPTION 'Invalid job type: %', p_job_type;
  END IF;

  -- Replace existing pending job for same target instead of creating duplicate
  IF p_target_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.scheduled_jobs
    WHERE job_type = p_job_type
      AND target_id = p_target_id
      AND status = 'pending'
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      UPDATE public.scheduled_jobs
      SET scheduled_at = p_scheduled_at,
          payload = p_payload,
          created_by = v_user_id,
          created_at = now()
      WHERE id = v_existing_id
      RETURNING id INTO v_job_id;

      RETURN v_job_id;
    END IF;
  END IF;

  INSERT INTO public.scheduled_jobs(job_type, target_id, payload, scheduled_at, created_by)
  VALUES (p_job_type, p_target_id, p_payload, p_scheduled_at, v_user_id)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION create_scheduled_job(TEXT, TIMESTAMPTZ, UUID, JSONB) TO authenticated;

-- ==============================================
-- PROCESS pending scheduled jobs (called by pg_cron every minute)
-- ==============================================
CREATE OR REPLACE FUNCTION process_scheduled_jobs()
RETURNS TABLE (job_id UUID, job_type TEXT, result TEXT) AS $$
DECLARE
  v_job RECORD;
  v_notif_id UUID;
  v_first_blood TIMESTAMPTZ;
  v_result TEXT;
BEGIN
  FOR v_job IN
    SELECT *
    FROM public.scheduled_jobs
    WHERE status = 'pending' AND scheduled_at <= now()
    ORDER BY scheduled_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      IF v_job.job_type = 'challenge_activate' THEN
        UPDATE public.challenges
        SET is_active = true, updated_at = now()
        WHERE id = v_job.target_id;

        IF (v_job.payload->>'repost')::boolean = true THEN
          SELECT MIN(created_at) INTO v_first_blood
          FROM public.solves
          WHERE challenge_id = v_job.target_id;

          IF v_first_blood IS NULL OR v_job.scheduled_at <= v_first_blood THEN
            UPDATE public.challenges
            SET created_at = v_job.scheduled_at
            WHERE id = v_job.target_id;
            v_result := 'Challenge activated and reposted';
          ELSE
            UPDATE public.scheduled_jobs
            SET status = 'failed',
                executed_at = now(),
                error_message = 'Cannot repost: first blood at ' || v_first_blood
            WHERE id = v_job.id;
            job_id := v_job.id;
            job_type := v_job.job_type;
            result := 'Failed: repost after first blood';
            RETURN NEXT;
            CONTINUE;
          END IF;
        ELSE
          v_result := 'Challenge activated';
        END IF;

      ELSIF v_job.job_type = 'notification' THEN
        INSERT INTO public.notifications(title, message, level, created_by, created_at)
        VALUES (
          v_job.payload->>'title',
          v_job.payload->>'message',
          COALESCE(v_job.payload->>'level', 'info'),
          v_job.created_by,
          v_job.scheduled_at
        )
        RETURNING id INTO v_notif_id;

        v_result := 'Notification sent: ' || v_notif_id;
      END IF;

      UPDATE public.scheduled_jobs
      SET status = 'completed',
          executed_at = now(),
          error_message = NULL
      WHERE id = v_job.id;

      job_id := v_job.id;
      job_type := v_job.job_type;
      result := v_result;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      UPDATE public.scheduled_jobs
      SET status = 'failed',
          executed_at = now(),
          error_message = SQLERRM
      WHERE id = v_job.id;

      job_id := v_job.id;
      job_type := v_job.job_type;
      result := 'Error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION process_scheduled_jobs() TO authenticated;

-- ==============================================
-- GET scheduled jobs (with optional status filter)
-- ==============================================
DROP FUNCTION IF EXISTS get_scheduled_jobs(TEXT, INT, INT);

CREATE OR REPLACE FUNCTION get_scheduled_jobs(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  job_type TEXT,
  status TEXT,
  target_id UUID,
  target_title TEXT,
  payload JSONB,
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT sj.id, sj.job_type, sj.status, sj.target_id,
         COALESCE(c.title::TEXT, ''),
         sj.payload,
         sj.scheduled_at, sj.executed_at, sj.error_message, sj.created_by, sj.created_at
  FROM public.scheduled_jobs sj
  LEFT JOIN public.challenges c ON c.id = sj.target_id AND sj.job_type = 'challenge_activate'
  WHERE (p_status IS NULL OR sj.status = p_status)
  ORDER BY sj.scheduled_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_scheduled_jobs(TEXT, INT, INT) TO authenticated;

-- ==============================================
-- DELETE / cancel a scheduled job
-- ==============================================
CREATE OR REPLACE FUNCTION delete_scheduled_job(
  p_job_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can delete scheduled jobs';
  END IF;

  DELETE FROM public.scheduled_jobs WHERE id = p_job_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION delete_scheduled_job(UUID) TO authenticated;

-- ==============================================
-- REPOST challenge (standalone, can be called manually)
-- Validates against first blood timestamp
-- ==============================================
CREATE OR REPLACE FUNCTION repost_challenge(
  p_challenge_id UUID,
  p_new_date TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  v_first_blood TIMESTAMPTZ;
  v_before JSONB;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Only admin can repost challenge');
  END IF;

  SELECT MIN(created_at) INTO v_first_blood
  FROM public.solves
  WHERE challenge_id = p_challenge_id;

  IF v_first_blood IS NOT NULL AND p_new_date > v_first_blood THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Cannot repost: first blood at ' || v_first_blood
    );
  END IF;

  SELECT jsonb_build_object('created_at', c.created_at, 'title', c.title)
  INTO v_before
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  UPDATE public.challenges
  SET created_at = p_new_date, updated_at = now()
  WHERE id = p_challenge_id;

  PERFORM public.write_admin_audit_log(
    'UPDATE',
    'challenge',
    p_challenge_id,
    v_before,
    jsonb_build_object('created_at', p_new_date),
    jsonb_build_object('action', 'repost')
  );

  RETURN json_build_object('success', true, 'created_at', p_new_date);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION repost_challenge(UUID, TIMESTAMPTZ) TO authenticated;

-- ==============================================
-- GET first blood timestamp for a challenge
-- ==============================================
CREATE OR REPLACE FUNCTION get_challenge_first_blood(p_challenge_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_first_blood TIMESTAMPTZ;
BEGIN
  SELECT MIN(created_at) INTO v_first_blood
  FROM public.solves
  WHERE challenge_id = p_challenge_id;
  RETURN v_first_blood;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_challenge_first_blood(UUID) TO authenticated;

-- ==============================================
-- SCHEDULE pg_cron to process pending jobs every minute
-- ==============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-jobs') THEN
    PERFORM cron.schedule(
      'process-scheduled-jobs',
      '* * * * *',
      $cron$ SELECT process_scheduled_jobs(); $cron$
    );
  END IF;
END;
$$;
