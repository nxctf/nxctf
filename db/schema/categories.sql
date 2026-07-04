-- ==============================================
-- Table: categories
-- ==============================================

CREATE TABLE IF NOT EXISTS public.categories (
  name VARCHAR(64) PRIMARY KEY,
  description TEXT DEFAULT '',
  icon VARCHAR(64) DEFAULT 'Puzzle',
  color VARCHAR(32) DEFAULT 'blue',
  sort_order INTEGER
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.categories TO authenticated, anon;
