#!/usr/bin/env bash
# =====================================================================
# SmartEco — MySQL backup script
# Reads connection info from BackEnd/.env, dumps `defaultdb`, gzips it,
# and prunes backups older than RETENTION_DAYS.
#
# Usage:
#   chmod +x Database/scripts/backup.sh
#   ./Database/scripts/backup.sh
#
# Schedule with cron for automated nightly backups (see
# Database/backup_recovery.md for the crontab line).
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/BackEnd/.env"
BACKUP_DIR="$SCRIPT_DIR/../backups"
RETENTION_DAYS=14

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.example to .env and fill in DB credentials first." >&2
  exit 1
fi

# Pull DB_* values out of .env without sourcing the whole file
# (avoids accidentally executing anything unexpected in it).
DB_HOST=$(grep -E '^DB_HOST=' "$ENV_FILE" | tail -1 | cut -d '=' -f2-)
DB_PORT=$(grep -E '^DB_PORT=' "$ENV_FILE" | tail -1 | cut -d '=' -f2-)
DB_USER=$(grep -E '^DB_USER=' "$ENV_FILE" | tail -1 | cut -d '=' -f2-)
DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | tail -1 | cut -d '=' -f2-)
DB_NAME=$(grep -E '^DB_NAME=' "$ENV_FILE" | tail -1 | cut -d '=' -f2-)

for var in DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is empty — check $ENV_FILE" >&2
    exit 1
  fi
done

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTFILE="$BACKUP_DIR/smarteco_backup_${TIMESTAMP}.sql.gz"

echo "Backing up '$DB_NAME' from $DB_HOST:$DB_PORT ..."

mysqldump \
  --host="$DB_HOST" --port="$DB_PORT" \
  --user="$DB_USER" --password="$DB_PASSWORD" \
  --single-transaction \
  --routines --triggers \
  --databases "$DB_NAME" \
  | gzip > "$OUTFILE"

echo "Backup written to $OUTFILE ($(du -h "$OUTFILE" | cut -f1))"

# Prune old backups
DELETED=$(find "$BACKUP_DIR" -name 'smarteco_backup_*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
  echo "Pruned $DELETED backup(s) older than $RETENTION_DAYS days."
fi

echo "Done."
