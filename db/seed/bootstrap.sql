-- ==============================================
-- Seed / Maintenance Helpers
-- ==============================================

-- Initial admin user setup (manual):
-- UPDATE public.users SET is_admin = true WHERE id = 'your-user-id';

-- One-off cleanup call from original script
SELECT cleanup_orphaned_users_and_solves();
