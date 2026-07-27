#!/usr/bin/env bash
set -e

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting: $*"
exec "$@"
