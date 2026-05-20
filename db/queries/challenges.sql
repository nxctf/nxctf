-- ==============================================
-- Queries: challenges
-- Source: sql/chema.sql
-- ==============================================

-- SELECT
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
      c.event_id IS NULL
      OR (
        (e.start_time IS NULL OR now() >= e.start_time)
      )
    )
    AND (
      p_event_mode = 'any'
      OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
      OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
    )
  GROUP BY c.category
  ORDER BY c.category;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

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
      c.event_id IS NULL
      OR (
        (e.start_time IS NULL OR now() >= e.start_time)
      )
    )
    AND (
      p_event_mode = 'any'
      OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
      OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
    )
  GROUP BY c.difficulty
  ORDER BY c.difficulty;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_difficulty_totals(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_user_first_bloods(p_user_id UUID)
RETURNS TABLE(challenge_id UUID)
AS $$
BEGIN
  RETURN QUERY
  SELECT t.challenge_id
  FROM (
    SELECT
      s.challenge_id,
      s.user_id,
      ROW_NUMBER() OVER (PARTITION BY s.challenge_id ORDER BY s.created_at ASC, s.id ASC) AS rn
    FROM public.solves s
  ) AS t
  WHERE t.rn = 1 AND t.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_user_first_bloods(UUID) TO authenticated;

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

  RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_challenge(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB, JSONB, BOOLEAN, BOOLEAN, INTEGER, INTEGER, INTEGER, UUID, BOOLEAN, TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION submit_flag(
  p_challenge_id uuid,
  p_flag text
)
RETURNS json AS $$
DECLARE
  v_user_id uuid := auth.uid()::uuid;
  v_flag_hash TEXT;
  v_points INTEGER;
  v_max_points INTEGER;
  v_is_dynamic BOOLEAN;
  v_is_maintenance BOOLEAN;
  v_is_active BOOLEAN;
  v_min_points INTEGER;
  v_decay_per_solve INTEGER;
  v_event_id UUID;
  v_event_start TIMESTAMPTZ;
  v_event_end TIMESTAMPTZ;
  v_event_exists BOOLEAN;
  v_event_join_mode TEXT;
  v_is_event_member BOOLEAN := FALSE;
  v_solver_count INTEGER;
  v_awarded_points INTEGER;
  v_existing INT;
  v_is_correct BOOLEAN;
  v_is_admin_override BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

    SELECT cf.flag_hash, c.points, c.max_points, c.is_dynamic, c.is_active, c.is_maintenance, c.min_points, c.decay_per_solve,
        c.event_id, e.start_time, e.end_time, (e.id IS NOT NULL), e.join_mode
    INTO v_flag_hash, v_points, v_max_points, v_is_dynamic, v_is_active, v_is_maintenance, v_min_points, v_decay_per_solve,
      v_event_id, v_event_start, v_event_end, v_event_exists, v_event_join_mode
  FROM public.challenge_flags cf
  JOIN public.challenges c ON c.id = cf.challenge_id
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE cf.challenge_id = p_challenge_id;

  IF v_flag_hash IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Challenge not found');
  END IF;

  v_is_admin_override := is_admin() OR can_manage_challenge(p_challenge_id);

  IF NOT v_is_admin_override THEN
    IF COALESCE(v_is_maintenance, false) THEN
      RETURN json_build_object('success', false, 'message', 'Challenge is under maintenance');
    END IF;

    IF NOT COALESCE(v_is_active, TRUE) THEN
      RETURN json_build_object('success', false, 'message', 'Challenge is not active');
    END IF;
  END IF;

  IF v_event_id IS NOT NULL AND NOT COALESCE(v_event_exists, false) THEN
    RETURN json_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF NOT v_is_admin_override THEN
    IF v_event_id IS NOT NULL THEN
      IF COALESCE(v_event_join_mode, 'open') <> 'open' THEN
        SELECT EXISTS (
          SELECT 1
          FROM public.event_participants ep
          WHERE ep.event_id = v_event_id
            AND ep.user_id = v_user_id
        ) INTO v_is_event_member;

        IF NOT v_is_event_member THEN
          RETURN json_build_object('success', false, 'message', 'Join this event first before submitting flags');
        END IF;
      END IF;

      IF v_event_start IS NOT NULL AND now() < v_event_start THEN
        RETURN json_build_object('success', false, 'message', 'Event has not started yet');
      END IF;

      IF v_event_end IS NOT NULL AND now() > v_event_end THEN
        RETURN json_build_object('success', false, 'message', 'Event has ended');
      END IF;
    END IF;
  END IF;

  v_is_correct := encode(digest(p_flag, 'sha256'), 'hex') = v_flag_hash;

  IF NOT v_is_correct THEN
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
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_flag(uuid, text) TO authenticated;

-- UPDATE
UPDATE challenges
SET total_solves = (
  SELECT COUNT(*) FROM solves WHERE challenge_id = challenges.id
);

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
BEGIN
  SELECT c.event_id INTO v_existing_event_id
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

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

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
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Only admin can change challenge status');
  END IF;

  UPDATE public.challenges
  SET is_active = p_active,
      updated_at = now()
  WHERE id = p_challenge_id;

  RETURN json_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'is_active', p_active
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_challenge_active(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION set_challenge_maintenance(
  p_challenge_id UUID,
  p_maintenance BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RETURN json_build_object('success', false, 'message', 'Only admin can change maintenance status');
  END IF;

  UPDATE public.challenges
  SET is_maintenance = p_maintenance,
      updated_at = now()
  WHERE id = p_challenge_id;

  RETURN json_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'is_maintenance', p_maintenance
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION public.get_challenge_placeholder(p_challenge_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_flag TEXT;
    v_show_placeholder BOOLEAN;
BEGIN
    SELECT c.flag_placeholder, cf.flag
    INTO v_show_placeholder, v_flag
    FROM public.challenges c
    JOIN public.challenge_flags cf ON cf.challenge_id = c.id
    WHERE c.id = p_challenge_id;

    IF v_show_placeholder THEN
        RETURN public.get_flag_placeholder(v_flag);
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_placeholder(UUID) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION delete_challenge(
  p_challenge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RAISE EXCEPTION 'Only admin can delete challenge';
  END IF;

  DELETE FROM public.challenges WHERE id = p_challenge_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_challenge(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solves_nonactive ENABLE ROW LEVEL SECURITY;

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
  is_active = true
  AND (
    event_id IS NULL
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
