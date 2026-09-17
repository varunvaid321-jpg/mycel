#!/bin/sh
# One-time rescue: pull mycel's real data off the Render persistent disk
# into this Mac, losslessly. Run AFTER Render billing is restored and the
# mycel service is live again.
#
# Copies the raw SQLite file + images so NOTHING is lost -- including
# archived entries, original dates, categories, tags and links, which the
# /api/import path would silently rewrite.
#
# Prereq: an SSH key of yours registered on Render (dashboard > Account >
# SSH Keys), since Render's public API has no ssh-keys endpoint.
set -e

SSH_ADDR="srv-d6urbjeuk2gs738dbkog@ssh.oregon.render.com"
STAMP=$(date +%Y-%m-%d-%H%M)
STAGE="$HOME/mycel-rescue-$STAMP"
DEST="/Users/varunvaid/mycel/data"

echo "=== 1. checking the service is awake ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 https://mycel-t481.onrender.com/login || true)
echo "mycel-t481.onrender.com -> HTTP $code"
if [ "$code" != "200" ]; then
  echo "ABORT: service is not serving (needs billing restored + a deploy). Nothing copied."
  exit 1
fi

mkdir -p "$STAGE/images"

echo "=== 2. snapshotting the remote DB (consistent copy) ==="
ssh "$SSH_ADDR" "sqlite3 /data/mycel.db \".backup '/tmp/mycel-snapshot.db'\" && ls -la /tmp/mycel-snapshot.db"
scp "$SSH_ADDR:/tmp/mycel-snapshot.db" "$STAGE/mycel.db"

echo "=== 3. copying images ==="
ssh "$SSH_ADDR" "cd /data && tar czf /tmp/mycel-images.tgz images 2>/dev/null; ls -la /tmp/mycel-images.tgz"
scp "$SSH_ADDR:/tmp/mycel-images.tgz" "$STAGE/images.tgz"
tar xzf "$STAGE/images.tgz" -C "$STAGE" && rm -f "$STAGE/images.tgz"

echo "=== 4. verifying what we pulled ==="
R_ENTRIES=$(ssh "$SSH_ADDR" "sqlite3 /data/mycel.db 'select count(*) from Entry;'")
L_ENTRIES=$(sqlite3 "$STAGE/mycel.db" "select count(*) from Entry;")
R_IMGS=$(ssh "$SSH_ADDR" "find /data/images -type f 2>/dev/null | wc -l | tr -d ' '")
L_IMGS=$(find "$STAGE/images" -type f | wc -l | tr -d ' ')
echo "entries: remote=$R_ENTRIES local=$L_ENTRIES"
echo "images:  remote=$R_IMGS local=$L_IMGS"
[ "$R_ENTRIES" = "$L_ENTRIES" ] || { echo "ABORT: entry count mismatch. Nothing installed."; exit 1; }
[ "$R_IMGS" = "$L_IMGS" ]       || { echo "ABORT: image count mismatch. Nothing installed."; exit 1; }

echo "=== 5. installing into the local app ==="
launchctl stop com.varun.mycel 2>/dev/null || true
[ -f "$DEST/mycel.db" ] && cp "$DEST/mycel.db" "$DEST/mycel.db.pre-rescue-$STAMP"
cp "$STAGE/mycel.db" "$DEST/mycel.db"
mkdir -p "$DEST/images"
cp -R "$STAGE/images/." "$DEST/images/" 2>/dev/null || true
launchctl start com.varun.mycel 2>/dev/null || true

echo "=== 6. final local check ==="
sleep 6
echo "local entries: $(sqlite3 "$DEST/mycel.db" 'select count(*) from Entry;')"
echo "local images:  $(find "$DEST/images" -type f | wc -l | tr -d ' ')"
curl -s -o /dev/null -w "local app -> HTTP %{http_code}\n" -m 10 http://localhost:4000/login
echo
echo "Staging copy kept at: $STAGE"
echo "Only after you have opened the app and confirmed your entries and photos"
echo "are all present should the Render service and its disk be deleted."
