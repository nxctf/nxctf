#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "[NXCTF] Stopping Next.js dev server..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 1

if mountpoint -q "$PROJECT_ROOT/.next-dev"; then
  echo "[NXCTF] Unmounting .next-dev..."
  sudo umount -l "$PROJECT_ROOT/.next-dev" || true
fi

if mountpoint -q "$PROJECT_ROOT/node_modules"; then
  echo "[NXCTF] Unmounting native node_modules..."
  sudo umount -l "$PROJECT_ROOT/node_modules" || true
fi

if [ "${1:-}" = "--all" ]; then
  echo "[NXCTF] Stopping Supabase Docker containers..."
  cd "$SCRIPT_DIR/supabase"
  docker compose down
fi

echo "[NXCTF] Stopped cleanly."

