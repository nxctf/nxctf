#!/usr/bin/env bash
# ==============================================================================
# NXCTF - Seed Test Events & Challenges (db/seed/test_challenges.sql)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$PROJECT_ROOT/db"

echo "Applying db/seed/test_challenges.sql to PostgreSQL..."
docker exec -i supabase-db psql -U postgres -d postgres < "$DB_DIR/seed/test_challenges.sql"
echo "Successfully seeded test challenges & events!"

