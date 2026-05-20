-- ==============================================
-- Queries: team_members
-- Source: sql/teams.sql
-- ==============================================

-- SELECT
DROP FUNCTION IF EXISTS get_my_team();
CREATE OR REPLACE FUNCTION get_my_team(
  p_event_id uuid DEFAULT NULL,
  p_event_mode text DEFAULT 'any'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_team_id UUID;
  v_team JSON;
  v_members JSON;
  v_solved_event_ids UUID[];
  v_has_main_solved BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.team_members
  WHERE user_id = v_user_id;

  IF v_team_id IS NULL THEN
    RETURN json_build_object('success', true, 'team', NULL, 'members', '[]'::json);
  END IF;

  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'invite_code', t.invite_code,
    'created_at', t.created_at
  )
  INTO v_team
  FROM public.teams t
  WHERE t.id = v_team_id;

  WITH team_users AS (
    SELECT tm.user_id, tm.joined_at
    FROM public.team_members tm
    WHERE tm.team_id = v_team_id
  ), team_first AS (
    SELECT DISTINCT ON (s.challenge_id)
      s.challenge_id,
      s.user_id,
      s.created_at
    FROM public.solves s
    JOIN team_users tu ON tu.user_id = s.user_id
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE (
      p_event_mode = 'any'
      OR (p_event_mode = 'main' AND c.event_id IS NULL)
      OR (p_event_id IS NOT NULL AND c.event_id = p_event_id)
    )
    ORDER BY s.challenge_id, s.created_at ASC, s.id ASC
  ), user_stats AS (
    SELECT
      tu.user_id,
      COALESCE(SUM(c.points), 0) AS solo_score
    FROM team_users tu
    LEFT JOIN public.solves s ON s.user_id = tu.user_id
    LEFT JOIN public.challenges c ON c.id = s.challenge_id
      AND (
        p_event_mode = 'any'
        OR (p_event_mode = 'main' AND c.event_id IS NULL)
        OR (p_event_id IS NOT NULL AND c.event_id = p_event_id)
      )
    GROUP BY tu.user_id
  ), first_stats AS (
    SELECT
      tf.user_id,
      COALESCE(COUNT(*), 0) AS first_solves,
      COALESCE(SUM(c.points), 0) AS first_solve_score
    FROM team_first tf
    JOIN public.challenges c ON c.id = tf.challenge_id
    GROUP BY tf.user_id
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'user_id', u.id,
        'username', u.username,
        'role', CASE WHEN u.id = t.captain_user_id THEN 'captain' ELSE 'member' END,
        'joined_at', tm.joined_at,
        'solo_score', COALESCE(us.solo_score, 0),
        'first_solve_count', COALESCE(fs.first_solves, 0),
        'first_solve_score', COALESCE(fs.first_solve_score, 0)
      )
      ORDER BY (u.id = t.captain_user_id) DESC, tm.joined_at ASC
    ),
    '[]'::json
  )
  INTO v_members
  FROM public.team_members tm
  JOIN public.users u ON u.id = tm.user_id
  JOIN public.teams t ON t.id = tm.team_id
  LEFT JOIN user_stats us ON us.user_id = tm.user_id
  LEFT JOIN first_stats fs ON fs.user_id = tm.user_id
  WHERE tm.team_id = v_team_id;

  SELECT COALESCE(
    array_agg(DISTINCT c.event_id) FILTER (WHERE c.event_id IS NOT NULL),
    '{}'::uuid[]
  ),
  COALESCE(bool_or(c.event_id IS NULL), FALSE)
  INTO v_solved_event_ids, v_has_main_solved
  FROM public.solves s
  JOIN public.challenges c ON c.id = s.challenge_id
  JOIN public.team_members tm ON tm.user_id = s.user_id
  WHERE tm.team_id = v_team_id;

  RETURN json_build_object(
    'success', true,
    'team', v_team,
    'members', v_members,
    'solved_event_ids', v_solved_event_ids,
    'has_main_solved', v_has_main_solved
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_my_team(uuid, text) TO authenticated;

DROP FUNCTION IF EXISTS get_my_team_summary();
CREATE OR REPLACE FUNCTION get_my_team_summary(
  p_event_id uuid DEFAULT NULL,
  p_event_mode text DEFAULT 'any'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_team_id UUID;
  v_team JSON;
  v_unique_score BIGINT := 0;
  v_total_score BIGINT := 0;
  v_unique_challenges INT := 0;
  v_total_solves BIGINT := 0;
  v_rank BIGINT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.team_members
  WHERE user_id = v_user_id;

  IF v_team_id IS NULL THEN
    RETURN json_build_object('success', true, 'team', NULL, 'stats', json_build_object(
      'unique_score', 0,
      'total_score', 0,
      'unique_challenges', 0,
      'total_solves', 0
    ));
  END IF;

  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'invite_code', t.invite_code,
    'created_at', t.created_at
  )
  INTO v_team
  FROM public.teams t
  WHERE t.id = v_team_id;

  WITH team_users AS (
    SELECT user_id FROM public.team_members WHERE team_id = v_team_id
  ), solves_filtered AS (
    SELECT s.challenge_id, c.points
    FROM public.solves s
    JOIN team_users tu ON tu.user_id = s.user_id
    JOIN public.challenges c ON c.id = s.challenge_id
    WHERE (
      p_event_mode = 'any'
      OR (p_event_mode = 'main' AND c.event_id IS NULL)
      OR (p_event_id IS NOT NULL AND c.event_id = p_event_id)
    )
  ), unique_calc AS (
    SELECT
      COALESCE(SUM(t.points), 0)::BIGINT AS unique_score,
      COALESCE(COUNT(*), 0)::INT AS unique_challenges
    FROM (
      SELECT sf.challenge_id, MAX(sf.points) AS points
      FROM solves_filtered sf
      GROUP BY sf.challenge_id
    ) t
  ), totals AS (
    SELECT
      COALESCE(SUM(sf.points), 0)::BIGINT AS total_score,
      COALESCE(COUNT(*), 0)::BIGINT AS total_solves
    FROM solves_filtered sf
  )
  SELECT
    uc.unique_score,
    t.total_score,
    uc.unique_challenges,
    t.total_solves
  INTO v_unique_score, v_total_score, v_unique_challenges, v_total_solves
  FROM unique_calc uc
  CROSS JOIN totals t;

  -- rank team
  SELECT COUNT(*) + 1 INTO v_rank
  FROM (
    SELECT
      t_inner.team_id,
      SUM(t_inner.points)::BIGINT AS unique_score
    FROM (
      SELECT tm_inner.team_id, s_inner.challenge_id, MAX(c_inner.points) AS points
      FROM public.team_members tm_inner
      JOIN public.solves s_inner ON s_inner.user_id = tm_inner.user_id
      JOIN public.challenges c_inner ON c_inner.id = s_inner.challenge_id
      WHERE (
        p_event_mode = 'any'
        OR (p_event_mode = 'main' AND c_inner.event_id IS NULL)
        OR (p_event_id IS NOT NULL AND c_inner.event_id = p_event_id)
      )
      GROUP BY tm_inner.team_id, s_inner.challenge_id
    ) t_inner
    GROUP BY t_inner.team_id
  ) scores
  WHERE scores.unique_score > v_unique_score;

  RETURN json_build_object('success', true, 'team', v_team, 'stats', json_build_object(
    'unique_score', v_unique_score,
    'total_score', v_total_score,
    'unique_challenges', v_unique_challenges,
    'total_solves', v_total_solves,
    'rank', v_rank
  ));
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_my_team_summary(uuid, text) TO authenticated;

DROP FUNCTION IF EXISTS get_my_team_challenges();
CREATE OR REPLACE FUNCTION get_my_team_challenges(
  p_event_id uuid DEFAULT NULL,
  p_event_mode text DEFAULT 'any'
)
RETURNS TABLE (
  challenge_id UUID,
  title TEXT,
  category TEXT,
  points INTEGER,
  first_solved_at TIMESTAMPTZ,
  first_solver_username TEXT
) AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_team_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.team_members
  WHERE user_id = v_user_id;

  IF v_team_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id AS challenge_id,
    c.title::TEXT,
    c.category::TEXT,
    c.points,
    MIN(s.created_at) AS first_solved_at,
    (
      SELECT u.username::TEXT
      FROM public.solves s2
      JOIN public.team_members tm2 ON tm2.user_id = s2.user_id
      JOIN public.users u ON u.id = s2.user_id
      JOIN public.challenges c2 ON c2.id = s2.challenge_id
      WHERE tm2.team_id = v_team_id AND s2.challenge_id = c.id
      AND (
        p_event_mode = 'any'
        OR (p_event_mode = 'main' AND c2.event_id IS NULL)
        OR (p_event_id IS NOT NULL AND c2.event_id = p_event_id)
      )
      ORDER BY s2.created_at ASC, s2.id ASC
      LIMIT 1
    ) AS first_solver_username
  FROM public.solves s
  JOIN public.team_members tm ON tm.user_id = s.user_id
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE tm.team_id = v_team_id
  AND (
    p_event_mode = 'any'
    OR (p_event_mode = 'main' AND c.event_id IS NULL)
    OR (p_event_id IS NOT NULL AND c.event_id = p_event_id)
  )
  GROUP BY c.id, c.title, c.category, c.points
  ORDER BY first_solved_at DESC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_my_team_challenges(uuid, text) TO authenticated;

DROP FUNCTION IF EXISTS get_team_challenges_by_name(TEXT);
CREATE OR REPLACE FUNCTION get_team_challenges_by_name(
  p_name TEXT,
  p_event_id uuid DEFAULT NULL,
  p_event_mode text DEFAULT 'any'
)
RETURNS TABLE (
  challenge_id UUID,
  title TEXT,
  category TEXT,
  points INTEGER,
  first_solved_at TIMESTAMPTZ,
  first_solver_username TEXT
) AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id
  FROM public.teams
  WHERE lower(name) = lower(p_name)
  LIMIT 1;

  IF v_team_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id AS challenge_id,
    c.title::TEXT,
    c.category::TEXT,
    c.points,
    MIN(s.created_at) AS first_solved_at,
    (
      SELECT u.username::TEXT
      FROM public.solves s2
      JOIN public.team_members tm2 ON tm2.user_id = s2.user_id
      JOIN public.users u ON u.id = s2.user_id
      JOIN public.challenges c2 ON c2.id = s2.challenge_id
      WHERE tm2.team_id = v_team_id AND s2.challenge_id = c.id
      AND (
        p_event_mode = 'any'
        OR (p_event_mode = 'main' AND c2.event_id IS NULL)
        OR (p_event_id IS NOT NULL AND c2.event_id = p_event_id)
      )
      ORDER BY s2.created_at ASC, s2.id ASC
      LIMIT 1
    ) AS first_solver_username
  FROM public.solves s
  JOIN public.team_members tm ON tm.user_id = s.user_id
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE tm.team_id = v_team_id
  AND (
    p_event_mode = 'any'
    OR (p_event_mode = 'main' AND c.event_id IS NULL)
    OR (p_event_id IS NOT NULL AND c.event_id = p_event_id)
  )
  GROUP BY c.id, c.title, c.category, c.points
  ORDER BY first_solved_at DESC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_team_challenges_by_name(TEXT, uuid, text) TO authenticated;

-- INSERT
CREATE OR REPLACE FUNCTION join_team(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_team_id UUID;
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'User already in a team';
  END IF;

  SELECT t.id INTO v_team_id
  FROM public.teams t
  WHERE t.invite_code = p_invite_code;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.team_members tm
  WHERE tm.team_id = v_team_id;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Team is full';
  END IF;

  INSERT INTO public.team_members(team_id, user_id)
  VALUES (v_team_id, v_user_id);

  RETURN v_team_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION join_team(TEXT) TO authenticated;

-- UPDATE
CREATE OR REPLACE FUNCTION transfer_team_captain(p_team_id UUID, p_new_captain_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_requester UUID := auth.uid()::uuid;
  v_is_member BOOLEAN;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT is_admin() AND NOT is_team_captain(p_team_id) THEN
    RAISE EXCEPTION 'Only captain or admin can transfer captain';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_new_captain_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'New captain must be a team member';
  END IF;

  UPDATE public.teams
  SET captain_user_id = p_new_captain_user_id,
      updated_at = now()
  WHERE id = p_team_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION transfer_team_captain(UUID, UUID) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION leave_team()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_team_id UUID;
  v_captain_id UUID;
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.team_members
  WHERE user_id = v_user_id;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'User is not in a team';
  END IF;

  SELECT captain_user_id INTO v_captain_id
  FROM public.teams
  WHERE id = v_team_id;

  SELECT COUNT(*) INTO v_count
  FROM public.team_members
  WHERE team_id = v_team_id;

  IF v_captain_id = v_user_id AND v_count > 1 THEN
    RAISE EXCEPTION 'Captain must transfer captaincy or delete team first';
  END IF;

  IF v_captain_id = v_user_id AND v_count = 1 THEN
    DELETE FROM public.teams WHERE id = v_team_id;
    RETURN TRUE;
  END IF;

  DELETE FROM public.team_members
  WHERE team_id = v_team_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION leave_team() TO authenticated;

CREATE OR REPLACE FUNCTION kick_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_requester UUID := auth.uid()::uuid;
  v_is_member BOOLEAN;
  v_is_captain BOOLEAN;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_requester = p_user_id THEN
    RAISE EXCEPTION 'Cannot kick yourself';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'User not in team';
  END IF;

  v_is_captain := is_team_captain(p_team_id);

  IF NOT is_admin() AND NOT v_is_captain THEN
    RAISE EXCEPTION 'Only captain or admin can kick members';
  END IF;

  DELETE FROM public.team_members
  WHERE team_id = p_team_id AND user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION kick_team_member(UUID, UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members admin only" ON public.team_members;
CREATE POLICY "Team members admin only"
  ON public.team_members
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
