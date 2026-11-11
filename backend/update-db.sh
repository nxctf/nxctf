#!/usr/bin/env bash
# ==============================================================================
# NXCTF - Apply Database Queries Update (db/update_queries.sql)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$PROJECT_ROOT/db"

echo "Applying update_queries.sql to PostgreSQL..."
docker exec -i supabase-db psql -U postgres -d postgres < "$DB_DIR/update_queries.sql"
echo "Successfully updated database queries!"

