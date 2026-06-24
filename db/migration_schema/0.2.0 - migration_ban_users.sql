-- Migration: Add Ban Columns to users table (Schema Only)
-- Target schema: public

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL;
