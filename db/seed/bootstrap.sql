-- ==============================================
-- Seed / Maintenance Helpers
-- ==============================================

-- Initial admin user setup (manual):
-- UPDATE public.users SET is_admin = true WHERE id = 'your-user-id';

-- Seed default system configurations
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('disable_create_team', 'false', 'Disable team creation for participants'),
  ('disable_join_team', 'false', 'Disable joining/leaving teams for participants'),
  ('disable_edit_team', 'false', 'Disable editing team name'),
  ('disable_edit_username', 'false', 'Disable editing username')
ON CONFLICT (key) DO NOTHING;

SELECT cleanup_orphaned_users_and_solves();

-- Sync challenges solve count
SELECT public.sync_challenge_solves();

