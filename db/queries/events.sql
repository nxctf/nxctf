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
  p_image_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can add event';
  END IF;

  INSERT INTO public.events(name, description, start_time, end_time, always_show_challenges, image_url)
  VALUES (p_name, COALESCE(p_description, ''), p_start_time, p_end_time, COALESCE(p_always_show_challenges, FALSE), p_image_url)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_event(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT) TO authenticated;

-- UPDATE
CREATE OR REPLACE FUNCTION update_event(
  p_event_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_always_show_challenges BOOLEAN DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can update event';
  END IF;

  UPDATE public.events
  SET name = COALESCE(p_name, name),
      description = COALESCE(p_description, description),
      start_time = p_start_time,
      end_time = p_end_time,
      always_show_challenges = COALESCE(p_always_show_challenges, always_show_challenges),
      image_url = COALESCE(p_image_url, image_url),
      join_mode = COALESCE(join_mode, 'open'),
      updated_at = now()
  WHERE id = p_event_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_event(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION set_challenges_event(
  p_event_id UUID,
  p_challenge_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can update challenges event';
  END IF;

  UPDATE public.challenges
  SET event_id = p_event_id,
      updated_at = now()
  WHERE id = ANY(p_challenge_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_challenges_event(UUID, UUID[]) TO authenticated;

-- DELETE
CREATE OR REPLACE FUNCTION delete_event(
  p_event_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admin can delete event';
  END IF;

  DELETE FROM public.events WHERE id = p_event_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_event(UUID) TO authenticated;

-- RLS/POLICY
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events can select all" ON public.events;
CREATE POLICY "Events can select all"
  ON public.events
  FOR SELECT
  USING (true);
