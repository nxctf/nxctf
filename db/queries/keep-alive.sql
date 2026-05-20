-- ==============================================
-- Queries: keep-alive
-- Source: sql/chema.sql
-- ==============================================

ALTER TABLE public."keep-alive" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all users full access" ON public."keep-alive";

CREATE POLICY "Allow all users full access"
  ON public."keep-alive"
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public."keep-alive" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."keep-alive" TO authenticated;
