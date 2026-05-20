-- ==============================================
-- Queries: event_admins
-- Source: sql/chema.sql
-- ==============================================

-- SELECT
CREATE OR REPLACE FUNCTION can_manage_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF p_event_id IS NULL THEN
    RETURN is_admin();
  END IF;

  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.event_admins ea
    WHERE ea.user_id = v_user_id
      AND ea.event_id = p_event_id
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_manage_event(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION can_manage_challenge(p_challenge_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_event_id UUID;
BEGIN
  SELECT c.event_id INTO v_event_id
  FROM public.challenges c
  WHERE c.id = p_challenge_id;

  RETURN can_manage_event(v_event_id);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_manage_challenge(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_admin_scope()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_is_global BOOLEAN := FALSE;
  v_event_ids UUID[] := ARRAY[]::uuid[];
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('is_global_admin', false, 'event_ids', ARRAY[]::uuid[]);
  END IF;

  v_is_global := is_admin();

  SELECT COALESCE(array_agg(ea.event_id ORDER BY ea.event_id), ARRAY[]::uuid[])
  INTO v_event_ids
  FROM public.event_admins ea
  WHERE ea.user_id = v_user_id;

  RETURN json_build_object('is_global_admin', v_is_global, 'event_ids', v_event_ids);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_scope() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_event_admins()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  event_id UUID,
  event_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can list event admins';
  END IF;

  RETURN QUERY
  SELECT
    ea.user_id,
    u.username,
    ea.event_id,
    e.name,
    ea.created_at
  FROM public.event_admins ea
  JOIN public.users u ON u.id = ea.user_id
  JOIN public.events e ON e.id = ea.event_id
  ORDER BY e.name ASC, u.username ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.get_event_admins() TO authenticated;

-- INSERT
CREATE OR REPLACE FUNCTION public.grant_event_admin(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS JSON AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can grant event admin';
  END IF;

  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User is required');
  END IF;

  IF p_event_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Event is required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = p_event_id) THEN
    RETURN json_build_object('success', false, 'message', 'Event not found');
  END IF;

  INSERT INTO public.event_admins(user_id, event_id)
  VALUES (p_user_id, p_event_id)
  ON CONFLICT (user_id, event_id) DO NOTHING;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.grant_event_admin(UUID, UUID) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION public.revoke_event_admin(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_deleted INT := 0;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can revoke event admin';
  END IF;

  IF p_user_id IS NULL OR p_event_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User and event are required');
  END IF;

  DELETE FROM public.event_admins
  WHERE user_id = p_user_id
    AND event_id = p_event_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN json_build_object('success', true, 'deleted', v_deleted);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.revoke_event_admin(UUID, UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.event_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event admins select by admin" ON public.event_admins;
CREATE POLICY "Event admins select by admin"
  ON public.event_admins
  FOR SELECT
  USING (is_admin() OR user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Event admins insert by admin" ON public.event_admins;
CREATE POLICY "Event admins insert by admin"
  ON public.event_admins
  FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Event admins delete by admin" ON public.event_admins;
CREATE POLICY "Event admins delete by admin"
  ON public.event_admins
  FOR DELETE
  USING (is_admin());
