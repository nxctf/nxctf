-- ==============================================
-- Table: sub_categories
-- ==============================================

CREATE TABLE IF NOT EXISTS public.sub_categories (
  name VARCHAR(64) PRIMARY KEY,
  description TEXT DEFAULT '',
  sort_order INTEGER
);

-- Enable RLS
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.sub_categories TO authenticated, anon;
