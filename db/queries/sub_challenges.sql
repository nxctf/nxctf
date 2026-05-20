-- ==============================================
-- Queries: sub_challenges
-- Optional multi-question challenge validation
-- ==============================================

CREATE OR REPLACE FUNCTION normalize_sub_answer(p_answer TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(COALESCE(p_answer, '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION normalize_sub_answer(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION is_sub_answer_correct(
  p_submitted TEXT,
  p_expected TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF normalize_sub_answer(p_submitted) = '' THEN
    RETURN FALSE;
  END IF;

  IF normalize_sub_answer(p_expected) = '' THEN
    RETURN FALSE;
  END IF;

  RETURN normalize_sub_answer(p_submitted) = normalize_sub_answer(p_expected);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION is_sub_answer_correct(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_challenges_with_sub_challenges(
  p_challenge_ids UUID[]
)
RETURNS TABLE (
  challenge_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT sc.challenge_id
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = ANY(p_challenge_ids);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_challenges_with_sub_challenges(UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION get_sub_challenges(
  p_challenge_id UUID,
  p_answers JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_is_admin_override BOOLEAN := FALSE;
  v_is_maintenance BOOLEAN;
  v_is_active BOOLEAN;
  v_event_id UUID;
  v_event_start TIMESTAMPTZ;
  v_event_end TIMESTAMPTZ;
  v_event_exists BOOLEAN;
  v_event_join_mode TEXT;
  v_is_event_member BOOLEAN := FALSE;
  v_sub_count INT := 0;
  v_is_sequential BOOLEAN := FALSE;
  v_questions JSONB := '[]'::jsonb;
  v_next_order INTEGER := NULL;
  v_next_question TEXT := NULL;
  v_submitted TEXT;
  v_results JSONB := '{}'::jsonb;
  v_completed BOOLEAN := FALSE;
  v_flag TEXT := NULL;
  r_sc RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Not authenticated');
  END IF;

  IF p_answers IS NULL THEN
    p_answers := '{}'::jsonb;
  END IF;

  IF jsonb_typeof(p_answers) <> 'object' THEN
    RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'answers must be a JSON object');
  END IF;

  SELECT c.is_active,
         c.is_maintenance,
         c.event_id,
         e.start_time,
         e.end_time,
         (e.id IS NOT NULL),
         e.join_mode
  INTO v_is_active,
       v_is_maintenance,
       v_event_id,
       v_event_start,
       v_event_end,
       v_event_exists,
       v_event_join_mode
  FROM public.challenges c
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE c.id = p_challenge_id;

  IF v_is_active IS NULL THEN
    RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Challenge not found');
  END IF;

  v_is_admin_override := is_admin() OR can_manage_challenge(p_challenge_id);

  IF NOT v_is_admin_override THEN
    IF COALESCE(v_is_maintenance, false) THEN
      RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Challenge is under maintenance');
    END IF;

    IF NOT COALESCE(v_is_active, true) THEN
      RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Challenge is not active');
    END IF;
  END IF;

  IF v_event_id IS NOT NULL AND NOT COALESCE(v_event_exists, false) THEN
    RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Event not found');
  END IF;

  IF NOT v_is_admin_override AND v_event_id IS NOT NULL THEN
    IF COALESCE(v_event_join_mode, 'open') <> 'open' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.event_participants ep
        WHERE ep.event_id = v_event_id
          AND ep.user_id = v_user_id
      ) INTO v_is_event_member;

      IF NOT v_is_event_member THEN
        RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Join this event first before opening sub-challenges');
      END IF;
    END IF;

    IF v_event_start IS NOT NULL AND now() < v_event_start THEN
      RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Event has not started yet');
    END IF;

    IF v_event_end IS NOT NULL AND now() > v_event_end THEN
      RETURN json_build_object('mode', 'none', 'questions', '[]'::jsonb, 'message', 'Event has ended');
    END IF;
  END IF;

  SELECT COUNT(*), COALESCE(bool_or(sc.is_sequential), false)
  INTO v_sub_count, v_is_sequential
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = p_challenge_id;

  IF v_sub_count = 0 THEN
    RETURN json_build_object('mode', 'non_sequential', 'questions', '[]'::jsonb, 'completed', false);
  END IF;

  -- Calculate results and completion
  SELECT
    jsonb_object_agg(sc.order_number, is_sub_answer_correct(p_answers ->> sc.order_number::text, sc.answer)),
    NOT EXISTS (
      SELECT 1 FROM public.sub_challenges sc2
      WHERE sc2.challenge_id = p_challenge_id
        AND NOT is_sub_answer_correct(p_answers ->> sc2.order_number::text, sc2.answer)
    )
  INTO v_results, v_completed
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = p_challenge_id;

  IF v_completed THEN
    SELECT flag INTO v_flag FROM public.challenge_flags WHERE challenge_id = p_challenge_id;
  END IF;

  IF NOT v_is_sequential THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'order_number', sc.order_number,
          'question', sc.question
        )
        ORDER BY sc.order_number
      ),
      '[]'::jsonb
    )
    INTO v_questions
    FROM public.sub_challenges sc
    WHERE sc.challenge_id = p_challenge_id;

    RETURN json_build_object(
      'mode', 'non_sequential',
      'questions', v_questions,
      'completed', v_completed,
      'results', v_results,
      'flag', v_flag
    );
  END IF;

  -- Sequential mode logic
  FOR r_sc IN
    SELECT order_number, question, answer
    FROM public.sub_challenges
    WHERE challenge_id = p_challenge_id
    ORDER BY order_number
  LOOP
    v_submitted := p_answers ->> r_sc.order_number::text;

    IF v_submitted IS NULL OR NOT is_sub_answer_correct(v_submitted, r_sc.answer) THEN
      v_next_order := r_sc.order_number;
      v_next_question := r_sc.question;
      EXIT;
    END IF;

    -- In sequential mode, 'questions' returns the list of completed ones
    v_questions := v_questions || jsonb_build_object('order_number', r_sc.order_number, 'question', r_sc.question);
  END LOOP;

  RETURN json_build_object(
    'mode', 'sequential',
    'completed', v_completed,
    'questions', v_questions,
    'results', v_results,
    'flag', v_flag,
    'question', CASE
      WHEN v_next_order IS NOT NULL THEN json_build_object('order_number', v_next_order, 'question', v_next_question)
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_sub_challenges(UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION submit_sub_challenges(
  p_challenge_id UUID,
  p_answers JSONB
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_results JSONB := '{}'::jsonb;
  v_completed BOOLEAN := FALSE;
  v_flag TEXT := NULL;
  v_sub_count INT := 0;
  v_is_admin_override BOOLEAN := FALSE;
  v_is_maintenance BOOLEAN;
  v_is_active BOOLEAN;
  v_event_id UUID;
  v_event_start TIMESTAMPTZ;
  v_event_end TIMESTAMPTZ;
  v_event_exists BOOLEAN;
  v_event_join_mode TEXT;
  v_is_event_member BOOLEAN := FALSE;
  v_key TEXT;
  v_val TEXT;
  v_order INT;
  v_expected TEXT;
  v_ok BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Not authenticated');
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'answers must be a JSON object');
  END IF;

  SELECT c.is_active,
         c.is_maintenance,
         c.event_id,
         e.start_time,
         e.end_time,
         (e.id IS NOT NULL),
         e.join_mode
  INTO v_is_active,
       v_is_maintenance,
       v_event_id,
       v_event_start,
       v_event_end,
       v_event_exists,
       v_event_join_mode
  FROM public.challenges c
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE c.id = p_challenge_id;

  IF v_is_active IS NULL THEN
    RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Challenge not found');
  END IF;

  v_is_admin_override := is_admin() OR can_manage_challenge(p_challenge_id);

  IF NOT v_is_admin_override THEN
    IF COALESCE(v_is_maintenance, false) THEN
      RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Challenge is under maintenance');
    END IF;

    IF NOT COALESCE(v_is_active, true) THEN
      RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Challenge is not active');
    END IF;
  END IF;

  IF v_event_id IS NOT NULL AND NOT COALESCE(v_event_exists, false) THEN
    RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Event not found');
  END IF;

  IF NOT v_is_admin_override AND v_event_id IS NOT NULL THEN
    IF COALESCE(v_event_join_mode, 'open') <> 'open' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.event_participants ep
        WHERE ep.event_id = v_event_id
          AND ep.user_id = v_user_id
      ) INTO v_is_event_member;

      IF NOT v_is_event_member THEN
        RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Join this event first before submitting answers');
      END IF;
    END IF;

    IF v_event_start IS NOT NULL AND now() < v_event_start THEN
      RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Event has not started yet');
    END IF;

    IF v_event_end IS NOT NULL AND now() > v_event_end THEN
      RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Event has ended');
    END IF;
  END IF;

  SELECT COUNT(*)
  INTO v_sub_count
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = p_challenge_id;

  IF v_sub_count = 0 THEN
    RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'No sub-challenges configured');
  END IF;

  IF (SELECT count(*) FROM jsonb_object_keys(p_answers)) > v_sub_count THEN
    RETURN json_build_object('results', '{}'::jsonb, 'completed', false, 'message', 'Too many submitted answers');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || p_challenge_id::text));

  FOR v_key, v_val IN SELECT key, value FROM jsonb_each_text(p_answers)
  LOOP
    IF v_key !~ '^[0-9]+$' THEN
      v_results := v_results || jsonb_build_object(v_key, false);
      CONTINUE;
    END IF;

    v_order := v_key::INT;

    SELECT sc.answer
    INTO v_expected
    FROM public.sub_challenges sc
    WHERE sc.challenge_id = p_challenge_id
      AND sc.order_number = v_order;

    IF v_expected IS NULL THEN
      v_results := v_results || jsonb_build_object(v_key, false);
      CONTINUE;
    END IF;

    v_ok := is_sub_answer_correct(v_val, v_expected);
    v_results := v_results || jsonb_build_object(v_key, v_ok);
  END LOOP;

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.sub_challenges sc
    LEFT JOIN LATERAL (
      SELECT kv.value AS submitted_answer
      FROM jsonb_each_text(p_answers) kv
      WHERE kv.key = sc.order_number::text
      LIMIT 1
    ) ans ON true
    WHERE sc.challenge_id = p_challenge_id
      AND (
        ans.submitted_answer IS NULL
        OR NOT is_sub_answer_correct(ans.submitted_answer, sc.answer)
      )
  )
  INTO v_completed;

  IF NOT v_completed THEN
    PERFORM pg_sleep(0.35);
    RETURN json_build_object('results', v_results, 'completed', false);
  END IF;

  SELECT flag
  INTO v_flag
  FROM public.challenge_flags
  WHERE challenge_id = p_challenge_id;

  IF v_flag IS NULL THEN
    RETURN json_build_object('results', v_results, 'completed', false, 'message', 'Flag not configured');
  END IF;

  RETURN json_build_object('results', v_results, 'completed', true, 'flag', v_flag);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION submit_sub_challenges(UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION normalize_sub_challenge_order(
  p_challenge_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_offset INTEGER;
BEGIN
  IF p_challenge_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(sc.order_number), 0) + COUNT(*)::INTEGER + 1
  INTO v_offset
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = p_challenge_id;

  IF COALESCE(v_offset, 0) <= 1 THEN
    RETURN;
  END IF;

  UPDATE public.sub_challenges sc
  SET order_number = sc.order_number + v_offset
  WHERE sc.challenge_id = p_challenge_id;

  WITH ordered AS (
    SELECT
      sc.id,
      ROW_NUMBER() OVER (ORDER BY sc.order_number, sc.id)::INTEGER AS next_order
    FROM public.sub_challenges sc
    WHERE sc.challenge_id = p_challenge_id
  )
  UPDATE public.sub_challenges sc
  SET order_number = ordered.next_order
  FROM ordered
  WHERE sc.id = ordered.id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION normalize_sub_challenge_order(UUID) TO authenticated;

DO $$
DECLARE
  v_challenge_id UUID;
BEGIN
  FOR v_challenge_id IN
    SELECT DISTINCT sc.challenge_id
    FROM public.sub_challenges sc
  LOOP
    PERFORM normalize_sub_challenge_order(v_challenge_id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION get_admin_sub_challenges(
  p_challenge_id UUID
)
RETURNS TABLE (
  id UUID,
  challenge_id UUID,
  question TEXT,
  answer TEXT,
  order_number INTEGER,
  is_sequential BOOLEAN
) AS $$
BEGIN
  IF NOT (is_admin() OR can_manage_challenge(p_challenge_id)) THEN
    RAISE EXCEPTION 'Only admin can view sub-challenges';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sub_challenges:' || p_challenge_id::text));
  PERFORM normalize_sub_challenge_order(p_challenge_id);

  RETURN QUERY
  SELECT sc.id, sc.challenge_id, sc.question, sc.answer::TEXT, sc.order_number, sc.is_sequential
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = p_challenge_id
  ORDER BY sc.order_number;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_admin_sub_challenges(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION add_sub_challenge(
  p_challenge_id UUID,
  p_question TEXT,
  p_answer TEXT,
  p_order_number INTEGER,
  p_is_sequential BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_count INTEGER;
  v_target_order INTEGER;
  v_offset INTEGER;
BEGIN
  IF NOT (is_admin() OR can_manage_challenge(p_challenge_id)) THEN
    RAISE EXCEPTION 'Only admin can add sub-challenges';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sub_challenges:' || p_challenge_id::text));
  PERFORM normalize_sub_challenge_order(p_challenge_id);

  SELECT COUNT(*)::INTEGER, COALESCE(MAX(sc.order_number), 0) + COUNT(*)::INTEGER + 1
  INTO v_count, v_offset
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = p_challenge_id;

  v_target_order := LEAST(GREATEST(COALESCE(p_order_number, v_count + 1), 1), v_count + 1);

  IF v_target_order <= v_count THEN
    UPDATE public.sub_challenges sc
    SET order_number = sc.order_number + v_offset
    WHERE sc.challenge_id = p_challenge_id
      AND sc.order_number >= v_target_order;
  END IF;

  INSERT INTO public.sub_challenges(
    challenge_id,
    question,
    answer,
    order_number,
    is_sequential
  )
  VALUES (
    p_challenge_id,
    p_question,
    p_answer,
    v_target_order,
    p_is_sequential
  )
  RETURNING id INTO v_id;

  PERFORM normalize_sub_challenge_order(p_challenge_id);

  RETURN v_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION add_sub_challenge(UUID, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION update_sub_challenge(
  p_id UUID,
  p_question TEXT,
  p_answer TEXT,
  p_order_number INTEGER,
  p_is_sequential BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
  v_challenge_id UUID;
  v_count INTEGER;
  v_target_order INTEGER;
  v_temp_order INTEGER;
  v_offset INTEGER;
BEGIN
  SELECT sc.challenge_id INTO v_challenge_id
  FROM public.sub_challenges sc
  WHERE sc.id = p_id;

  IF v_challenge_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (is_admin() OR can_manage_challenge(v_challenge_id)) THEN
    RAISE EXCEPTION 'Only admin can update sub-challenges';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sub_challenges:' || v_challenge_id::text));
  PERFORM normalize_sub_challenge_order(v_challenge_id);

  SELECT COUNT(*)::INTEGER, COALESCE(MAX(sc.order_number), 0) + 1, COALESCE(MAX(sc.order_number), 0) + COUNT(*)::INTEGER + 1
  INTO v_count, v_temp_order, v_offset
  FROM public.sub_challenges sc
  WHERE sc.challenge_id = v_challenge_id;

  v_target_order := LEAST(GREATEST(COALESCE(p_order_number, v_count), 1), v_count);

  UPDATE public.sub_challenges
  SET order_number = v_temp_order,
      question = p_question,
      answer = p_answer,
      is_sequential = p_is_sequential
  WHERE id = p_id;

  PERFORM normalize_sub_challenge_order(v_challenge_id);

  IF v_target_order < v_count THEN
    UPDATE public.sub_challenges sc
    SET order_number = sc.order_number + v_offset
    WHERE sc.challenge_id = v_challenge_id
      AND sc.id <> p_id
      AND sc.order_number >= v_target_order;
  END IF;

  UPDATE public.sub_challenges
  SET order_number = v_target_order
  WHERE id = p_id;

  PERFORM normalize_sub_challenge_order(v_challenge_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION update_sub_challenge(UUID, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION delete_sub_challenge(
  p_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_challenge_id UUID;
BEGIN
  SELECT sc.challenge_id INTO v_challenge_id
  FROM public.sub_challenges sc
  WHERE sc.id = p_id;

  IF v_challenge_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (is_admin() OR can_manage_challenge(v_challenge_id)) THEN
    RAISE EXCEPTION 'Only admin can delete sub-challenges';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sub_challenges:' || v_challenge_id::text));

  DELETE FROM public.sub_challenges
  WHERE id = p_id;

  PERFORM normalize_sub_challenge_order(v_challenge_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION delete_sub_challenge(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.sub_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sub_challenges FROM anon, authenticated;

DROP POLICY IF EXISTS "Sub challenges admin select" ON public.sub_challenges;
CREATE POLICY "Sub challenges admin select"
  ON public.sub_challenges
  FOR SELECT
  USING (is_admin() OR can_manage_challenge(challenge_id));

DROP POLICY IF EXISTS "Sub challenges admin insert" ON public.sub_challenges;
CREATE POLICY "Sub challenges admin insert"
  ON public.sub_challenges
  FOR INSERT
  WITH CHECK (is_admin() OR can_manage_challenge(challenge_id));

DROP POLICY IF EXISTS "Sub challenges admin update" ON public.sub_challenges;
CREATE POLICY "Sub challenges admin update"
  ON public.sub_challenges
  FOR UPDATE
  USING (is_admin() OR can_manage_challenge(challenge_id))
  WITH CHECK (is_admin() OR can_manage_challenge(challenge_id));

DROP POLICY IF EXISTS "Sub challenges admin delete" ON public.sub_challenges;
CREATE POLICY "Sub challenges admin delete"
  ON public.sub_challenges
  FOR DELETE
  USING (is_admin() OR can_manage_challenge(challenge_id));
