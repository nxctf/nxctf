-- ==============================================
-- Queries: challenges
-- Source: sql/chema.sql
-- ==============================================

-- SELECT
CREATE OR REPLACE FUNCTION public.match_event_mode(
  p_event_mode TEXT,
  p_event_id UUID,
  c_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_event_mode = 'any'
    OR (p_event_mode IN ('main', 'is_null') AND c_event_id IS NULL)
    OR (p_event_id IS NOT NULL AND c_event_id = p_event_id AND p_event_mode IN ('event', 'equals'));
$$;

GRANT EXECUTE ON FUNCTION public.match_event_mode(TEXT, UUID, UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.validate_challenge_access(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_is_active BOOLEAN;
  v_is_maintenance BOOLEAN;
  v_event_id UUID;
  v_event_start TIMESTAMPTZ;
  v_event_end TIMESTAMPTZ;
  v_event_exists BOOLEAN;
  v_event_join_mode TEXT;
  v_always_show_challenges BOOLEAN := FALSE;
  v_is_event_member BOOLEAN := FALSE;
  v_is_admin_override BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  IF public.is_banned(p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Your account is currently banned/suspended.');
  END IF;

  SELECT c.is_active,
         c.is_maintenance,
         c.event_id,
         e.start_time,
         e.end_time,
         (e.id IS NOT NULL),
         e.join_mode,
         COALESCE(e.always_show_challenges, false)
  INTO v_is_active,
       v_is_maintenance,
       v_event_id,
       v_event_start,
       v_event_end,
       v_event_exists,
       v_event_join_mode,
       v_always_show_challenges
  FROM public.challenges c
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE c.id = p_challenge_id;

  IF v_is_active IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Challenge not found');
  END IF;

  v_is_admin_override := public.is_admin() OR public.can_manage_challenge(p_challenge_id);

  IF NOT v_is_admin_override THEN
    IF COALESCE(v_is_maintenance, false) THEN
      RETURN json_build_object('success', false, 'message', 'Challenge is under maintenance');
    END IF;

    IF NOT COALESCE(v_is_active, TRUE) THEN
      RETURN json_build_object('success', false, 'message', 'Challenge is not active');
    END IF;

    IF v_event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true' THEN
      RETURN json_build_object('success', false, 'message', 'Default challenges are disabled');
    END IF;
  END IF;

  IF v_event_id IS NOT NULL AND NOT COALESCE(v_event_exists, false) THEN
    RETURN json_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF NOT v_is_admin_override AND v_event_id IS NOT NULL THEN
    IF COALESCE(v_event_join_mode, 'open') <> 'open' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.event_participants ep
        WHERE ep.event_id = v_event_id
          AND ep.user_id = p_user_id
      ) INTO v_is_event_member;

      IF NOT v_is_event_member THEN
        RETURN json_build_object('success', false, 'message', 'Join this event first before accessing its challenges');
      END IF;
    END IF;

    IF v_event_start IS NOT NULL AND now() < v_event_start THEN
      RETURN json_build_object('success', false, 'message', 'Event has not started yet');
    END IF;

    IF v_event_end IS NOT NULL AND now() > v_event_end AND NOT v_always_show_challenges THEN
      RETURN json_build_object('success', false, 'message', 'Event has ended');
    END IF;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.validate_challenge_access(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_category_totals(p_event_id UUID DEFAULT NULL, p_event_mode TEXT DEFAULT 'any')
RETURNS TABLE (
  category TEXT,
  total_challenges INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.category::TEXT, COUNT(*)::int
  FROM public.challenges c
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE c.is_active = true
    AND (
      (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') <> 'true')
      OR (
        c.event_id IS NOT NULL AND (e.start_time IS NULL OR now() >= e.start_time)
      )
    )
    AND public.match_event_mode(p_event_mode, p_event_id, c.event_id)
  GROUP BY c.category
  ORDER BY c.category;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_category_totals(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_difficulty_totals(p_event_id UUID DEFAULT NULL, p_event_mode TEXT DEFAULT 'any')
RETURNS TABLE (
  difficulty TEXT,
  total_challenges INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.difficulty::TEXT, COUNT(*)::int
  FROM public.challenges c
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE c.is_active = true
    AND (
      (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') <> 'true')
      OR (
        c.event_id IS NOT NULL AND (e.start_time IS NULL OR now() >= e.start_time)
      )
    )
    AND public.match_event_mode(p_event_mode, p_event_id, c.event_id)
  GROUP BY c.difficulty
  ORDER BY c.difficulty;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_difficulty_totals(UUID, TEXT) TO authenticated;



-- INSERT
CREATE OR REPLACE FUNCTION add_challenge(
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_points INTEGER,
  p_flag TEXT,
  p_difficulty TEXT,
  p_hint JSONB DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]',
  p_is_dynamic BOOLEAN DEFAULT false,
  p_is_maintenance BOOLEAN DEFAULT false,
  p_min_points INTEGER DEFAULT 0,
  p_decay_per_solve INTEGER DEFAULT 0,
  p_max_points INTEGER DEFAULT NULL,
  p_event_id UUID DEFAULT NULL,
  p_flag_placeholder BOOLEAN DEFAULT false,
  p_services TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_challenge_id UUID;
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only admin can add challenge';
  END IF;

  INSERT INTO public.challenges(title, description, category, points, max_points, hint, attachments, difficulty, is_active, is_maintenance, is_dynamic, min_points, decay_per_solve, event_id, flag_placeholder, services)
  VALUES (p_title, p_description, p_category, p_points, p_max_points, p_hint, p_attachments, p_difficulty, true, p_is_maintenance, p_is_dynamic, p_min_points, p_decay_per_solve, p_event_id, p_flag_placeholder, p_services)
  RETURNING id INTO v_challenge_id;

  INSERT INTO public.challenge_flags(challenge_id, flag)
  VALUES (v_challenge_id, p_flag);

  PERFORM public.write_admin_audit_log(
    'CREATE',
    'challenge',
    v_challenge_id,
    NULL,
    jsonb_build_object(
      'title', p_title,
      'description', p_description,
      'category', p_category,
      'points', p_points,
      'max_points', p_max_points,
      'difficulty', p_difficulty,
      'is_active', true,
      'is_maintenance', p_is_maintenance,
      'is_dynamic', p_is_dynamic,
      'min_points', p_min_points,
      'decay_per_solve', p_decay_per_solve,
      'event_id', p_event_id,
      'flag_placeholder', p_flag_placeholder,
      'services_count', COALESCE(array_length(p_services, 1), 0)
    ),
    '{}'::jsonb
  );

  RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION add_challenge(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB, JSONB, BOOLEAN, BOOLEAN, INTEGER, INTEGER, INTEGER, UUID, BOOLEAN, TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION submit_flag(
  p_challenge_id uuid,
  p_flag text
)
RETURNS json AS $$
DECLARE
  v_user_id uuid := auth.uid()::uuid;
  v_flag TEXT;
  v_points INTEGER;
  v_max_points INTEGER;
  v_is_dynamic BOOLEAN;
  v_min_points INTEGER;
  v_decay_per_solve INTEGER;
  v_event_id UUID;
  v_solver_count INTEGER;
  v_awarded_points INTEGER;
  v_existing INT;
  v_is_correct BOOLEAN;
  v_access JSON;
  v_is_admin_override BOOLEAN := FALSE;
BEGIN
  v_access := public.validate_challenge_access(p_challenge_id, v_user_id);
  IF NOT (v_access->>'success')::BOOLEAN THEN
    RETURN v_access;
  END IF;

  v_is_admin_override := public.is_admin() OR public.can_manage_challenge(p_challenge_id);

  -- Rate limiting check (skip for admins)
  IF NOT v_is_admin_override THEN
    DECLARE
      v_window_attempts INT := 0;
      v_window_start TIMESTAMPTZ;
      v_seconds_elapsed INT;
      v_cooldown_remaining INT;
    BEGIN
      SELECT window_attempts, window_start_at
      INTO v_window_attempts, v_window_start
      FROM public.flag_submissions
      WHERE user_id = v_user_id AND challenge_id = p_challenge_id;

      IF FOUND THEN
        v_seconds_elapsed := EXTRACT(EPOCH FROM (now() - v_window_start))::INT;
        IF v_seconds_elapsed < 60 AND v_window_attempts >= 10 THEN
          v_cooldown_remaining := 60 - v_seconds_elapsed;
          RETURN json_build_object(
            'success', false,
            'message', 'Rate limited. Try again in ' || v_cooldown_remaining || 's.'
          );
        END IF;
      END IF;
    END;
  END IF;

  SELECT cf.flag, c.points, c.max_points, c.is_dynamic, c.min_points, c.decay_per_solve, c.event_id
  INTO v_flag, v_points, v_max_points, v_is_dynamic, v_min_points, v_decay_per_solve, v_event_id
  FROM public.challenge_flags cf
  JOIN public.challenges c ON c.id = cf.challenge_id
  WHERE cf.challenge_id = p_challenge_id;

  -- Intercept GeoGuessr flag check
  IF public.is_geo_flag(v_flag) THEN
    DECLARE
      v_target RECORD;
      v_submitted RECORD;
      v_distance DOUBLE PRECISION;
    BEGIN
      SELECT * INTO v_target FROM public.parse_geo_flag(v_flag) LIMIT 1;
      SELECT * INTO v_submitted FROM public.parse_submitted_geo_flag(p_flag) LIMIT 1;

      IF v_target IS NULL OR v_submitted IS NULL THEN
        v_is_correct := FALSE;
      ELSE
        v_distance := public.haversine_distance(v_target.target_lat, v_target.target_lng, v_submitted.lat, v_submitted.lng);
        IF lower(v_target.prefix) = lower(v_submitted.prefix) AND v_distance <= v_target.radius_km THEN
          v_is_correct := TRUE;
        ELSE
          v_is_correct := FALSE;
        END IF;
      END IF;
    END;
  ELSE
    v_is_correct := p_flag = v_flag;
  END IF;

  -- Log/upsert submission stats (skip for admins)
  IF NOT v_is_admin_override THEN
    SELECT count(*) INTO v_existing
    FROM public.solves
    WHERE user_id = v_user_id AND challenge_id = p_challenge_id;

    INSERT INTO public.flag_submissions (
      user_id, challenge_id,
      incorrect_attempts, last_attempt_at,
      window_attempts, window_start_at
    )
    VALUES (
      v_user_id,
      p_challenge_id,
      CASE WHEN v_is_correct OR v_existing > 0 THEN 0 ELSE 1 END,
      now(),
      1,
      now()
    )
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET
      incorrect_attempts = CASE
        WHEN v_is_correct OR v_existing > 0 THEN public.flag_submissions.incorrect_attempts
        ELSE public.flag_submissions.incorrect_attempts + 1
      END,
      last_attempt_at = now(),
      window_start_at = CASE
        WHEN EXTRACT(EPOCH FROM (now() - public.flag_submissions.window_start_at)) >= 60 THEN now()
        ELSE public.flag_submissions.window_start_at
      END,
      window_attempts = CASE
        WHEN EXTRACT(EPOCH FROM (now() - public.flag_submissions.window_start_at)) >= 60 THEN 1
        ELSE public.flag_submissions.window_attempts + 1
      END;
  END IF;

  IF NOT v_is_correct THEN
    IF public.is_geo_flag(v_flag) THEN
      RETURN json_build_object('success', false, 'message', 'Too far! Incorrect location guess.');
    END IF;
    RETURN json_build_object('success', false, 'message', 'Incorrect flag');
  END IF;

  SELECT count(*) INTO v_existing
  FROM solves
  WHERE user_id = v_user_id AND challenge_id = p_challenge_id;

  IF v_existing > 0 THEN
    IF v_is_admin_override THEN
      RETURN json_build_object('success', true, 'message', 'Correct (admin). No points awarded.');
    ELSE
      RETURN json_build_object('success', true, 'message', 'Correct, but already solved.');
    END IF;
  END IF;

  IF v_is_admin_override THEN
    RETURN json_build_object('success', true, 'message', 'Correct (admin). No points awarded.');
  END IF;

  IF v_is_dynamic THEN
    SELECT points INTO v_awarded_points FROM public.challenges WHERE id = p_challenge_id;
  ELSE
    v_awarded_points := v_points;
  END IF;

  INSERT INTO solves(user_id, challenge_id) VALUES (v_user_id, p_challenge_id);

  RETURN json_build_object('success', true, 'message', format('Correct! +%s points.', v_awarded_points));
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION submit_flag(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_challenge_solves()
RETURNS void AS $$
BEGIN
  UPDATE public.challenges c
  SET total_solves = (
    SELECT COUNT(*)::integer FROM public.solves s WHERE s.challenge_id = c.id
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.sync_challenge_solves() TO authenticated;



CREATE OR REPLACE FUNCTION update_challenge(
  p_challenge_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_points INTEGER,
  p_difficulty TEXT,
  p_hint JSONB DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]',
  p_is_active BOOLEAN DEFAULT NULL,
  p_is_maintenance BOOLEAN DEFAULT NULL,
  p_flag TEXT DEFAULT NULL,
  p_is_dynamic BOOLEAN DEFAULT false,
  p_min_points INTEGER DEFAULT 0,
  p_decay_per_solve INTEGER DEFAULT 0,
  p_max_points INTEGER DEFAULT NULL,
  p_event_id UUID DEFAULT NULL,
  p_flag_placeholder BOOLEAN DEFAULT NULL,
  p_services TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_solver_count INT;
  v_existing_event_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  SELECT c.event_id,
    jsonb_build_object(
      'title', c.title,
      'description', c.description,
      'category', c.category,
      'points', c.points,
      'max_points', c.max_points,
      'difficulty', c.difficulty,
      'is_active', c.is_active,
      'is_maintenance', c.is_maintenance,
      'is_dynamic', c.is_dynamic,
      'min_points', c.min_points,
      'decay_per_solve', c.decay_per_solve,
      'event_id', c.event_id,
      'flag_placeholder', c.flag_placeholder,
      'services_count', COALESCE(array_length(c.services, 1), 0)
    )
  INTO v_existing_event_id, v_before
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  IF NOT can_manage_event(v_existing_event_id) OR NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only admin can update challenge';
  END IF;

  UPDATE public.challenges
  SET title = p_title,
      description = p_description,
      category = p_category,
      points = p_points,
      max_points = p_max_points,
      difficulty = p_difficulty,
      hint = p_hint,
      attachments = p_attachments,
      is_active = COALESCE(p_is_active, is_active),
      is_maintenance = COALESCE(p_is_maintenance, is_maintenance),
      is_dynamic = p_is_dynamic,
      min_points = p_min_points,
      decay_per_solve = p_decay_per_solve,
      event_id = p_event_id,
      flag_placeholder = COALESCE(p_flag_placeholder, flag_placeholder),
      services = COALESCE(p_services, services),
      updated_at = now()
  WHERE id = p_challenge_id;

  IF p_is_dynamic THEN
    SELECT COUNT(*) INTO v_solver_count FROM public.solves WHERE challenge_id = p_challenge_id;
    IF v_solver_count > 0 THEN
      v_solver_count := v_solver_count - 1;
    END IF;
    UPDATE public.challenges
    SET points = GREATEST(
      COALESCE(p_min_points, 0),
      COALESCE(p_max_points, 0) - COALESCE(p_decay_per_solve, 0) * v_solver_count
    )
    WHERE id = p_challenge_id;
  END IF;

  IF p_flag IS NOT NULL THEN
    UPDATE public.challenge_flags
    SET flag = p_flag
    WHERE challenge_id = p_challenge_id;
  END IF;

  SELECT jsonb_build_object(
      'title', c.title,
      'description', c.description,
      'category', c.category,
      'points', c.points,
      'max_points', c.max_points,
      'difficulty', c.difficulty,
      'is_active', c.is_active,
      'is_maintenance', c.is_maintenance,
      'is_dynamic', c.is_dynamic,
      'min_points', c.min_points,
      'decay_per_solve', c.decay_per_solve,
      'event_id', c.event_id,
      'flag_placeholder', c.flag_placeholder,
      'services_count', COALESCE(array_length(c.services, 1), 0)
    )
  INTO v_after
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  PERFORM public.write_admin_audit_log(
    'UPDATE',
    'challenge',
    p_challenge_id,
    v_before,
    v_after,
    jsonb_build_object('flag_changed', p_flag IS NOT NULL)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION update_challenge(
  uuid, text, text, text, integer, text, jsonb, jsonb, boolean, boolean, text, boolean, integer, integer, integer, uuid, boolean, text[]
) TO authenticated;

CREATE OR REPLACE FUNCTION set_challenge_active(
  p_challenge_id UUID,
  p_active BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_before JSONB;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Only admin can change challenge status');
  END IF;

  SELECT jsonb_build_object('is_active', c.is_active, 'title', c.title, 'event_id', c.event_id)
  INTO v_before
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  UPDATE public.challenges
  SET is_active = p_active,
      updated_at = now()
  WHERE id = p_challenge_id;

  PERFORM public.write_admin_audit_log(
    CASE WHEN p_active THEN 'PUBLISH' ELSE 'UNPUBLISH' END,
    'challenge',
    p_challenge_id,
    v_before,
    jsonb_build_object('is_active', p_active, 'title', v_before->>'title', 'event_id', v_before->'event_id'),
    '{}'::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'is_active', p_active
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION set_challenge_active(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION set_challenge_maintenance(
  p_challenge_id UUID,
  p_maintenance BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_before JSONB;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Only admin can change maintenance status');
  END IF;

  SELECT jsonb_build_object('is_maintenance', c.is_maintenance, 'title', c.title, 'event_id', c.event_id)
  INTO v_before
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  UPDATE public.challenges
  SET is_maintenance = p_maintenance,
      updated_at = now()
  WHERE id = p_challenge_id;

  PERFORM public.write_admin_audit_log(
    'UPDATE',
    'challenge',
    p_challenge_id,
    v_before,
    jsonb_build_object('is_maintenance', p_maintenance, 'title', v_before->>'title', 'event_id', v_before->'event_id'),
    jsonb_build_object('administrative_action', 'maintenance')
  );

  RETURN json_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'is_maintenance', p_maintenance
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION set_challenge_maintenance(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION update_challenge_solve_count()
RETURNS TRIGGER AS $$
DECLARE
  v_challenge_id UUID;
  v_solve_count INT;
  v_is_dynamic BOOLEAN;
  v_max_points INTEGER;
  v_min_points INTEGER;
  v_decay_per_solve INTEGER;
  v_adjusted_count INT;
BEGIN
  v_challenge_id := COALESCE(NEW.challenge_id, OLD.challenge_id);

  SELECT COUNT(*) INTO v_solve_count
  FROM public.solves s WHERE s.challenge_id = v_challenge_id;

  UPDATE public.challenges c
  SET total_solves = v_solve_count
  WHERE c.id = v_challenge_id;

  SELECT c.is_dynamic, c.max_points, c.min_points, c.decay_per_solve
  INTO v_is_dynamic, v_max_points, v_min_points, v_decay_per_solve
  FROM public.challenges c
  WHERE c.id = v_challenge_id;

  IF COALESCE(v_is_dynamic, false) THEN
    v_adjusted_count := v_solve_count;
    IF v_adjusted_count > 0 THEN
      v_adjusted_count := v_adjusted_count - 1;
    END IF;

    UPDATE public.challenges c
    SET points = GREATEST(
      COALESCE(v_min_points, 0),
      COALESCE(v_max_points, 0) - COALESCE(v_decay_per_solve, 0) * v_adjusted_count
    )
    WHERE c.id = v_challenge_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_solve_update_count ON public.solves;
CREATE TRIGGER trg_solve_update_count
AFTER INSERT OR DELETE ON public.solves
FOR EACH ROW
EXECUTE FUNCTION update_challenge_solve_count();

CREATE OR REPLACE FUNCTION handle_challenge_activation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.solves_nonactive (user_id, challenge_id, created_at)
    SELECT user_id, challenge_id, created_at
    FROM public.solves
    WHERE challenge_id = OLD.id;

    DELETE FROM public.solves
    WHERE challenge_id = OLD.id;
  END IF;

  IF OLD.is_active = false AND NEW.is_active = true THEN
    INSERT INTO public.solves (user_id, challenge_id, created_at)
    SELECT user_id, challenge_id, created_at
    FROM public.solves_nonactive
    WHERE challenge_id = OLD.id
    ON CONFLICT (user_id, challenge_id) DO NOTHING;

    DELETE FROM public.solves_nonactive
    WHERE challenge_id = OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_challenge_activation ON public.challenges;
CREATE TRIGGER trigger_handle_challenge_activation
AFTER UPDATE OF is_active ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION handle_challenge_activation();



-- DELETE
CREATE OR REPLACE FUNCTION delete_challenge(
  p_challenge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_before JSONB;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RAISE EXCEPTION 'Only admin can delete challenge';
  END IF;

  SELECT jsonb_build_object(
      'title', c.title,
      'category', c.category,
      'points', c.points,
      'difficulty', c.difficulty,
      'event_id', c.event_id,
      'is_active', c.is_active,
      'services_count', COALESCE(array_length(c.services, 1), 0)
    )
  INTO v_before
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  DELETE FROM public.challenges WHERE id = p_challenge_id;

  PERFORM public.write_admin_audit_log(
    'DELETE',
    'challenge',
    p_challenge_id,
    v_before,
    NULL,
    '{}'::jsonb
  );
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION delete_challenge(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solves_nonactive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solves nonactive admin all" ON public.solves_nonactive;
CREATE POLICY "Solves nonactive admin all"
  ON public.solves_nonactive
  FOR ALL
  USING (is_admin() OR can_manage_challenge(challenge_id))
  WITH CHECK (is_admin() OR can_manage_challenge(challenge_id));

DROP POLICY IF EXISTS "Challenges can select all" ON public.challenges;
DROP POLICY IF EXISTS "Challenges admin select all" ON public.challenges;
DROP POLICY IF EXISTS "Challenges event admin select scoped" ON public.challenges;
DROP POLICY IF EXISTS "Challenges user select visible" ON public.challenges;

CREATE POLICY "Challenges admin select all"
  ON public.challenges
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Challenges event admin select scoped"
  ON public.challenges
  FOR SELECT
  USING (
    challenges.event_id IS NOT NULL
    AND can_manage_event(challenges.event_id)
  );

CREATE POLICY "Challenges user select visible"
ON public.challenges
FOR SELECT
USING (
  NOT public.is_current_user_banned()
  AND is_active = true
  AND (
    (event_id IS NULL AND COALESCE((SELECT value FROM public.system_settings WHERE key = 'disable_default_challenges'), 'false') <> 'true')
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = challenges.event_id
        AND (
          COALESCE(e.join_mode, 'open') = 'open'
          OR EXISTS (
            SELECT 1
            FROM public.event_participants ep
            WHERE ep.event_id = e.id
              AND ep.user_id = auth.uid()::uuid
          )
        )
        AND (
          (
            (e.start_time IS NULL OR now() >= e.start_time)
            AND (e.end_time IS NULL OR now() <= e.end_time)
          )
          OR (
            e.always_show_challenges = true
            AND e.end_time IS NOT NULL
            AND now() > e.end_time
          )
        )
    )
  )
);
