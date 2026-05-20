-- ==============================================
-- Table: solves_nonactive
-- ==============================================

CREATE TABLE IF NOT EXISTS public.solves_nonactive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
