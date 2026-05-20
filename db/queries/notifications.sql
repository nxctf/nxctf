-- ==============================================
-- Queries: notifications
-- Source: sql/chema.sql
-- ==============================================

-- SELECT
CREATE OR REPLACE FUNCTION get_notifications(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  level TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title::TEXT, n.message, n.level::TEXT, n.created_by, n.created_at
  FROM public.notifications n
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_notifications(INT, INT) TO authenticated;

-- INSERT
CREATE OR REPLACE FUNCTION create_notification(
  p_title TEXT,
  p_message TEXT,
  p_level TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_new_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can create notifications';
  END IF;

  INSERT INTO public.notifications(title, message, level, created_by)
  VALUES (p_title, p_message, COALESCE(NULLIF(p_level, ''), 'info'), v_user_id)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_notification(TEXT, TEXT, TEXT) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION delete_notification(
  p_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can delete notifications';
  END IF;

  DELETE FROM public.notifications WHERE id = p_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_notification(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications readable" ON public.notifications;
CREATE POLICY "Notifications readable"
  ON public.notifications
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Notifications insert by admin" ON public.notifications;
CREATE POLICY "Notifications insert by admin"
  ON public.notifications
  FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Notifications delete by admin" ON public.notifications;
CREATE POLICY "Notifications delete by admin"
  ON public.notifications
  FOR DELETE
  USING (is_admin());
