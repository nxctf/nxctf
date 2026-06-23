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

CREATE OR REPLACE FUNCTION public.is_banned(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_banned_until TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  SELECT banned_until INTO v_banned_until FROM public.users WHERE id = p_user_id;
  RETURN v_banned_until IS NOT NULL AND v_banned_until > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_banned(UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_current_user_banned()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_banned(auth.uid()::uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_current_user_banned() TO authenticated, anon;

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


CREATE OR REPLACE FUNCTION get_user_profile(p_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  picture TEXT,
  profile_picture_url TEXT,
  solved_event_ids UUID[],
  has_main_solved BOOLEAN,
  banned_until TIMESTAMPTZ,
  ban_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username::TEXT,
    COALESCE(
      u.profile_picture_url,
      au.raw_user_meta_data->>'picture',
      au.raw_user_meta_data->>'avatar_url'
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
    ) AS has_main_solved,
    u.banned_until,
    u.ban_reason
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
      v_user.profile_picture_url,
      au.raw_user_meta_data->>'picture',
      au.raw_user_meta_data->>'avatar_url'
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

CREATE OR REPLACE FUNCTION detail_user_lite(p_id UUID, p_event_id UUID DEFAULT NULL, p_event_mode TEXT DEFAULT 'any')
RETURNS JSON
AS $$
DECLARE
  v_rank BIGINT;
  v_solved_count INT;
BEGIN
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

  SELECT COUNT(*)::int
  INTO v_solved_count
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
    'rank', COALESCE(v_rank, 0),
    'solved_count', COALESCE(v_solved_count, 0)
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION detail_user_lite(UUID, UUID, TEXT) TO authenticated;

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
  rank BIGINT,
  picture TEXT
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
    ) AS rank,
    COALESCE(
      u.profile_picture_url,
      au.raw_user_meta_data->>'picture',
      au.raw_user_meta_data->>'avatar_url'
    )::TEXT AS picture
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.solves s ON u.id = s.user_id
  LEFT JOIN public.challenges c ON s.challenge_id = c.id
  GROUP BY u.id, u.username, au.raw_user_meta_data, u.profile_picture_url
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

CREATE OR REPLACE FUNCTION resolve_user_pictures(p_user_ids UUID[])
RETURNS TABLE (user_id UUID, username TEXT, picture TEXT)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql
AS $$
  SELECT u.id, u.username::TEXT,
    COALESCE(
      u.profile_picture_url,
      au.raw_user_meta_data->>'picture',
      au.raw_user_meta_data->>'avatar_url'
    )::TEXT AS picture
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  WHERE u.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION resolve_user_pictures(UUID[]) TO authenticated;

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

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  score BIGINT,
  rank BIGINT,
  is_admin BOOLEAN,
  solve_count BIGINT,
  last_solve_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can list admin users';
  END IF;

  RETURN QUERY
  WITH solve_stats AS (
    SELECT
      s.user_id,
      COALESCE(SUM(c.points), 0)::BIGINT AS score,
      COUNT(s.id)::BIGINT AS solve_count,
      MAX(s.created_at) AS last_solve_at
    FROM public.solves s
    JOIN public.challenges c ON c.id = s.challenge_id
    GROUP BY s.user_id
  ),
  ranked_users AS (
    SELECT
      u.id,
      ROW_NUMBER() OVER (
        ORDER BY
          COALESCE(ss.score, 0) DESC,
          ss.last_solve_at ASC NULLS LAST,
          u.created_at ASC,
          u.username ASC
      )::BIGINT AS rank
    FROM public.users u
    LEFT JOIN solve_stats ss ON ss.user_id = u.id
  )
  SELECT
    u.id,
    u.username::TEXT,
    au.email::TEXT,
    COALESCE(ss.score, 0)::BIGINT,
    ru.rank,
    COALESCE(u.is_admin, FALSE),
    COALESCE(ss.solve_count, 0)::BIGINT,
    ss.last_solve_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    u.created_at,
    u.updated_at
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN solve_stats ss ON ss.user_id = u.id
  JOIN ranked_users ru ON ru.id = u.id
  ORDER BY
    COALESCE(ss.score, 0) DESC,
    ss.last_solve_at ASC NULLS LAST,
    u.username ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

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
  IF NOT v_username ~ '^[a-zA-Z0-9_. -]+$' THEN
    RAISE EXCEPTION 'Username can only contain letters, numbers, spaces, ".", "_", and "-".';
  END IF;

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

CREATE OR REPLACE FUNCTION check_username_exists(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE username = p_username
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_username_exists(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon, authenticated;

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

  IF NOT v_username ~ '^[a-zA-Z0-9_. -]+$' THEN
    RETURN json_build_object('success', false, 'message', 'Username can only contain letters, numbers, spaces, ".", "_", and "-".');
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

CREATE OR REPLACE FUNCTION public.get_admin_users_paginated(
  p_search text default null,
  p_role text default 'all',
  p_sort_by text default 'newest',
  p_limit int default 100,
  p_offset int default 0,
  p_status text default 'all'
)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  is_admin boolean,
  bio text,
  sosmed jsonb,
  profile_picture_url text,
  created_at timestamptz,
  updated_at timestamptz,
  banned_until timestamptz,
  ban_reason text,
  total_count bigint
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admin can list admin users';
  END IF;

  RETURN QUERY
  WITH filtered_users AS (
    SELECT
      u.id,
      u.username::text,
      au.email::text,
      COALESCE(u.is_admin, false) AS is_admin,
      u.bio::text,
      u.sosmed,
      COALESCE(
        u.profile_picture_url,
        au.raw_user_meta_data->>'picture',
        au.raw_user_meta_data->>'avatar_url'
      )::text AS profile_picture_url,
      u.created_at,
      u.updated_at,
      u.banned_until,
      u.ban_reason
    FROM public.users u
    LEFT JOIN auth.users au ON au.id = u.id
    WHERE (
      p_search IS NULL OR p_search = '' OR
      u.username ILIKE '%' || p_search || '%' OR
      u.bio ILIKE '%' || p_search || '%' OR
      au.email ILIKE '%' || p_search || '%' OR
      u.id::text = p_search
    ) AND (
      p_role = 'all' OR
      (p_role = 'admin' AND u.is_admin = true) OR
      (p_role = 'user' AND u.is_admin = false)
    ) AND (
      p_status = 'all' OR
      (p_status = 'banned' AND u.banned_until IS NOT NULL AND u.banned_until > now()) OR
      (p_status = 'active' AND (u.banned_until IS NULL OR u.banned_until <= now()))
    )
  ),
  total_cnt AS (
    SELECT COUNT(*) AS cnt FROM filtered_users
  )
  SELECT
    f.id,
    f.username,
    f.email,
    f.is_admin,
    f.bio,
    f.sosmed,
    f.profile_picture_url,
    f.created_at,
    f.updated_at,
    f.banned_until,
    f.ban_reason,
    tc.cnt
  FROM filtered_users f
  CROSS JOIN total_cnt tc
  ORDER BY
    CASE WHEN p_sort_by = 'newest' THEN f.created_at END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN f.created_at END ASC,
    CASE WHEN p_sort_by = 'updated_desc' THEN f.updated_at END DESC,
    CASE WHEN p_sort_by = 'role' THEN f.is_admin END DESC,
    f.username ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.get_admin_users_paginated(text, text, text, int, int, text) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select all" ON public.users;
CREATE POLICY "Users can select all"
  ON public.users
  FOR SELECT
  USING (true);

-- Admin control functions (running as SECURITY DEFINER to bypass RLS and edit auth.users/public.users)
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_user_id UUID,
  p_duration_minutes INT,
  p_reason TEXT DEFAULT 'Banned by administrator'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_banned_until TIMESTAMPTZ := NULL;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can ban users';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Cannot ban an admin user';
  END IF;

  IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    v_banned_until := '9999-12-31 23:59:59+00'::TIMESTAMPTZ;
  ELSE
    v_banned_until := now() + (p_duration_minutes * interval '1 minute');
  END IF;

  UPDATE public.users
  SET banned_until = v_banned_until,
      ban_reason = p_reason,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_ban_user(UUID, INT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_unban_user(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can unban users';
  END IF;

  UPDATE public.users
  SET banned_until = NULL,
      ban_reason = NULL,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_unban_user(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_change_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can change user passwords';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public, extensions;

GRANT EXECUTE ON FUNCTION public.admin_change_password(UUID, TEXT) TO authenticated;
