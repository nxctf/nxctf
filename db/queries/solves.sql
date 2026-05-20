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
      AND (
        p_event_mode = 'any'
        OR (p_event_mode = 'main' AND c.event_id IS NULL)
        OR (p_event_mode = 'event' AND c.event_id = p_event_id)
      )
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
      AND (
        p_event_mode = 'any'
        OR (p_event_mode = 'main' AND c.event_id IS NULL)
        OR (p_event_mode = 'event' AND c.event_id = p_event_id)
      )
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
SECURITY DEFINER;

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
  WHERE (
    p_event_mode = 'any'
    OR (p_event_mode = 'main' AND c.event_id IS NULL)
    OR (p_event_mode = 'event' AND c.event_id = p_event_id)
  )
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
SECURITY DEFINER;

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
SECURITY DEFINER;

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
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_solves_by_challenge(TEXT) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION delete_solver(
  p_solve_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can delete solver';
  END IF;

  DELETE FROM public.solves WHERE id = p_solve_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_solver(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solves can select all" ON public.solves;
CREATE POLICY "Solves can select all"
  ON public.solves
  FOR SELECT
  USING (true);
