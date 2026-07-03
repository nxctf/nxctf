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
  ('disable_edit_username', 'false', 'Disable editing username'),
  ('disable_signup', 'false', 'Disable new user registrations'),
  ('disable_default_challenges', 'false', 'Disable default/main challenges (not bound to any event)'),
  ('max_team_members', '5', 'Maximum number of members allowed per team')
ON CONFLICT (key) DO NOTHING;

SELECT cleanup_orphaned_users_and_solves();

-- Sync challenges solve count
SELECT public.sync_challenge_solves();
