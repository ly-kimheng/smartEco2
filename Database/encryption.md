# SmartEco — Data Encryption

## What's already in place

- **Passwords are bcrypt-hashed**, not stored in plain text, across all
  three identity tables (`users`, `admins`, `cleanup_team`) — see the
  `COMMENT 'bcrypt hash, never plain text'` on each `password` column
  in `defaultdb.sql`, and confirmed at the application layer
  (`bcrypt.compare()` in the login flow). Bcrypt is a deliberately slow,
  salted hash designed for passwords — this is genuine encryption/hashing
  of the single most sensitive field in the schema, not just an obscured
  string.

## Gaps this fixes

### 1. Encryption in transit (connection to MySQL was not enforced)

`BackEnd/.env` had `DB_SSL=true` **commented out**, even though the
database host is a managed Aiven MySQL instance reached over the public
internet. Without SSL, credentials and query results (including bcrypt
hashes) travel between the app server and the database in plain text.

Fix applied:
- `BackEnd/.env` — uncommented `DB_SSL=true`.
- `BackEnd/src/config/database.js` — the pool now passes `ssl: { rejectUnauthorized: true }`
  when `DB_SSL=true`, so `mysql2` actually negotiates TLS instead of the
  flag being read and silently ignored (which is what was happening
  before — the app read `process.env.DB_SSL` nowhere in the original
  file).
- The new DB accounts in `roles_and_privileges.sql` are created with
  `REQUIRE SSL`, so even if the app config regresses later, the MySQL
  server itself will refuse an unencrypted connection for those users.

### 2. Encryption at rest

Two layers apply here:

- **Storage-level (infrastructure):** Aiven-managed MySQL encrypts data
  at rest by default at the disk/volume level — this is handled by the
  hosting provider and doesn't need application code. If you migrate
  off Aiven, confirm the new host does the same (AWS RDS, GCP Cloud SQL,
  and Azure Database for MySQL all offer this, usually on by default).
- **Column-level (application):** InnoDB tablespace encryption
  (`ALTER TABLE ... ENCRYPTION='Y'`) is a MySQL Enterprise/Percona
  feature, not available on stock Community Edition MySQL — not used
  here for that reason. For the specific fields in this schema, that's
  an acceptable trade-off: the only genuinely sensitive column is
  `password`, and that's already bcrypt-hashed regardless of whether
  the tablespace itself is encrypted. Email addresses are personal data
  but not typically held to the same "encrypt at rest" bar as
  credentials — if your grading rubric requires it anyway, the
  practical option on Community MySQL is OS/volume-level disk
  encryption (LUKS, or whatever the cloud provider offers), not
  column-level.

### 3. What was deliberately NOT encrypted, and why

- `reports.description`, `feedback.comment`, etc. — free-text content
  the user submitted knowing it becomes a public/admin-visible report.
  Encrypting it would need to be reversible (unlike bcrypt), which adds
  key-management complexity for data that isn't actually secret.
- `email` columns — used for login lookups (`WHERE email = ?`).
  Encrypting them would break indexed lookups unless you use
  deterministic encryption, which is weaker than it sounds (it leaks
  which rows share the same email). Not worth it for this app's threat
  model; rely on transport encryption (above) and restricting DB access
  (`roles_and_privileges.sql`) instead.

## Summary for your report

| Data | At rest | In transit |
|---|---|---|
| Passwords | bcrypt hash (irreversible) | TLS (`REQUIRE SSL`) |
| Everything else | Provider-managed disk encryption (Aiven) | TLS (`REQUIRE SSL`) |
