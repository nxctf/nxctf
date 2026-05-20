-- ==============================================
-- Queries: challenge_flags
-- Source: sql/chema.sql
-- ==============================================

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
SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_flag(p_challenge_id uuid) TO authenticated;

-- UPDATE
CREATE OR REPLACE FUNCTION generate_flag_hash(flag_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(flag_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION auto_update_flag_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.flag_hash = generate_flag_hash(NEW.flag);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_flag_hash ON public.challenge_flags;
CREATE TRIGGER trigger_auto_flag_hash
  BEFORE INSERT OR UPDATE ON public.challenge_flags
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_flag_hash();

-- RLS
ALTER TABLE public.challenge_flags ENABLE ROW LEVEL SECURITY;
