#!/usr/bin/env bash
# Per-boot reconciliation: bring up PostgreSQL and make sure the app role/db
# exist. Idempotent and safe to run on every start.
set -euo pipefail

PG_VER="$(ls /usr/lib/postgresql 2>/dev/null | sort -V | tail -1)"
if [ -z "$PG_VER" ]; then
  echo "[start] PostgreSQL is not installed — did install.sh run?" >&2
  exit 1
fi

# Start the cluster (a no-op if it is already running).
sudo pg_ctlcluster "$PG_VER" main start 2>/dev/null || true

# Wait for the server to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

# Ensure the application role and database exist.
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='elysian'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE elysian LOGIN PASSWORD 'elysian';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='elysian'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE elysian OWNER elysian;"

echo "[start] PostgreSQL ${PG_VER} ready on localhost:5432 (db=elysian)"
