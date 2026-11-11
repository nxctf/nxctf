#!/usr/bin/env bash
# ==============================================================================
# NXCTF - User & Admin CLI Creator
# ==============================================================================
# Usage:
#   bash backend/create-user.sh <username> <email> <password> [--admin]
# Example:
#   bash backend/create-user.sh admin admin@nxctf.local Admin123! --admin
#   bash backend/create-user.sh player1 player1@nxctf.local Player123!
# ==============================================================================
set -e

USERNAME="$1"
EMAIL="$2"
PASSWORD="$3"
ROLE_FLAG="$4"

if [ -z "$USERNAME" ] || [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: bash backend/create-user.sh <username> <email> <password> [--admin]"
  echo "Example:"
  echo "  bash backend/create-user.sh admin admin@nxctf.local password123 --admin"
  exit 1
fi

IS_ADMIN="false"
if [ "$ROLE_FLAG" == "--admin" ] || [ "$ROLE_FLAG" == "admin" ] || [ "$ROLE_FLAG" == "true" ]; then
  IS_ADMIN="true"
fi

echo "Creating user '$USERNAME' ($EMAIL) [Admin: $IS_ADMIN]..."

docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<EOF
DO \$\$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_username TEXT := trim('$USERNAME');
  v_email TEXT := trim(lower('$EMAIL'));
  v_password TEXT := '$PASSWORD';
  v_is_admin BOOLEAN := $IS_ADMIN;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE lower(username) = lower(v_username)) THEN
    RAISE EXCEPTION 'Username "%" sudah terdaftar', v_username;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'Email "%" sudah terdaftar', v_email;
  END IF;

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, email_change_token_current,
    email_change_confirm_status, recovery_token, reauthentication_token,
    phone, phone_change, phone_change_token, is_sso_user, is_anonymous
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('username', v_username)::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    '', '', '', '', 0, '', '', NULL, '', '', false, false
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    json_build_object('sub', v_user_id::text, 'email', v_email)::jsonb,
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.users (id, username, is_admin, created_at, updated_at)
  VALUES (v_user_id, v_username, v_is_admin, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();

  RAISE NOTICE 'User berhasil dibuat! ID: %, Username: %, Email: %, Admin: %', v_user_id, v_username, v_email, v_is_admin;
END \$\$;
EOF

