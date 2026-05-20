-- ==============================================
-- Table: users
-- ==============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(32) UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  bio VARCHAR(255) DEFAULT '',
  sosmed JSONB DEFAULT '{}'::jsonb,
  profile_picture_url VARCHAR(2048) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
