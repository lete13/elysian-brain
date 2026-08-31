#!/usr/bin/env bash
# Idempotent dependency refresh for the Elysian Clearing app.
# The app code lives in the separate `elysian-clearing` repo; this repo
# (elysian-brain) only holds the Cloud Agent environment config, so we locate
# (and, if a fresh boot has not checked it out, clone) the app repo next to us.
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_DIR="$(dirname "$BRAIN_DIR")"
CLEARING_DIR="$REPOS_DIR/elysian-clearing"

# 1) Ensure the app repo is present.
if [ ! -d "$CLEARING_DIR/.git" ]; then
  echo "[install] elysian-clearing not found — cloning next to elysian-brain"
  ORIGIN="$(git -C "$BRAIN_DIR" remote get-url origin)"
  CLEARING_URL="${ORIGIN%elysian-brain*}elysian-clearing"
  case "$CLEARING_URL" in
    *elysian-clearing) ;;
    *) CLEARING_URL="https://github.com/lete13/elysian-clearing" ;;
  esac
  git clone "$CLEARING_URL" "$CLEARING_DIR"
fi

# 2) System dependency: PostgreSQL (only installed if missing).
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "[install] installing PostgreSQL"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib
fi

# 3) App dependencies (package-lock.json is gitignored, so use npm install).
echo "[install] installing npm dependencies for elysian-clearing"
cd "$CLEARING_DIR"
npm install

echo "[install] done"
