-- ==============================================
-- Queries: challenge_flags
-- Source: sql/chema.sql
-- ==============================================

ALTER TABLE public.challenge_flags DROP CONSTRAINT IF EXISTS challenge_flags_flag_hash_key;
ALTER TABLE public.challenge_flags DROP COLUMN IF EXISTS flag_hash;

-- SELECT
CREATE OR REPLACE FUNCTION get_flag(p_challenge_id uuid)
RETURNS text AS $$
DECLARE
  v_flag text;
BEGIN
  IF NOT can_manage_challenge(p_challenge_id) THEN
    RAISE EXCEPTION 'Only admin can see flag';
  END IF;

  SELECT flag INTO v_flag
  FROM public.challenge_flags
  WHERE challenge_id = p_challenge_id;

  RETURN v_flag;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION get_flag(p_challenge_id uuid) TO authenticated;

DROP TRIGGER IF EXISTS trigger_auto_flag_hash ON public.challenge_flags;
DROP FUNCTION IF EXISTS auto_update_flag_hash();
DROP FUNCTION IF EXISTS generate_flag_hash(TEXT);

-- RLS
ALTER TABLE public.challenge_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenge flags admin all" ON public.challenge_flags;
CREATE POLICY "Challenge flags admin all"
  ON public.challenge_flags
  FOR ALL
  USING (is_admin() OR can_manage_challenge(challenge_id))
  WITH CHECK (is_admin() OR can_manage_challenge(challenge_id));

-- RELOCATED FUNCTIONS

CREATE OR REPLACE FUNCTION public.get_flag_placeholder(p_flag TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_result TEXT := '';
    v_char TEXT;
    i INT;
BEGIN
    IF p_flag IS NULL THEN RETURN NULL; END IF;

    FOR i IN 1..length(p_flag) LOOP
        v_char := substr(p_flag, i, 1);
        IF v_char ~ '[a-z]' THEN
            v_result := v_result || 'x';
        ELSIF v_char ~ '[A-Z]' THEN
            v_result := v_result || 'X';
        ELSIF v_char ~ '[0-9]' THEN
            v_result := v_result || '0';
        ELSIF v_char = '_' THEN
            v_result := v_result || '_';
        ELSIF v_char = '{' THEN
            v_result := v_result || '{';
        ELSIF v_char = '}' THEN
            v_result := v_result || '}';
        ELSE
            v_result := v_result || '?';
        END IF;
    END LOOP;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_flag_placeholder(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_challenge_placeholder(p_challenge_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
    v_flag TEXT;
    v_show_placeholder BOOLEAN;
BEGIN
    SELECT c.flag_placeholder, cf.flag
    INTO v_show_placeholder, v_flag
    FROM public.challenges c
    JOIN public.challenge_flags cf ON cf.challenge_id = c.id
    WHERE c.id = p_challenge_id;

    IF v_show_placeholder THEN
        RETURN public.get_flag_placeholder(v_flag);
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_placeholder(UUID) TO authenticated;
