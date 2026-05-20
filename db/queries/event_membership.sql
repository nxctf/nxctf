-- ==============================================
-- Queries: event_membership
-- Event join flow management (open / request / key)
-- ==============================================

-- SELECT
CREATE OR REPLACE FUNCTION get_event_join_settings(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
  v_mode TEXT;
  v_has_key BOOLEAN;
BEGIN
  SELECT e.join_mode, (e.join_key IS NOT NULL AND trim(e.join_key) <> '')
  INTO v_mode, v_has_key
  FROM public.events e
  WHERE e.id = p_event_id;

  IF v_mode IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Event not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'event_id', p_event_id,
    'join_mode', v_mode,
    'has_join_key', v_has_key
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_event_join_settings(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_my_event_membership(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_join_mode TEXT;
  v_is_member BOOLEAN := FALSE;
  v_request_status TEXT := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT e.join_mode INTO v_join_mode
  FROM public.events e
  WHERE e.id = p_event_id;

  IF v_join_mode IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Event not found');
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.event_participants ep
    WHERE ep.event_id = p_event_id AND ep.user_id = v_user_id
  ) INTO v_is_member;

  SELECT ejr.status
  INTO v_request_status
  FROM public.event_join_requests ejr
  WHERE ejr.event_id = p_event_id
    AND ejr.user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'event_id', p_event_id,
    'join_mode', v_join_mode,
    'is_member', v_is_member,
    'request_status', v_request_status
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_my_event_membership(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_all_my_event_memberships()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'success', true,
        'event_id', e.id,
        'join_mode', e.join_mode,
        'is_member', ep.user_id IS NOT NULL,
        'request_status', ejr.status
      )
    ), '[]'::json)
    FROM public.events e
    LEFT JOIN public.event_participants ep
      ON ep.event_id = e.id AND ep.user_id = v_user_id
    LEFT JOIN public.event_join_requests ejr
      ON ejr.event_id = e.id AND ejr.user_id = v_user_id
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION get_all_my_event_memberships() TO authenticated;

