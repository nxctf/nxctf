#!/usr/bin/env bash
# ==============================================================================
# NXCTF - Supabase Self-Hosted Automated Setup & Database Migrator
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPABASE_DIR="$SCRIPT_DIR/supabase"
DB_DIR="$PROJECT_ROOT/db"

VM_IP="192.168.56.101"
API_PORT="8088"
STUDIO_PORT="8088"
APP_PORT="3000"

echo "============================================================"
echo " [NXCTF] Setting up Self-Hosted Supabase & PostgreSQL DB    "
echo "============================================================"

cd "$SUPABASE_DIR"

# 1. Initialize .env if not exists
if [ ! -f .env ]; then
  echo "[1/6] Copying .env.example -> .env..."
  cp .env.example .env
fi

# 2. Generate secrets and keys if needed
if ! grep -q "^JWT_SECRET=" .env || grep -q "^JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long" .env; then
  echo "[2/6] Generating cryptographic keys..."
  sh utils/generate-keys.sh --update-env
  sh utils/add-new-auth-keys.sh --update-env
fi

# 3. Configure URLs and flags for local/VM dev mode
echo "[3/6] Configuring endpoints and auth rules..."
set_env() {
  key="$1"
  val="$2"
  if grep -q "^$key=" .env; then
    sed -i "s|^$key=.*|$key=$val|" .env
  else
    echo "$key=$val" >> .env
  fi
}

set_env SUPABASE_PUBLIC_URL "http://${VM_IP}:${API_PORT}"
set_env API_EXTERNAL_URL "http://${VM_IP}:${API_PORT}/auth/v1"
set_env SITE_URL "http://${VM_IP}:${APP_PORT}"
set_env ADDITIONAL_REDIRECT_URLS "http://localhost:${APP_PORT},http://127.0.0.1:${APP_PORT},http://${VM_IP}:${APP_PORT}"
set_env ENABLE_EMAIL_AUTOCONFIRM "true"
set_env ENABLE_PHONE_SIGNUP "false"
set_env ENABLE_PHONE_AUTOCONFIRM "false"
set_env DISABLE_SIGNUP "false"
set_env API_GW_HTTP_PORT "0.0.0.0:${API_PORT}"
set_env POSTGRES_PORT "5432"

# 4. Start Docker Compose
echo "[4/6] Starting Supabase containers with Docker Compose..."
docker compose up -d

# 5. Wait for PostgreSQL to be ready
echo "[5/6] Waiting for PostgreSQL database to be ready..."
RETRIES=30
until docker exec supabase-db pg_isready -U postgres -d postgres >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Waiting for postgres... ($RETRIES remaining)"
  sleep 2
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo "Error: Timed out waiting for database."
  exit 1
fi
echo "PostgreSQL is ready!"

# 6. Apply db/init.sql
echo "[6/6] Migrating database using db/init.sql..."
if [ -f "$DB_DIR/init.sql" ]; then
  docker exec -i supabase-db psql -U postgres -d postgres < "$DB_DIR/init.sql"
  echo "Database initialized with db/init.sql successfully!"
else
  echo "Warning: $DB_DIR/init.sql not found!"
fi

# Extract API Keys
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2- | tr -d '\r')
PUB_KEY=$(grep '^SUPABASE_PUBLISHABLE_KEY=' .env | cut -d= -f2- | tr -d '\r')

# Fallback to ANON_KEY if publishable key is not set
CLIENT_KEY="${PUB_KEY:-$ANON_KEY}"

# Write/Update root .env.local for Next.js
ENV_LOCAL="$PROJECT_ROOT/.env.local"
echo "Updating $ENV_LOCAL..."

# Preserve existing NXCTL tokens from .env.local if already configured
EXISTING_NXCTL_TOKEN=$(grep '^NXCTL_API_TOKEN=' "$ENV_LOCAL" 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)
EXISTING_NXCTL_SECRET=$(grep '^NXCTL_API_ADMIN_SECRET=' "$ENV_LOCAL" 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)

cat <<EOF > "$ENV_LOCAL"
NEXT_PUBLIC_MAINTENANCE_MODE=auto
NEXT_PUBLIC_SITE_URL=http://${VM_IP}:${APP_PORT}
NEXT_PUBLIC_SUPABASE_URL=http://${VM_IP}:${API_PORT}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${CLIENT_KEY}
NEXT_PUBLIC_TURNSTILE_MODE=custom
NEXT_PUBLIC_SAWERIA_API_URL=https://saweria.nxctf.my.id/
NXCTL_API_URL=https://nxctl.nxctf.my.id
NXCTL_API_TOKEN=${EXISTING_NXCTL_TOKEN:-your_api_token}
NXCTL_API_ADMIN_SECRET=${EXISTING_NXCTL_SECRET:-your_admin_secret}
EOF

echo ""
echo "============================================================"
echo " [SUCCESS] NXCTF Backend & Database Setup Completed!        "
echo "============================================================"
echo " - Supabase Studio:  http://${VM_IP}:${API_PORT}"
echo " - Supabase API:     http://${VM_IP}:${API_PORT}/rest/v1/"
echo " - Supabase Auth:    http://${VM_IP}:${API_PORT}/auth/v1/"
echo " - PostgreSQL Host:  ${VM_IP}:5432 (user: postgres)"
echo " - Frontend URL:     http://${VM_IP}:${APP_PORT}"
echo " - Publishable Key:  ${CLIENT_KEY}"
echo ""
echo "To apply query updates later without resetting data:"
echo "  bash backend/update-db.sh"
echo ""
echo "To seed test challenges & events:"
echo "  bash backend/seed-test.sh"
echo "============================================================"

