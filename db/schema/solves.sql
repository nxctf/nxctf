-- ==============================================
-- Table: solves
-- ==============================================

CREATE TABLE public.solves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_solves_challenge_id ON public.solves(challenge_id);
CREATE INDEX IF NOT EXISTS idx_solves_created_at ON public.solves(created_at);

ALTER PUBLICATION supabase_realtime
ADD TABLE public.solves;
