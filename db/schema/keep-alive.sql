-- ==============================================
-- Table: keep-alive
-- ==============================================

CREATE TABLE public."keep-alive" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
