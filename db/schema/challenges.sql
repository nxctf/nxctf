-- ==============================================
-- Table: challenges
-- ==============================================

CREATE TABLE public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  points INTEGER NOT NULL,
  max_points INTEGER DEFAULT NULL,
  hint JSONB DEFAULT NULL,
  difficulty VARCHAR(32) NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_maintenance BOOLEAN DEFAULT false,
  is_dynamic BOOLEAN DEFAULT false,
  min_points INTEGER DEFAULT 0,
  decay_per_solve INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_solves INTEGER DEFAULT 0,
  flag_placeholder BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_challenges_event_id ON public.challenges(event_id);

-- ALTER TABLE public.challenges
-- ADD COLUMN flag_placeholder BOOLEAN DEFAULT false;

-- ALTER TABLE public.challenges
-- ADD COLUMN services TEXT[] DEFAULT ARRAY[]::TEXT[];
