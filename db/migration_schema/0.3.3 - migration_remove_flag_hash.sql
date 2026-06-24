-- Migration: Remove flag_hash from challenge_flags table
-- Target schema: public

ALTER TABLE public.challenge_flags DROP CONSTRAINT IF EXISTS challenge_flags_flag_hash_key;
ALTER TABLE public.challenge_flags DROP COLUMN IF EXISTS flag_hash;

DROP TRIGGER IF EXISTS trigger_auto_flag_hash ON public.challenge_flags;
DROP FUNCTION IF EXISTS public.auto_update_flag_hash();
DROP FUNCTION IF EXISTS public.generate_flag_hash(TEXT);
