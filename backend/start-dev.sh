#!/usr/bin/env bash
# ==============================================================================
# NXCTF - Start Next.js Dev Server in Vagrant VM (Fast Native Linux Ext4)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
fi

cd "$PROJECT_ROOT"

# Stop existing Next.js dev processes if running
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server.*14.2" 2>/dev/null || true
sleep 1

# 1. Native Linux node_modules (avoids 3-minute vboxsf bottleneck)
DEPS_DIR="/var/tmp/nxctf-deps"
mkdir -p "$DEPS_DIR"

if [ ! -d "$DEPS_DIR/node_modules/next" ]; then
  echo "[NXCTF] Preparing native Linux node_modules in $DEPS_DIR (one-time setup)..."
  cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package-lock.json" "$DEPS_DIR/"
  (cd "$DEPS_DIR" && npm ci --no-audit --no-fund --prefer-offline)
fi

mkdir -p "$PROJECT_ROOT/node_modules"
if ! mountpoint -q "$PROJECT_ROOT/node_modules"; then
  echo "[NXCTF] Mounting native ext4 node_modules ($DEPS_DIR/node_modules -> node_modules)..."
  sudo mount --bind "$DEPS_DIR/node_modules" "$PROJECT_ROOT/node_modules"
fi

# 2. Native Linux .next-dev cache (avoids vboxsf ETXTBSY)
mkdir -p /tmp/nxctf-next-dev
mkdir -p "$PROJECT_ROOT/.next-dev"

if ! mountpoint -q "$PROJECT_ROOT/.next-dev"; then
  echo "[NXCTF] Mounting native ext4 build cache (/tmp/nxctf-next-dev -> .next-dev)..."
  sudo mount --bind /tmp/nxctf-next-dev "$PROJECT_ROOT/.next-dev"
fi

# 3. Generate version & start Next.js dev server bound to 0.0.0.0:3000
node src/lib/scripts/gen-version.js
exec npx next dev -H 0.0.0.0
