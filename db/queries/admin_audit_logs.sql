-- ==============================================
-- Queries: admin_audit_logs
-- ==============================================

CREATE OR REPLACE FUNCTION public.audit_log_strip_sensitive(p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_key TEXT;
  v_value JSONB;
BEGIN
  IF p_data IS NULL OR jsonb_typeof(p_data) <> 'object' THEN
    RETURN p_data;
  END IF;

  FOR v_key, v_value IN SELECT key, value FROM jsonb_each(p_data)
  LOOP
    IF lower(v_key) ~ '(password|token|session|secret|credential|flag|join_key|key)$'
      OR lower(v_key) IN ('flag', 'flag_hash', 'join_key', 'services')
    THEN
      CONTINUE;
    END IF;

    v_result := v_result || jsonb_build_object(v_key, v_value);
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_log_changed_fields(
  p_before JSONB,
  p_after JSONB
)
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  WITH keys AS (
    SELECT key FROM jsonb_object_keys(COALESCE(p_before, '{}'::jsonb)) AS key
    UNION
    SELECT key FROM jsonb_object_keys(COALESCE(p_after, '{}'::jsonb)) AS key
  )
  SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::TEXT[])
  FROM keys
  WHERE COALESCE(p_before->key, 'null'::jsonb) IS DISTINCT FROM COALESCE(p_after->key, 'null'::jsonb);
$$;

CREATE OR REPLACE FUNCTION public.get_request_headers()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_headers TEXT;
BEGIN
  v_headers := current_setting('request.headers', true);
  IF v_headers IS NULL OR v_headers = '' THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN v_headers::jsonb;
