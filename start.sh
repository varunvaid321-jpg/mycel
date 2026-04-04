#!/bin/sh
set -e

echo "=== Mycel startup ==="
echo "DATABASE_URL=$DATABASE_URL"
echo "Checking /data mount..."
ls -la /data/ 2>/dev/null || echo "/data not found"

echo "Starting server..."
exec node server.js
