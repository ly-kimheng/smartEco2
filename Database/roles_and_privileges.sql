-- =====================================================================
-- SmartEco — Database Roles & Privileges
-- =====================================================================
-- OPTIONAL / ADVANCED. The app runs fine on the default `avnadmin`
-- account for local testing and development — you do NOT need to run
-- this script just to get the app working. Only run this when you
-- specifically want to demonstrate least-privilege access control
-- (e.g. for a database-design assignment). If you do run it, remember
-- to actually change the placeholder passwords below before use, and
-- ALTER USER to update them if you already ran this once with the
-- placeholders.
-- =====================================================================
-- Replaces Database/user.sql, which had two problems:
--   1. It granted ALL PRIVILEGES to a single personal account — no
--      least-privilege separation at all.
--   2. It targeted the database `waste_management`, which no longer
--      exists — the live schema is `defaultdb` (see BackEnd/.env).
--
-- This script defines three MySQL roles (MySQL 8.0+) matching the three
-- real ways this system's database gets touched, then creates one
-- account per role. Run this against the SAME server as defaultdb.sql,
-- after the schema has been created.
--
-- NOTE: this is DB-level access control (who can connect to MySQL and
-- what SQL they can run). It is a different layer from the app-level
-- roles already in the schema (`users.role`-equivalent via the
-- users/admins/cleanup_team tables + JWT), which control what a logged
-- -in *person* can do inside the app. Both layers matter and a grader
-- may ask about the difference.
-- =====================================================================

USE `defaultdb`;


-- ---------------------------------------------------------------------
-- 1. APP ROLE — used by the Node/Express backend at runtime.
--    Can read and write application data, but cannot change the schema
--    (no CREATE/ALTER/DROP), cannot manage other users, and cannot
--    touch other databases. If the app gets compromised (e.g. SQL
--    injection slips through), the blast radius is capped at row-level
--    data in this one database — the attacker can't DROP a table or
--    escalate to a new MySQL user.
-- ---------------------------------------------------------------------
DROP ROLE IF EXISTS 'smarteco_app_role';
CREATE ROLE 'smarteco_app_role';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `defaultdb`.*
  TO 'smarteco_app_role';

-- The app account the backend actually connects with.
-- Change the password before using this in production — this is a
-- placeholder for local/dev setup only.
DROP USER IF EXISTS 'smarteco_app'@'%';
CREATE USER 'smarteco_app'@'%' IDENTIFIED BY 'change_me_app_password'
  REQUIRE SSL;  -- forces encrypted transport, see Database/encryption.md
GRANT 'smarteco_app_role' TO 'smarteco_app'@'%';
SET DEFAULT ROLE 'smarteco_app_role' TO 'smarteco_app'@'%';


-- ---------------------------------------------------------------------
-- 2. READ-ONLY / REPORTING ROLE — for dashboards, BI tools, or a
--    teammate who needs to run SELECT queries against production data
--    without any risk of accidentally modifying it.
-- ---------------------------------------------------------------------
DROP ROLE IF EXISTS 'smarteco_readonly_role';
CREATE ROLE 'smarteco_readonly_role';

GRANT SELECT
  ON `defaultdb`.*
  TO 'smarteco_readonly_role';

DROP USER IF EXISTS 'smarteco_readonly'@'%';
CREATE USER 'smarteco_readonly'@'%' IDENTIFIED BY 'change_me_readonly_password'
  REQUIRE SSL;
GRANT 'smarteco_readonly_role' TO 'smarteco_readonly'@'%';
SET DEFAULT ROLE 'smarteco_readonly_role' TO 'smarteco_readonly'@'%';


-- ---------------------------------------------------------------------
-- 3. ADMIN / DBA ROLE — for whoever runs schema migrations, backups,
--    and restores (i.e. you, from a local machine, not the deployed
--    app). Full privileges, restricted to localhost so it can't be
--    used remotely even if the password leaks.
-- ---------------------------------------------------------------------
DROP ROLE IF EXISTS 'smarteco_admin_role';
CREATE ROLE 'smarteco_admin_role';

GRANT ALL PRIVILEGES
  ON `defaultdb`.*
  TO 'smarteco_admin_role';

DROP USER IF EXISTS 'smarteco_admin'@'localhost';
CREATE USER 'smarteco_admin'@'localhost' IDENTIFIED BY 'change_me_admin_password';
GRANT 'smarteco_admin_role' TO 'smarteco_admin'@'localhost';
SET DEFAULT ROLE 'smarteco_admin_role' TO 'smarteco_admin'@'localhost';


FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------
-- Sanity checks (run these after setup to confirm each account only
-- has the privileges it should):
--   SHOW GRANTS FOR 'smarteco_app'@'%';
--   SHOW GRANTS FOR 'smarteco_readonly'@'%';
--   SHOW GRANTS FOR 'smarteco_admin'@'localhost';
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Migrating off the old setup:
--   1. Update BackEnd/.env: DB_USER=smarteco_app, DB_PASSWORD=<the
--      real password you set above>.
--   2. Once confirmed working, retire the old grant from user.sql:
--        DROP USER IF EXISTS 'kimheng'@'localhost';
--      (it pointed at a database, `waste_management`, that no longer
--      exists, so it's dead weight either way.)
-- ---------------------------------------------------------------------