EXCEPTION WHEN others THEN
  RETURN '{}'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.write_admin_audit_log(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_before_data JSONB DEFAULT NULL,
  p_after_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_user_id UUID := auth.uid()::uuid;
  v_actor_snapshot TEXT;
  v_actor_role TEXT := 'admin';
  v_headers JSONB := public.get_request_headers();
  v_log_id UUID;
  v_before JSONB := public.audit_log_strip_sensitive(p_before_data);
  v_after JSONB := public.audit_log_strip_sensitive(p_after_data);
  v_changed_fields TEXT[];
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot write admin audit log without authenticated actor';
  END IF;

  IF NOT public.has_admin_access() THEN
    RAISE EXCEPTION 'Only admin can write admin audit logs';
  END IF;

  SELECT COALESCE(u.username::TEXT, au.email::TEXT, v_actor_user_id::TEXT)
  INTO v_actor_snapshot
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  WHERE u.id = v_actor_user_id;

  IF public.is_admin() THEN
    v_actor_role := 'global_admin';
  ELSE
    v_actor_role := 'admin';
  END IF;

  v_changed_fields := public.audit_log_changed_fields(v_before, v_after);

  IF v_before IS NOT NULL AND v_after IS NOT NULL AND array_length(v_changed_fields, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.admin_audit_logs(
    actor_user_id,
    actor_snapshot,
    actor_role,
    action,
    entity_type,
    entity_id,
    changed_fields,
    before_data,
    after_data,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    v_actor_user_id,
    COALESCE(v_actor_snapshot, v_actor_user_id::TEXT),
    v_actor_role,
    upper(btrim(p_action)),
    lower(btrim(p_entity_type)),
    p_entity_id,
    v_changed_fields,
    v_before,
    v_after,
    COALESCE(p_metadata, '{}'::jsonb),
    COALESCE(v_headers->>'x-forwarded-for', v_headers->>'cf-connecting-ip', v_headers->>'real-ip'),
    v_headers->>'user-agent'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.write_admin_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.write_admin_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, JSONB) FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_audit_logs(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_actor_user_id UUID DEFAULT NULL,
  p_actor_search TEXT DEFAULT NULL,
  p_actions TEXT[] DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  actor_user_id UUID,
  actor_snapshot TEXT,
  actor_role TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  changed_fields TEXT[],
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admin can view admin audit logs';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT aal.*
    FROM public.admin_audit_logs aal
    WHERE (p_actor_user_id IS NULL OR aal.actor_user_id = p_actor_user_id)
      AND (
        p_actor_search IS NULL
        OR btrim(p_actor_search) = ''
        OR aal.actor_snapshot ILIKE '%' || btrim(p_actor_search) || '%'
      )
      AND (
        p_actions IS NULL
        OR EXISTS (
          SELECT 1
          FROM unnest(p_actions) AS action_filter(value)
          WHERE aal.action = upper(action_filter.value)
        )
      )
      AND (p_entity_type IS NULL OR aal.entity_type = lower(btrim(p_entity_type)))
      AND (p_entity_id IS NULL OR aal.entity_id = p_entity_id)
      AND (p_from IS NULL OR aal.created_at >= p_from)
      AND (p_to IS NULL OR aal.created_at <= p_to)
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total_count FROM filtered
  )
  SELECT
    f.id,
    f.actor_user_id,
    f.actor_snapshot,
    f.actor_role,
    f.action,
    f.entity_type,
    f.entity_id,
    f.changed_fields,
    f.before_data,
    f.after_data,
    f.metadata,
    f.ip_address,
    f.user_agent,
    f.created_at,
    c.total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_audit_logs(INT, INT, UUID, TEXT, TEXT[], TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_audit_entity_snapshot(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_entity_type TEXT := lower(btrim(COALESCE(p_entity_type, '')));
  v_snapshot JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only global admin can view admin audit entity snapshots';
  END IF;

  IF p_entity_id IS NULL THEN
    RETURN NULL;
  END IF;

  CASE v_entity_type
    WHEN 'challenge' THEN
      SELECT to_jsonb(c) INTO v_snapshot
      FROM public.challenges c
      WHERE c.id = p_entity_id;
    WHEN 'event' THEN
      SELECT to_jsonb(e) - 'join_key' INTO v_snapshot
      FROM public.events e
      WHERE e.id = p_entity_id;
    WHEN 'event_join_request' THEN
      SELECT to_jsonb(ejr) INTO v_snapshot
      FROM public.event_join_requests ejr
      WHERE ejr.id = p_entity_id;
    WHEN 'solve' THEN
      SELECT to_jsonb(s) INTO v_snapshot
      FROM public.solves s
      WHERE s.id = p_entity_id;
    WHEN 'user' THEN
      SELECT to_jsonb(u) INTO v_snapshot
      FROM public.users u
      WHERE u.id = p_entity_id;
    ELSE
      v_snapshot := NULL;
  END CASE;

  RETURN public.audit_log_strip_sensitive(v_snapshot);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_audit_entity_snapshot(TEXT, UUID) TO authenticated;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_audit_logs FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_audit_logs FROM anon;
REVOKE ALL ON TABLE public.admin_audit_logs FROM authenticated;

DROP POLICY IF EXISTS "Admin audit logs select global admin" ON public.admin_audit_logs;
CREATE POLICY "Admin audit logs select global admin"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.is_admin());

-- RELOCATED FUNCTIONS

CREATE OR REPLACE FUNCTION public.get_auth_audit_logs(
  p_limit int default 50,
  p_offset int default 0,
  p_action_filters text[] default null
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  ip_address text,
  payload jsonb,
  user_id uuid,
  username text,
  email text
)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can view audit logs';
  END IF;

  RETURN QUERY
  WITH audit_rows AS (
    SELECT
      ale.id,
      ale.created_at,
      ale.ip_address::text AS ip_address,
      ale.payload::jsonb AS payload,
      NULLIF(COALESCE(
        ale.payload->>'actor_id',
        ale.payload->>'user_id',
        ale.payload->'traits'->>'user_id'
      ), '') AS payload_user_id,
      NULLIF(COALESCE(
        ale.payload->'traits'->>'user_email',
        ale.payload->>'actor_username',
        ale.payload->>'email'
      ), '') AS payload_email
    FROM auth.audit_log_entries ale
    WHERE (p_action_filters IS NULL OR ale.payload->>'action' = ANY(p_action_filters))
  )
  SELECT
    ar.id,
    ar.created_at,
    ar.ip_address,
    ar.payload,
    au.id,
    u.username::text,
    au.email::text
  FROM audit_rows ar
  LEFT JOIN auth.users au
    ON (
      ar.payload_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND au.id = ar.payload_user_id::uuid
    )
    OR (
      ar.payload_email IS NOT NULL
      AND lower(au.email) = lower(ar.payload_email)
    )
  LEFT JOIN public.users u ON u.id = au.id
  ORDER BY ar.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

grant execute on function public.get_auth_audit_logs(int, int, text[]) to authenticated;
