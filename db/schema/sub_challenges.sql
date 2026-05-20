-- ==============================================
-- Table: sub_challenges
-- ==============================================

CREATE TABLE public.sub_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer VARCHAR(255) NOT NULL,
  order_number INTEGER NOT NULL CHECK (order_number > 0),
  is_sequential BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT sub_challenges_challenge_id_order_number_key UNIQUE (challenge_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_sub_challenges_challenge_id
  ON public.sub_challenges(challenge_id);
