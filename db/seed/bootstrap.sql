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
  ('max_team_members', '5', 'Maximum number of members allowed per team'),
  ('discord_link', 'https://discord.gg/5etKks6aQQ', 'Community Discord invitation URL'),
  ('event_main_label', 'main', 'The label name for the main featured event'),
  ('event_main_image_url', 'https://raw.githubusercontent.com/nxctf/assets/refs/heads/main/event/active_nxctf.png', 'Banner image URL of the main featured event'),
  ('event_fallback_image_url', '', 'Default banner image URL fallback for events without one'),
  ('flag_format', 'NXCTF{your_flag_here}', 'The standard format for flag submission')
ON CONFLICT (key) DO NOTHING;

-- Seed default categories
INSERT INTO public.categories (name, icon, color, description, sort_order)
VALUES
  ('Intro', 'Lightbulb', 'gray', 'Pengenalan dan tutorial dasar platform.', 1),
  ('Linux', 'Terminal', 'blue', 'Tantangan terkait command line Linux dan administrasi sistem.', 2),
  ('Boot To Root', 'Shield', 'red', 'Tantangan penetrasi dan rooting sistem target.', 3),
  ('Web', 'Globe', 'blue', 'Exploitasi kerentanan aplikasi web (SQLi, XSS, RCE, dll).', 4),
  ('Forensics', 'Search', 'cyan', 'Analisis paket jaringan, memory dump, file header, dan log.', 5),
  ('AI', 'Brain', 'indigo', 'Prompt injection, jailbreaking, dan eksploitasi model ML.', 6),
  ('Osint', 'Eye', 'orange', 'Pencarian informasi berbasis open-source intelligence.', 7),
  ('Crypto', 'Lock', 'yellow', 'Pemecahan sandi, analisis cipher, dan kriptografi.', 8),
  ('Reverse', 'Cpu', 'purple', 'Analisis binary, decompiling, dan memahami logika aplikasi.', 9),
  ('Pwn', 'Bomb', 'red', 'Eksploitasi memory corruption, buffer overflow, dll.', 10),
  ('Stegnography', 'Image', 'pink', 'Menemukan informasi tersembunyi di dalam media gambar/audio.', 11),
  ('Misc', 'FolderOpen', 'emerald', 'Tantangan umum yang tidak masuk ke kategori khusus.', 12),
  ('Blockchain', 'Coins', 'yellow', 'Kerentanan smart contract dan ekosistem blockchain.', 13),
  ('Network', 'Network', 'blue', 'Analisis protokol jaringan dan penetrasi server.', 14)
ON CONFLICT (name) DO UPDATE
SET
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  description = EXCLUDED.description;

-- Seed default subcategories
INSERT INTO public.sub_categories (name, sort_order)
VALUES
  ('fundamentals', 1),
  ('intro', 2),
  ('user', 3),
  ('root', 4)
ON CONFLICT (name) DO NOTHING;

SELECT cleanup_orphaned_users_and_solves();

-- Sync challenges solve count
SELECT public.sync_challenge_solves();
