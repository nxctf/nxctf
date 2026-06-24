-- ==============================================
-- Queries: system/common
-- Source: sql/chema.sql
-- ==============================================

REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

REVOKE UPDATE ON public.users FROM authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.events TO authenticated;
GRANT SELECT ON public.challenges TO authenticated;
GRANT SELECT ON public.solves TO authenticated;
GRANT SELECT ON public.event_admins TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_logs(INT, INT, UUID, TEXT) TO anon;
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.events TO anon;

-- RELOCATED FUNCTIONS

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
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_info() TO authenticated;

-- Single session active enforcement (1 device at a time, skip admins)
CREATE OR REPLACE FUNCTION public.limit_user_sessions()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
BEGIN
  -- 1. Get admin status from public.users table
  SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
  FROM public.users
  WHERE id = NEW.user_id;

  -- 2. If user is an admin, allow multiple sessions (bypass deletion)
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- 3. If not an admin, delete all other sessions
  DELETE FROM auth.sessions
  WHERE user_id = NEW.user_id AND id <> NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public, extensions;

-- Trigger to execute after a new session is inserted
DROP TRIGGER IF EXISTS tr_limit_user_sessions ON auth.sessions;
CREATE TRIGGER tr_limit_user_sessions
AFTER INSERT ON auth.sessions
FOR EACH ROW
EXECUTE FUNCTION public.limit_user_sessions();

-- RPC function to verify if caller's session is still active
CREATE OR REPLACE FUNCTION public.is_current_session_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.sessions WHERE id = (auth.jwt() ->> 'session_id')::uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public, extensions;

GRANT EXECUTE ON FUNCTION public.is_current_session_active() TO authenticated, anon;

-- Helper to retrieve system setting value
CREATE OR REPLACE FUNCTION public.get_system_setting(p_key VARCHAR)
RETURNS VARCHAR
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_val VARCHAR;
BEGIN
  SELECT value INTO v_val FROM public.system_settings WHERE key = p_key;
  RETURN COALESCE(v_val, 'false');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_setting(VARCHAR) TO authenticated, anon;

-- Admin function to update system settings
CREATE OR REPLACE FUNCTION public.update_system_settings(p_settings JSONB)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_key TEXT;
  v_val TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admins can update system settings';
  END IF;

  FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_settings)
  LOOP
    INSERT INTO public.system_settings (key, value, updated_at)
    VALUES (v_key, v_val, now())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();
  END LOOP;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_system_settings(JSONB) TO authenticated;

-- RLS/POLICY for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for everyone" ON public.system_settings;
CREATE POLICY "Allow select for everyone"
  ON public.system_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all for admin users only" ON public.system_settings;
CREATE POLICY "Allow all for admin users only"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.system_settings TO authenticated, anon;


