-- ==============================================
-- Queries: scoreboard
-- Relocated from users.sql
-- ==============================================

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
        CASE WHEN public.match_event_mode(p_event_mode, p_event_id, c.event_id)
          AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
          THEN c.points ELSE 0 END
      ), 0
    ) AS score,
    MAX(
      CASE WHEN public.match_event_mode(p_event_mode, p_event_id, c.event_id)
        AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
        THEN s.created_at ELSE NULL END
    ) AS last_solve,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(
        SUM(CASE WHEN public.match_event_mode(p_event_mode, p_event_id, c.event_id)
          AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
          THEN c.points ELSE 0 END), 0
      ) DESC,
      MAX(CASE WHEN public.match_event_mode(p_event_mode, p_event_id, c.event_id)
        AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
        THEN s.created_at ELSE NULL END) ASC
    ) AS rank,
    public.resolve_profile_picture(u.profile_picture_url, au.raw_user_meta_data)::TEXT AS picture
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.solves s ON u.id = s.user_id
  LEFT JOIN public.challenges c ON s.challenge_id = c.id
  GROUP BY u.id, u.username, au.raw_user_meta_data, u.profile_picture_url
  HAVING COALESCE(
    SUM(
      CASE WHEN public.match_event_mode(p_event_mode, p_event_id, c.event_id)
        AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
        THEN c.points ELSE 0 END
    ), 0
  ) > 0
  ORDER BY score DESC, last_solve ASC
  LIMIT limit_rows OFFSET offset_rows;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions;

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
    AND public.match_event_mode(p_event_mode, p_event_id, c.event_id)
    AND NOT (c.event_id IS NULL AND public.get_system_setting('disable_default_challenges') = 'true')
  ORDER BY s.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_top_progress(UUID[], INT, INT, UUID, TEXT) TO authenticated;
