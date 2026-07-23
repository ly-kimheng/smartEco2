# SmartEco Backend

## Database setup

Run these SQL files against MySQL **in this exact order** (each one depends on
tables created by the ones before it):

```
1. Database/schema.sql                    -- base tables (if starting fresh)
2. Database/waste_management.sql          -- users, admins, reports, rewards, etc. + seed data
3. Database/migrations_cleanup_team.sql   -- cleanup_team table
4. Database/migrations_2026_updates.sql   -- tasks, votes, feedback, tips_guides, admin_settings,
                                              plus new columns on reports/notifications
5. Database/fix_seed_passwords.sql        -- resets seeded passwords to known values (see below)
```

If you skip step 4, community voting (`GET /reports/votable`, vote/unvote)
will fail with a 500 because the `votes` table won't exist yet.

## Test accounts

| Role | Email | Password |
|------|-------|----------|
| User | user@example.com | password123 |
| Admin | admin@example.com | admin123 — ⚠️ `fix_seed_passwords.sql` currently sets this as a **plain string**, not a bcrypt hash, but `login()` always runs `bcrypt.compare()`. Re-hash it before relying on this login. |
| Cleanup Team | cleanup@example.com | cleanup123 — same plaintext issue, seeded in `migrations_2026_updates.sql` |

To fix either password, generate a real hash and update the row:

```js
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(console.log);
```

```sql
UPDATE admins SET password = '<hash>' WHERE email = 'admin@example.com';
UPDATE cleanup_team SET password = '<hash>' WHERE email = 'cleanup@example.com';
```
