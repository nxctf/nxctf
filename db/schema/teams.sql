-- ==============================================
-- Table: teams
-- ==============================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  captain_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
