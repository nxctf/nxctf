-- ==============================================
-- Global Reset Helpers
-- ==============================================

-- RESET ALL DATA
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE auth.identities CASCADE;
TRUNCATE TABLE auth.sessions CASCADE;
TRUNCATE TABLE auth.refresh_tokens CASCADE;
TRUNCATE TABLE auth.audit_log_entries CASCADE;
TRUNCATE TABLE auth.mfa_amr_claims CASCADE;
TRUNCATE TABLE auth.one_time_tokens CASCADE;

-- -- Drop all policies in public schema
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN
--     SELECT policyname, schemaname, tablename
--     FROM pg_policies
--     WHERE schemaname = 'public'
--   LOOP
--     EXECUTE format(
--       'DROP POLICY IF EXISTS %I ON %I.%I CASCADE;',
--       r.policyname, r.schemaname, r.tablename
--     );
--   END LOOP;
-- END $$;

-- -- Drop all functions in public schema
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN
--     SELECT p.oid::regprocedure::text AS funcsig
--     FROM pg_proc p
--     JOIN pg_namespace n ON p.pronamespace = n.oid
--     WHERE n.nspname = 'public'
--   LOOP
--     EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.funcsig);
--   END LOOP;
-- END $$;

-- -- Drop all views in public schema
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN
--     SELECT table_name
--     FROM information_schema.views
--     WHERE table_schema = 'public'
--   LOOP
--     EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE;', r.table_name);
--   END LOOP;
-- END $$;

-- -- Drop all triggers in public schema
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN
--     SELECT tgname, relname
--     FROM pg_trigger
--     JOIN pg_class c ON pg_trigger.tgrelid = c.oid
--     JOIN pg_namespace n ON c.relnamespace = n.oid
--     WHERE n.nspname = 'public' AND NOT tgisinternal
--   LOOP
--     EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE;', r.tgname, r.relname);
--   END LOOP;
-- END $$;

-- DROP VIEW IF EXISTS public.challenges_with_masked_flag CASCADE;
-- DROP TABLE IF EXISTS public.challenge_flags CASCADE;
-- DROP TABLE IF EXISTS public.solves CASCADE;
-- DROP TABLE IF EXISTS public.challenges CASCADE;
-- DROP TABLE IF EXISTS public.event_join_requests CASCADE;
-- DROP TABLE IF EXISTS public.event_participants CASCADE;
-- DROP TABLE IF EXISTS public.event_admins CASCADE;
-- DROP TABLE IF EXISTS public.events CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.team_members CASCADE;
-- DROP TABLE IF EXISTS public.teams CASCADE;
-- DROP TABLE IF EXISTS public."keep-alive" CASCADE;
