#!/bin/sh
set -e

echo "=== Mycel startup ==="
echo "DATABASE_URL=$DATABASE_URL"
echo "Checking /data mount..."
ls -la /data/ 2>/dev/null || echo "/data not found"

echo "Running prisma db push..."
npx prisma db push --accept-data-loss --skip-generate 2>&1

echo "Starting Next.js on port ${PORT:-10000}..."
exec npx next start -p ${PORT:-10000}
