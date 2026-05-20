-- ==============================================
-- Table: challenge_flags
-- ==============================================

CREATE TABLE public.challenge_flags (
  challenge_id UUID PRIMARY KEY REFERENCES public.challenges(id) ON DELETE CASCADE,
  flag VARCHAR(255) NOT NULL,
  flag_hash CHAR(64) UNIQUE NOT NULL
);
