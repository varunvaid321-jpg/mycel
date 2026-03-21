#!/bin/bash
# Daily Mycel database backup — runs on GCP VM via cron
# Downloads SQLite DB from Render and keeps last 30 copies

BACKUP_DIR="$HOME/mycel-backups"
PASSPHRASE="rizal23"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="mycel-backup-${TIMESTAMP}.db"
URL="https://www.amushroom.com/api/backup?key=${PASSPHRASE}"
STATUS_URL="https://www.amushroom.com/api/backup/status"

mkdir -p "$BACKUP_DIR"

# Download backup
HTTP_CODE=$(curl -s -o "$BACKUP_DIR/$FILENAME" -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" = "200" ] && [ -s "$BACKUP_DIR/$FILENAME" ]; then
  SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
  echo "[$(date)] Backup OK: $FILENAME ($SIZE)"

  # Report success to the app
  curl -s -X POST "$STATUS_URL" \
    -H "Content-Type: application/json" \
    -H "x-backup-key: $PASSPHRASE" \
    -d "{\"status\": \"ok\", \"filename\": \"$FILENAME\", \"size\": \"$SIZE\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /dev/null

  # Keep only last 30 backups
  cd "$BACKUP_DIR" && ls -t mycel-backup-*.db | tail -n +31 | xargs -r rm --
else
  echo "[$(date)] Backup FAILED: HTTP $HTTP_CODE"
  rm -f "$BACKUP_DIR/$FILENAME"

  # Report failure
  curl -s -X POST "$STATUS_URL" \
    -H "Content-Type: application/json" \
    -H "x-backup-key: $PASSPHRASE" \
    -d "{\"status\": \"failed\", \"error\": \"HTTP $HTTP_CODE\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /dev/null
fi
