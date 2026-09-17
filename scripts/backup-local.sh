#!/bin/sh
# Mycel local backup — replaces the dead GCP backup.
# Snapshots the SQLite DB (via .backup, safe while running) + all images.
# Keeps the last 30 daily snapshots.
set -e
cd "$(dirname "$0")/.."
set -a
. ./.env
set +a

STAMP=$(date +%Y-%m-%d)
DEST="$HOME/mycel-backups/$STAMP"
mkdir -p "$DEST/images"

# Consistent DB snapshot even if the server is mid-write
sqlite3 "$MYCEL_DATA_DIR/mycel.db" ".backup '$DEST/mycel.db'"

# Images
if [ -d "$MYCEL_DATA_DIR/images" ]; then
  rsync -a --delete "$MYCEL_DATA_DIR/images/" "$DEST/images/"
fi

ENTRIES=$(sqlite3 "$DEST/mycel.db" "select count(*) from Entry;")
IMGS=$(find "$DEST/images" -type f | wc -l | tr -d ' ')
echo "$(date '+%Y-%m-%d %H:%M:%S') backup OK -> $DEST (entries=$ENTRIES images=$IMGS)"

# Retain 30 most recent
cd "$HOME/mycel-backups"
ls -1d 20* 2>/dev/null | sort -r | tail -n +31 | while read -r old; do rm -rf "$old"; done
