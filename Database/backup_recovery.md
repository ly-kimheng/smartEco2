# SmartEco — Backup & Recovery

Nothing in the repo currently backs this database up. If the Aiven
instance in `BackEnd/.env` were dropped or corrupted, there is no
documented way to get the data back. This fixes that with a manual
process plus a scriptable one.

## 1. One-off manual backup (do this before any risky change)

```bash
mysqldump \
  --host="$DB_HOST" --port="$DB_PORT" \
  --user="$DB_USER" --password="$DB_PASSWORD" \
  --single-transaction \
  --routines --triggers \
  --databases defaultdb \
  > smarteco_backup_$(date +%Y%m%d_%H%M%S).sql
```

- `--single-transaction` takes a consistent InnoDB snapshot without
  locking tables, so the live app keeps working during the backup.
- `--routines --triggers` captures any stored procedures/triggers, in
  case some get added later (there are none as of this schema).
- `--databases defaultdb` includes the `CREATE DATABASE` statement, so
  the dump is self-contained and restorable to an empty server.

## 2. Scripted backup

Use `Database/scripts/backup.sh` (included). It reads connection info
from `BackEnd/.env`, timestamps the dump, gzips it, and deletes backups
older than 14 days so disk usage doesn't grow unbounded.

```bash
chmod +x Database/scripts/backup.sh
./Database/scripts/backup.sh
```

### Automating it (cron, daily at 2am)

```
0 2 * * * /path/to/smartEco2/Database/scripts/backup.sh >> /var/log/smarteco_backup.log 2>&1
```

## 3. Restoring from a backup

```bash
gunzip -c smarteco_backup_20260712_020000.sql.gz | \
  mysql --host="$DB_HOST" --port="$DB_PORT" \
        --user="$DB_USER" --password="$DB_PASSWORD"
```

Because the dump includes `CREATE DATABASE IF NOT EXISTS defaultdb`,
this works whether `defaultdb` already exists or the server is empty.

**Restore into a scratch database first if you're not sure the backup
is good** — swap `defaultdb` for a temp name, eyeball the row counts,
then promote it, rather than overwriting production blind:

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p -e "CREATE DATABASE defaultdb_test;"
gunzip -c smarteco_backup_20260712_020000.sql.gz | \
  sed 's/`defaultdb`/`defaultdb_test`/g' | \
  mysql -h "$DB_HOST" -u "$DB_USER" -p defaultdb_test
```

## 4. Point-in-time recovery (beyond the last nightly dump)

A nightly `mysqldump` only protects you back to the last backup — if
the server dies at 6pm, you lose the day's data. To recover to any
point in time, binary logging needs to be enabled on the MySQL server
(`log_bin = ON`), then:

```bash
mysqlbinlog --start-datetime="2026-07-12 02:00:00" \
            --stop-datetime="2026-07-12 17:43:00" \
            mysql-bin.000123 | mysql -u "$DB_USER" -p defaultdb
```

Aiven-managed MySQL enables binary logging and automated backups by
default on paid plans — check the Aiven console under
**Backups** for your service before assuming you need to self-manage
this. If you're on a free/shared tier, the manual/cron approach above
is your safety net.

## 5. What backups do NOT protect against

- **Bad data written by a bug** (e.g. an admin action that corrupts
  rows) will be faithfully included in the next backup too. Keep at
  least 2 weeks of history (the script does this) so you can go back
  further than "the bug's been running for a day."
- **Credential leaks** — a backup file is a full copy of the database,
  including bcrypt password hashes. Treat `.sql`/`.sql.gz` dump files
  with the same care as the `.env` file: never commit them, store them
  encrypted at rest, restrict who can read the backup directory.
