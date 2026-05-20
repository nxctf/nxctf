-- ==============================================
-- Queries: users
-- Source: sql/chema.sql
-- ==============================================

-- SELECT
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_user_id;
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION has_admin_access()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.event_admins ea
    WHERE ea.user_id = v_user_id
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_admin_access() TO authenticated;

CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT au.email
  INTO v_email
  FROM auth.users au
  JOIN public.users u ON u.id = au.id
  WHERE u.username = p_username;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_email_by_username(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_username_by_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE v_username TEXT;
BEGIN
  SELECT u.username
  INTO v_username
  FROM public.users u
  JOIN auth.users au ON au.id = u.id
  WHERE LOWER(au.email) = LOWER(p_email);

  RETURN v_username;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_username_by_email(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_user_profile(p_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  picture TEXT,
  profile_picture_url TEXT,
  solved_event_ids UUID[],
  has_main_solved BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username::TEXT,
    COALESCE(
      au.raw_user_meta_data->>'picture',
      au.raw_user_meta_data->>'avatar_url',
      u.profile_picture_url
    )::TEXT AS picture,
    u.profile_picture_url::TEXT,
    COALESCE(
      (
        SELECT array_agg(DISTINCT c.event_id) FILTER (WHERE c.event_id IS NOT NULL)
        FROM public.solves s
        JOIN public.challenges c ON c.id = s.challenge_id
        WHERE s.user_id = u.id
      ),
      '{}'::uuid[]
    ) AS solved_event_ids,
    EXISTS (
      SELECT 1
      FROM public.solves s
      JOIN public.challenges c ON c.id = s.challenge_id
      WHERE s.user_id = u.id
        AND c.event_id IS NULL
    ) AS has_main_solved
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  WHERE u.id = p_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION detail_user(p_id UUID, p_event_id UUID DEFAULT NULL, p_event_mode TEXT DEFAULT 'any')
RETURNS JSON
AS $$
DECLARE
  v_user RECORD;
  v_rank BIGINT;
  v_score INT;
  v_solves JSON;
  v_picture TEXT;
  v_last_login TIMESTAMPTZ;
BEGIN
  SELECT id, username, bio, sosmed, profile_picture_url, created_at
  INTO v_user
  FROM public.users
  WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  SELECT
    COALESCE(
      au.raw_user_meta_data->>'picture',
      au.raw_user_meta_data->>'avatar_url',
      v_user.profile_picture_url
    ),
    NULLIF(
      GREATEST(
        COALESCE(au.last_sign_in_at, 'epoch'::timestamptz),
        COALESCE(au.updated_at, 'epoch'::timestamptz)
      ),
      'epoch'::timestamptz
    )
  INTO v_picture, v_last_login
  FROM auth.users au
  WHERE au.id = v_user.id;

  SELECT r.rank
  INTO v_rank
  FROM (
    SELECT
      u.id,
      RANK() OVER (
        ORDER BY COALESCE(SUM(CASE WHEN (
          p_event_mode = 'any'
          OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
          OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
        ) THEN c.points ELSE 0 END), 0) DESC,
                 MAX(CASE WHEN (
          p_event_mode = 'any'
          OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
          OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
        ) THEN s.created_at ELSE NULL END) ASC
      ) AS rank
    FROM public.users u
    LEFT JOIN public.solves s ON u.id = s.user_id
    LEFT JOIN public.challenges c ON s.challenge_id = c.id
    GROUP BY u.id
  ) r
  WHERE r.id = p_id;

  SELECT COALESCE(SUM(CASE WHEN (
    p_event_mode = 'any'
    OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
    OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
  ) THEN c.points ELSE 0 END), 0)
  INTO v_score
  FROM public.solves s
  JOIN public.challenges c ON s.challenge_id = c.id
  WHERE s.user_id = p_id;

  SELECT COALESCE(
    json_agg(
      json_build_object(
        'challenge_id', c.id,
        'title', c.title,
        'category', c.category,
        'points', c.points,
        'difficulty', c.difficulty,
        'solved_at', s.created_at
      )
      ORDER BY s.created_at DESC
    ),
    '[]'::json
  )
  INTO v_solves
  FROM public.solves s
  JOIN public.challenges c ON s.challenge_id = c.id
  WHERE s.user_id = p_id
    AND (
      p_event_mode = 'any'
      OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
      OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
    );

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'rank', COALESCE(v_rank, 0),
      'score', COALESCE(v_score, 0),
      'picture', v_picture,
      'bio', COALESCE(v_user.bio, ''),
      'sosmed', COALESCE(v_user.sosmed, '{}'::jsonb),
      'profile_picture_url', v_user.profile_picture_url,
      'created_at', v_user.created_at,
      'last_login_at', v_last_login
    ),
    'solved_challenges', v_solves
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION detail_user(UUID, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_leaderboard(
  limit_rows integer DEFAULT 100,
  offset_rows integer DEFAULT 0,
  p_event_id UUID DEFAULT NULL,
  p_event_mode TEXT DEFAULT 'any'
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  score BIGINT,
  last_solve TIMESTAMPTZ,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username::TEXT,
    COALESCE(
      SUM(
        CASE WHEN (
          p_event_mode = 'any'
          OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
          OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
        ) THEN c.points ELSE 0 END
      ), 0
    ) AS score,
    MAX(
      CASE WHEN (
        p_event_mode = 'any'
        OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
        OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
      ) THEN s.created_at ELSE NULL END
    ) AS last_solve,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(
        SUM(CASE WHEN (
          p_event_mode = 'any'
          OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
          OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
        ) THEN c.points ELSE 0 END), 0
      ) DESC,
      MAX(CASE WHEN (
        p_event_mode = 'any'
        OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
        OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
      ) THEN s.created_at ELSE NULL END) ASC
    ) AS rank
  FROM public.users u
  LEFT JOIN public.solves s ON u.id = s.user_id
  LEFT JOIN public.challenges c ON s.challenge_id = c.id
  GROUP BY u.id, u.username
  HAVING COALESCE(
    SUM(
      CASE WHEN (
        p_event_mode = 'any'
        OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
        OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
      ) THEN c.points ELSE 0 END
    ), 0
  ) > 0
  ORDER BY score DESC, last_solve ASC
  LIMIT limit_rows OFFSET offset_rows;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_leaderboard(integer, integer, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION get_top_progress(
  p_user_ids UUID[],
  p_limit INT DEFAULT 1000,
  p_offset INT DEFAULT 0,
  p_event_id UUID DEFAULT NULL,
  p_event_mode TEXT DEFAULT 'any'
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  created_at TIMESTAMPTZ,
  points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.user_id,
    u.username::TEXT,
    s.created_at,
    c.points
  FROM public.solves s
  JOIN public.challenges c ON c.id = s.challenge_id
  JOIN public.users u ON u.id = s.user_id
  WHERE s.user_id = ANY(p_user_ids)
    AND (
      p_event_mode = 'any'
      OR (p_event_mode = 'is_null' AND c.event_id IS NULL)
      OR (p_event_mode = 'equals' AND c.event_id = p_event_id)
    )
  ORDER BY s.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_top_progress(UUID[], INT, INT, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_info()
RETURNS JSON AS $$
DECLARE
  v_total_users BIGINT;
  v_total_admins BIGINT;
  v_total_solves BIGINT;
  v_unique_solvers BIGINT;
  v_total_challenges BIGINT;
  v_active_challenges BIGINT;
BEGIN
  SELECT COUNT(*)::BIGINT INTO v_total_users FROM public.users;
  SELECT COUNT(*)::BIGINT INTO v_total_admins FROM public.users WHERE is_admin = TRUE;
  SELECT COUNT(*)::BIGINT INTO v_total_solves FROM public.solves;
  SELECT COUNT(DISTINCT user_id)::BIGINT INTO v_unique_solvers FROM public.solves;
  SELECT COUNT(*)::BIGINT INTO v_total_challenges FROM public.challenges;
  SELECT COUNT(*)::BIGINT INTO v_active_challenges FROM public.challenges WHERE is_active = TRUE;

  RETURN json_build_object(
    'total_users', v_total_users,
    'total_admins', v_total_admins,
    'total_solves', v_total_solves,
    'unique_solvers', v_unique_solvers,
    'total_challenges', v_total_challenges,
    'active_challenges', v_active_challenges,
    'success', true
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_info() TO authenticated;

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
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_solve_info(UUID, UUID) TO authenticated;

-- INSERT
CREATE OR REPLACE FUNCTION create_profile(p_id uuid, p_username text)
RETURNS void AS $$
DECLARE
  v_username text := substring(p_username from 1 for 28);
  v_suffix int := 1;
BEGIN
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_username) LOOP
    v_username := substring(p_username from 1 for 28) || '_' || v_suffix;
    v_suffix := v_suffix + 1;
  END LOOP;

  INSERT INTO public.users (id, username)
  VALUES (p_id, v_username)
  ON CONFLICT (id) DO NOTHING;

  WITH base AS (
    SELECT
      au.id,
      SUBSTRING(COALESCE(
        au.raw_user_meta_data->>'username',
        au.raw_user_meta_data->>'display_name',
        split_part(au.email, '@', 1)
      ) FROM 1 FOR 28) AS base_username
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE pu.id IS NULL
  ),
  stats AS (
    SELECT
      b.base_username,
      EXISTS (
        SELECT 1 FROM public.users u WHERE u.username = b.base_username
      ) AS base_exists,
      COALESCE(
        MAX((regexp_match(u.username, '^' || b.base_username || '_(\\d+)$'))[1]::int),
        0
      ) AS max_suffix
    FROM base b
    LEFT JOIN public.users u
      ON u.username = b.base_username
      OR u.username ~ ('^' || b.base_username || '_(\\d+)$')
    GROUP BY b.base_username
  ),
  numbered AS (
    SELECT
      b.id,
      b.base_username,
      ROW_NUMBER() OVER (PARTITION BY b.base_username ORDER BY b.id) AS rn
    FROM base b
  ),
  resolved AS (
    SELECT
      n.id,
      CASE
        WHEN n.rn = 1 AND s.base_exists = false THEN n.base_username
        ELSE n.base_username || '_' || (
          s.max_suffix + n.rn - (CASE WHEN s.base_exists THEN 0 ELSE 1 END)
        )
      END AS username
    FROM numbered n
    JOIN stats s ON s.base_username = n.base_username
  )
  INSERT INTO public.users (id, username)
  SELECT id, username
  FROM resolved
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT) TO authenticated;

-- UPDATE
CREATE OR REPLACE FUNCTION update_username(p_id uuid, p_username text)
RETURNS json AS $$
DECLARE
  v_username text := p_username;
  v_old_username text;
  v_exists int;
  v_user_id uuid := auth.uid()::uuid;
BEGIN
  IF p_id IS DISTINCT FROM v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot change other user''s username');
  END IF;

  IF length(v_username) > 32 THEN
    RETURN json_build_object('success', false, 'message', 'Username cannot exceed 32 characters');
  END IF;

  SELECT username INTO v_old_username FROM public.users WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  SELECT count(*) INTO v_exists FROM public.users WHERE lower(username) = lower(v_username) AND id <> p_id;
  IF v_exists > 0 THEN
    RETURN json_build_object('success', false, 'message', 'Username already taken');
  END IF;

  UPDATE public.users SET username = v_username, updated_at = now() WHERE id = p_id;
  RETURN json_build_object('success', true, 'username', v_username);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_username(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION update_bio(p_id uuid, p_bio text)
RETURNS json AS $$
DECLARE
  v_user_id uuid := auth.uid()::uuid;
BEGIN
  IF p_id IS DISTINCT FROM v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot change other user''s bio');
  END IF;

  IF length(p_bio) > 255 THEN
    RETURN json_build_object('success', false, 'message', 'Bio cannot exceed 255 characters');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  UPDATE public.users SET bio = p_bio, updated_at = now() WHERE id = p_id;
  RETURN json_build_object('success', true, 'bio', p_bio);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_bio(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION update_sosmed(p_id uuid, p_sosmed jsonb)
RETURNS json AS $$
DECLARE
  v_user_id uuid := auth.uid()::uuid;
BEGIN
  IF p_id IS DISTINCT FROM v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot change other user''s sosmed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  UPDATE public.users SET sosmed = p_sosmed, updated_at = now() WHERE id = p_id;
  RETURN json_build_object('success', true, 'sosmed', p_sosmed);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_sosmed(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION update_profile_picture(p_id uuid, p_profile_picture_url text)
RETURNS json AS $$
DECLARE
  v_user_id uuid := auth.uid()::uuid;
  v_url text := NULLIF(TRIM(p_profile_picture_url), '');
BEGIN
  IF p_id IS DISTINCT FROM v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot change other user''s profile picture');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  UPDATE public.users SET profile_picture_url = v_url, updated_at = now() WHERE id = p_id;
  RETURN json_build_object('success', true, 'profile_picture_url', v_url);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_profile_picture(uuid, text) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION cleanup_orphaned_users_and_solves()
RETURNS void AS $$
BEGIN
  DELETE FROM public.solves
  WHERE user_id NOT IN (SELECT id FROM auth.users);

  DELETE FROM public.users
  WHERE id NOT IN (SELECT id FROM auth.users);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_orphaned_users_and_solves() TO authenticated;

-- RLS/POLICY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select all" ON public.users;
CREATE POLICY "Users can select all"
  ON public.users
  FOR SELECT
  USING (true);
