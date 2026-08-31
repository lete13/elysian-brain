#!/usr/bin/env bash
# Long-running terminal: the Elysian Clearing server.
# Reads config from the environment, falling back to local-dev defaults.
# Optional integrations (Hosthub, Viva, SMTP) stay off unless their secrets
# are provided; the app runs fine without them.
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_DIR="$(dirname "$BRAIN_DIR")"
cd "$REPOS_DIR/elysian-clearing"

# "localhost" in the URL makes server.js disable SSL for the local cluster.
export DATABASE_URL="${DATABASE_URL:-postgresql://elysian:elysian@localhost:5432/elysian}"
export APP_PASSWORD="${APP_PASSWORD:-elysian2025}"
export PORT="${PORT:-3000}"

exec node srv-boot.js
