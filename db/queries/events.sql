-- ==============================================
-- Queries: events
-- Source: sql/chema.sql
-- ==============================================

-- INSERT
CREATE OR REPLACE FUNCTION add_event(
  p_name TEXT,
  p_description TEXT DEFAULT '',
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_always_show_challenges BOOLEAN DEFAULT FALSE,
  p_image_url TEXT DEFAULT NULL,
  p_join_mode TEXT DEFAULT 'open',
  p_join_key TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_join_mode TEXT := lower(trim(COALESCE(p_join_mode, 'open')));
  v_join_key TEXT := NULLIF(trim(COALESCE(p_join_key, '')), '');
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can add event';
  END IF;

  IF v_join_mode NOT IN ('open', 'request', 'key') THEN
    RAISE EXCEPTION 'join_mode must be open, request, or key';
  END IF;

  IF v_join_mode = 'key' AND v_join_key IS NULL THEN
    RAISE EXCEPTION 'join_key is required for key mode';
  END IF;

  IF EXISTS (SELECT 1 FROM public.events WHERE LOWER(name) = LOWER(p_name)) THEN
    RAISE EXCEPTION 'Event with this name already exists';
  END IF;

  INSERT INTO public.events(name, description, start_time, end_time, always_show_challenges, image_url, join_mode, join_key)
  VALUES (
    p_name,
    COALESCE(p_description, ''),
    p_start_time,
    p_end_time,
    COALESCE(p_always_show_challenges, FALSE),
    p_image_url,
    v_join_mode,
    CASE WHEN v_join_mode = 'key' THEN v_join_key ELSE NULL END
  )
  RETURNING id INTO v_event_id;

  PERFORM public.write_admin_audit_log(
    'CREATE',
    'event',
    v_event_id,
    NULL,
    jsonb_build_object(
      'name', p_name,
      'description', COALESCE(p_description, ''),
      'start_time', p_start_time,
      'end_time', p_end_time,
      'always_show_challenges', COALESCE(p_always_show_challenges, FALSE),
      'image_url', p_image_url,
      'join_mode', v_join_mode,
      'has_join_key', (v_join_mode = 'key')
    ),
    '{}'::jsonb
  );

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION add_event(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;

-- UPDATE
CREATE OR REPLACE FUNCTION update_event(
  p_event_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_always_show_challenges BOOLEAN DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_join_mode TEXT DEFAULT NULL,
  p_join_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_before JSONB;
  v_after JSONB;
  v_join_mode TEXT := lower(trim(COALESCE(p_join_mode, '')));
  v_join_key TEXT := NULLIF(trim(COALESCE(p_join_key, '')), '');
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can update event';
  END IF;

  IF p_name IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.events WHERE LOWER(name) = LOWER(p_name) AND id != p_event_id
  ) THEN
    RAISE EXCEPTION 'Event with this name already exists';
  END IF;

  IF v_join_mode <> '' AND v_join_mode NOT IN ('open', 'request', 'key') THEN
    RAISE EXCEPTION 'join_mode must be open, request, or key';
  END IF;

  IF v_join_mode = 'key' AND v_join_key IS NULL AND (
    SELECT join_key FROM public.events WHERE id = p_event_id
  ) IS NULL THEN
    RAISE EXCEPTION 'join_key is required for key mode';
  END IF;

  SELECT jsonb_build_object(
    'name', e.name,
    'description', e.description,
    'start_time', e.start_time,
    'end_time', e.end_time,
    'always_show_challenges', e.always_show_challenges,
    'image_url', e.image_url,
    'join_mode', e.join_mode,
    'has_join_key', e.join_key IS NOT NULL
  )
  INTO v_before
  FROM public.events e
  WHERE e.id = p_event_id;

  UPDATE public.events
  SET name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      start_time = p_start_time,
      end_time = p_end_time,
      always_show_challenges = COALESCE(p_always_show_challenges, always_show_challenges),
      image_url = COALESCE(p_image_url, image_url),
      join_mode = CASE WHEN v_join_mode <> '' THEN v_join_mode ELSE join_mode END,
      join_key = CASE 
        WHEN (v_join_mode = 'key' OR (v_join_mode = '' AND join_mode = 'key')) THEN COALESCE(v_join_key, join_key)
        ELSE NULL 
      END,
      updated_at = now()
  WHERE id = p_event_id;

  SELECT jsonb_build_object(
    'name', e.name,
    'description', e.description,
    'start_time', e.start_time,
    'end_time', e.end_time,
    'always_show_challenges', e.always_show_challenges,
    'image_url', e.image_url,
    'join_mode', e.join_mode,
    'has_join_key', e.join_key IS NOT NULL
  )
  INTO v_after
  FROM public.events e
  WHERE e.id = p_event_id;

  PERFORM public.write_admin_audit_log(
    'UPDATE',
    'event',
    p_event_id,
    v_before,
    v_after,
    '{}'::jsonb
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION update_event(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION delete_event(
  p_event_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_before JSONB;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can delete event';
  END IF;

  SELECT jsonb_build_object(
    'name', e.name,
    'description', e.description,
    'start_time', e.start_time,
    'end_time', e.end_time,
    'always_show_challenges', e.always_show_challenges,
    'image_url', e.image_url,
    'join_mode', e.join_mode
  )
  INTO v_before
  FROM public.events e
  WHERE e.id = p_event_id;

  DELETE FROM public.events WHERE id = p_event_id;

  PERFORM public.write_admin_audit_log(
    'DELETE',
    'event',
    p_event_id,
    v_before,
    NULL,
    '{}'::jsonb
  );
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION delete_event(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events can select all" ON public.events;
CREATE POLICY "Events can select all"
  ON public.events
  FOR SELECT
  USING (true);
