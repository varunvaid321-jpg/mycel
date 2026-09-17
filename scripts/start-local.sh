#!/bin/sh
# Mycel local runner — loads .env then starts the production server.
# Used by the launchd agent (com.varun.mycel) and for manual starts.
set -e
cd "$(dirname "$0")/.."
set -a
. ./.env
set +a
mkdir -p "$MYCEL_DATA_DIR/images"
exec node server.js
