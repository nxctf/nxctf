-- ==============================================
-- Queries: solves
-- Source: sql/chema.sql
-- ==============================================

-- SELECT
CREATE OR REPLACE FUNCTION get_logs(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_event_id UUID DEFAULT NULL,
  p_event_mode TEXT DEFAULT 'any'
)
RETURNS TABLE (
  log_type TEXT,
  log_challenge_id UUID,
  log_challenge_title TEXT,
  log_category TEXT,
  log_user_id UUID,
  log_username TEXT,
  log_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.type AS log_type,
    t.challenge_id AS log_challenge_id,
    t.challenge_title::TEXT AS log_challenge_title,
    t.category::TEXT AS log_category,
    t.user_id AS log_user_id,
    t.username::TEXT AS log_username,
    t.created_at AS log_created_at
  FROM (
    SELECT
      'new_challenge'::text AS type,
      c.id AS challenge_id,
      c.title AS challenge_title,
      c.category,
      NULL::uuid AS user_id,
      NULL::text AS username,
      c.created_at
    FROM public.challenges c
    LEFT JOIN public.events e ON e.id = c.event_id
    WHERE c.is_active = true
      AND public.match_event_mode(p_event_mode, p_event_id, c.event_id)
      AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
      AND (
        c.event_id IS NULL
        OR (
          (e.start_time IS NULL OR now() >= e.start_time)
        )
      )

    UNION ALL

    SELECT
      'first_blood'::text AS type,
      c.id AS challenge_id,
      c.title AS challenge_title,
      c.category,
      s.user_id,
      u.username,
      s.created_at
    FROM public.challenges c
    LEFT JOIN public.events e ON e.id = c.event_id
    JOIN (
      SELECT challenge_id, MIN(created_at) AS first_solve
      FROM public.solves
      GROUP BY challenge_id
    ) fs ON fs.challenge_id = c.id
    JOIN public.solves s ON s.challenge_id = c.id AND s.created_at = fs.first_solve
    JOIN public.users u ON u.id = s.user_id
    WHERE c.is_active = true
      AND public.match_event_mode(p_event_mode, p_event_id, c.event_id)
      AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
      AND (
        c.event_id IS NULL
        OR (
          (e.start_time IS NULL OR now() >= e.start_time)
        )
      )
  ) t
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_logs(INT, INT, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_recent_solves(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_event_id UUID DEFAULT NULL,
  p_event_mode TEXT DEFAULT 'any'
)
RETURNS TABLE (
  log_type TEXT,
  log_challenge_id UUID,
  log_challenge_title TEXT,
  log_category TEXT,
  log_user_id UUID,
  log_username TEXT,
  log_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'solve'::text AS log_type,
    c.id AS log_challenge_id,
    c.title::TEXT AS log_challenge_title,
    c.category::TEXT AS log_category,
    u.id AS log_user_id,
    u.username::TEXT AS log_username,
    s.created_at AS log_created_at
  FROM public.solves s
  JOIN public.users u ON u.id = s.user_id
  JOIN public.challenges c ON c.id = s.challenge_id
  LEFT JOIN public.events e ON e.id = c.event_id
  WHERE public.match_event_mode(p_event_mode, p_event_id, c.event_id)
  AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
  AND (
    c.event_id IS NULL
    OR (
      (e.start_time IS NULL OR now() >= e.start_time)
    )
  )
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_recent_solves(INT, INT, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_activity_stats(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS TABLE (
  date TEXT,
  solves INTEGER,
  active_users INTEGER
) AS $$
BEGIN
  IF p_start IS NULL OR p_end IS NULL THEN
    RAISE EXCEPTION 'start and end are required';
  END IF;

  IF p_start > p_end THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      date_trunc('day', p_start),
      date_trunc('day', p_end),
      interval '1 day'
    ) AS day
  ),
  agg AS (
    SELECT
      date_trunc('day', s.created_at) AS day,
      COUNT(*)::int AS solves,
      COUNT(DISTINCT s.user_id)::int AS active_users
    FROM public.solves s
    WHERE s.created_at >= p_start
      AND s.created_at <= p_end
    GROUP BY 1
  )
  SELECT
    to_char(d.day::date, 'YYYY-MM-DD') AS date,
    COALESCE(a.solves, 0) AS solves,
    COALESCE(a.active_users, 0) AS active_users
  FROM days d
  LEFT JOIN agg a ON a.day = d.day
  ORDER BY d.day ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_activity_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION get_solvers_all(
  p_limit INT DEFAULT 250,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  solve_id UUID,
  user_id UUID,
  username TEXT,
  challenge_id UUID,
  challenge_title TEXT,
  solved_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT has_admin_access() THEN
    RAISE EXCEPTION 'Only admin can view all solvers';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    u.id,
    u.username::TEXT,
    c.id,
    c.title::TEXT,
    s.created_at
  FROM public.solves s
  JOIN public.users u ON u.id = s.user_id
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE
    is_admin()
    OR (
      c.event_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.event_admins ea
        WHERE ea.user_id = auth.uid()::uuid
          AND ea.event_id = c.event_id
      )
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_solvers_all(INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION get_solves_by_name(
  p_username TEXT
)
RETURNS TABLE (
  solve_id UUID,
  user_id UUID,
  username TEXT,
  challenge_id UUID,
  challenge_title TEXT,
  challenge_category TEXT,
  points INTEGER,
  solved_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT has_admin_access() THEN
    RAISE EXCEPTION 'Only admin can view solves by username';
  END IF;

  RETURN QUERY
  SELECT
    s.id AS solve_id,
    u.id AS user_id,
    u.username::TEXT,
    c.id AS challenge_id,
    c.title::TEXT AS challenge_title,
    c.category::TEXT AS challenge_category,
    c.points,
    s.created_at AS solved_at
  FROM public.solves s
  JOIN public.users u ON u.id = s.user_id
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE lower(u.username) = lower(p_username)
    AND (
      is_admin()
      OR (
        c.event_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.event_admins ea
          WHERE ea.user_id = auth.uid()::uuid
            AND ea.event_id = c.event_id
        )
      )
    )
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_solves_by_name(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_solves_by_challenge(
  p_challenge_title TEXT
)
RETURNS TABLE (
  solve_id UUID,
  user_id UUID,
  username TEXT,
  challenge_id UUID,
  challenge_title TEXT,
  challenge_category TEXT,
  points INTEGER,
  solved_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT has_admin_access() THEN
    RAISE EXCEPTION 'Only admin can view solves by challenge';
  END IF;

  RETURN QUERY
  SELECT
    s.id AS solve_id,
    u.id AS user_id,
    u.username::TEXT,
    c.id AS challenge_id,
    c.title::TEXT AS challenge_title,
    c.category::TEXT AS challenge_category,
    c.points,
    s.created_at AS solved_at
  FROM public.solves s
  JOIN public.users u ON u.id = s.user_id
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE lower(c.title) = lower(p_challenge_title)
    AND (
      is_admin()
      OR (
        c.event_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.event_admins ea
          WHERE ea.user_id = auth.uid()::uuid
            AND ea.event_id = c.event_id
        )
      )
    )
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_solves_by_challenge(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_challenge_solvers(
  p_challenge_id UUID
)
RETURNS TABLE (
  username TEXT,
  solved_at TIMESTAMPTZ,
  picture TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.username::TEXT,
    s.created_at AS solved_at,
    public.resolve_profile_picture(u.profile_picture_url, au.raw_user_meta_data)::TEXT AS picture
  FROM public.solves s
  JOIN public.users u ON u.id = s.user_id
  LEFT JOIN auth.users au ON au.id = u.id
  WHERE s.challenge_id = p_challenge_id
  ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_challenge_solvers(UUID) TO authenticated, anon;

-- DELETE
CREATE OR REPLACE FUNCTION delete_solver(
  p_solve_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_before JSONB;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can delete solver';
  END IF;

  SELECT jsonb_build_object(
    'solve_id', s.id,
    'user_id', s.user_id,
    'challenge_id', s.challenge_id,
    'challenge_title', c.title,
    'solved_at', s.created_at
  )
  INTO v_before
  FROM public.solves s
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE s.id = p_solve_id;

  DELETE FROM public.solves WHERE id = p_solve_id;

  PERFORM public.write_admin_audit_log(
    'DELETE',
    'solve',
    p_solve_id,
    v_before,
    NULL,
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION delete_solver(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_solved_event_ids()
RETURNS TABLE (event_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
  SELECT DISTINCT c.event_id
  FROM public.solves s
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE c.event_id IS NOT NULL
    AND c.is_active = TRUE;
$$;

GRANT EXECUTE ON FUNCTION get_solved_event_ids() TO authenticated;

-- RLS/POLICY
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solves can select all" ON public.solves;
CREATE POLICY "Solves can select all"
  ON public.solves
  FOR SELECT
  USING (true);

-- RELOCATED FUNCTIONS

CREATE OR REPLACE FUNCTION get_solve_info(
  p_user_id UUID,
  p_challenge_id UUID
)
RETURNS TABLE (
  username TEXT,
  challenge TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.username::TEXT,
    c.title::TEXT
  FROM public.users u
  JOIN public.challenges c ON c.id = p_challenge_id
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_solve_info(UUID, UUID) TO authenticated;

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
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_user_first_bloods(UUID) TO authenticated;