CREATE OR REPLACE FUNCTION list_event_members(p_event_id UUID)
RETURNS TABLE (
  event_id UUID,
  user_id UUID,
  username TEXT,
  joined_at TIMESTAMPTZ,
  joined_by UUID
) AS $$
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can view members';
  END IF;

  RETURN QUERY
  SELECT
    ep.event_id,
    ep.user_id,
    u.username::TEXT,
    ep.joined_at,
    ep.joined_by
  FROM public.event_participants ep
  JOIN public.users u ON u.id = ep.user_id
  WHERE ep.event_id = p_event_id
  ORDER BY ep.joined_at ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION list_event_members(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION list_event_join_requests(
  p_event_id UUID,
  p_status TEXT DEFAULT 'pending'
)
RETURNS TABLE (
  request_id UUID,
  event_id UUID,
  user_id UUID,
  username TEXT,
  status TEXT,
  note TEXT,
  requested_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
) AS $$
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can view join requests';
  END IF;

  RETURN QUERY
  SELECT
    ejr.id,
    ejr.event_id,
    ejr.user_id,
    u.username::TEXT,
    ejr.status::TEXT,
    ejr.note::TEXT,
    ejr.requested_at,
    ejr.reviewed_at,
    ejr.reviewed_by
  FROM public.event_join_requests ejr
  JOIN public.users u ON u.id = ejr.user_id
  WHERE ejr.event_id = p_event_id
    AND (
      p_status IS NULL
      OR p_status = 'any'
      OR ejr.status = p_status
    )
  ORDER BY ejr.requested_at DESC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION list_event_join_requests(UUID, TEXT) TO authenticated;

-- INSERT
CREATE OR REPLACE FUNCTION join_event(
  p_event_id UUID,
  p_join_key TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_mode TEXT;
  v_key TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT e.join_mode, e.join_key
  INTO v_mode, v_key
  FROM public.events e
  WHERE e.id = p_event_id;

  IF v_mode IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Event not found');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_participants ep
    WHERE ep.event_id = p_event_id AND ep.user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', true, 'status', 'joined', 'message', 'Already joined');
  END IF;

  IF v_mode = 'open' THEN
    INSERT INTO public.event_participants(event_id, user_id, joined_by)
    VALUES (p_event_id, v_user_id, v_user_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;

    RETURN json_build_object('success', true, 'status', 'joined', 'message', 'Joined event');
  END IF;

  IF v_mode = 'key' THEN
    IF p_join_key IS NULL OR trim(p_join_key) = '' OR p_join_key <> v_key THEN
      RETURN json_build_object('success', false, 'status', 'invalid_key', 'message', 'Invalid join key');
    END IF;

    INSERT INTO public.event_participants(event_id, user_id, joined_by)
    VALUES (p_event_id, v_user_id, v_user_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;

    RETURN json_build_object('success', true, 'status', 'joined', 'message', 'Joined event');
  END IF;

  INSERT INTO public.event_join_requests(event_id, user_id, status, note, requested_at, reviewed_at, reviewed_by)
  VALUES (p_event_id, v_user_id, 'pending', p_note, now(), NULL, NULL)
  ON CONFLICT (event_id, user_id)
  DO UPDATE
    SET status = 'pending',
        note = EXCLUDED.note,
        requested_at = now(),
        reviewed_at = NULL,
        reviewed_by = NULL;

  RETURN json_build_object('success', true, 'status', 'pending', 'message', 'Join request submitted');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION join_event(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION admin_add_event_member(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can add members';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.event_participants(event_id, user_id, joined_by)
  VALUES (p_event_id, p_user_id, auth.uid()::uuid)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION admin_add_event_member(UUID, UUID) TO authenticated;

-- UPDATE
CREATE OR REPLACE FUNCTION set_event_join_settings(
  p_event_id UUID,
  p_join_mode TEXT,
  p_join_key TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_mode TEXT := lower(trim(COALESCE(p_join_mode, '')));
  v_key TEXT := NULLIF(trim(COALESCE(p_join_key, '')), '');
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can change event join settings';
  END IF;

  IF v_mode NOT IN ('open', 'request', 'key') THEN
    RETURN json_build_object('success', false, 'message', 'join_mode must be open/request/key');
  END IF;

  IF v_mode = 'key' AND v_key IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'join_key is required for key mode');
  END IF;

  UPDATE public.events
  SET join_mode = v_mode,
      join_key = CASE WHEN v_mode = 'key' THEN v_key ELSE NULL END,
      updated_at = now()
  WHERE id = p_event_id;

  RETURN json_build_object(
    'success', true,
    'event_id', p_event_id,
    'join_mode', v_mode,
    'has_join_key', (v_mode = 'key')
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION set_event_join_settings(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION regenerate_event_join_key(p_event_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can regenerate join key';
  END IF;

  v_key := substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 20);

  UPDATE public.events
  SET join_mode = 'key',
      join_key = v_key,
      updated_at = now()
  WHERE id = p_event_id;

  RETURN v_key;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION regenerate_event_join_key(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION review_event_join_request(
  p_request_id UUID,
  p_approve BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_event_id UUID;
  v_target_user UUID;
  v_status TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT ejr.event_id, ejr.user_id, ejr.status
  INTO v_event_id, v_target_user, v_status
  FROM public.event_join_requests ejr
  WHERE ejr.id = p_request_id;

  IF v_event_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Join request not found');
  END IF;

  IF NOT can_manage_event(v_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can review join request';
  END IF;

  IF p_approve THEN
    INSERT INTO public.event_participants(event_id, user_id, joined_by)
    VALUES (v_event_id, v_target_user, v_user_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;

    UPDATE public.event_join_requests
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = v_user_id
    WHERE id = p_request_id;

    RETURN json_build_object('success', true, 'status', 'approved');
  END IF;

  UPDATE public.event_join_requests
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = v_user_id
  WHERE id = p_request_id;

  RETURN json_build_object('success', true, 'status', 'rejected');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION review_event_join_request(UUID, BOOLEAN) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION admin_remove_event_member(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT can_manage_event(p_event_id) THEN
    RAISE EXCEPTION 'Only event admin/global admin can remove members';
  END IF;

  DELETE FROM public.event_participants
  WHERE event_id = p_event_id
    AND user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION admin_remove_event_member(UUID, UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event participants admin only" ON public.event_participants;
CREATE POLICY "Event participants admin only"
  ON public.event_participants
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Event join requests admin only" ON public.event_join_requests;
CREATE POLICY "Event join requests admin only"
  ON public.event_join_requests
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

GRANT SELECT ON TABLE public.event_participants TO authenticated;
DROP POLICY IF EXISTS "Event participants self select" ON public.event_participants;
CREATE POLICY "Event participants self select"
  ON public.event_participants
  FOR SELECT
  USING (user_id = auth.uid()::uuid);
