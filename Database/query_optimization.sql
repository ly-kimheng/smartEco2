-- =====================================================================
-- SmartEco — Query Optimization & Indexing
-- =====================================================================
-- Context: InnoDB automatically creates an index on every FOREIGN KEY
-- column, so most FK columns in defaultdb.sql (e.g. reports.user_id,
-- tasks.assigned_to, votes.user_id) are ALREADY indexed even without an
-- explicit `INDEX` clause. This script only adds indexes for columns
-- that are queried/filtered/sorted on frequently but are NOT already
-- covered by a FK index or the existing named indexes
-- (idx_reports_status, idx_reports_user, idx_reports_location,
-- idx_tasks_location, idx_tasks_status, idx_tasks_assigned_to,
-- idx_notifications_recipient).
--
-- Run this AFTER defaultdb.sql.
-- =====================================================================

USE `defaultdb`;

-- ---------------------------------------------------------------------
-- reports.category — reports are frequently filtered by waste type in
-- the admin dashboard and analytics view (AnalyticsView.jsx). This is a
-- plain VARCHAR, not a FK to `categories`, so it gets no automatic
-- index.
-- ---------------------------------------------------------------------
ALTER TABLE `reports` ADD INDEX `idx_reports_category` (`category`);

-- Composite index for the most common admin query shape: "reports in
-- this status, newest first" (ORDER BY created_at DESC WHERE status = ?).
-- A composite index lets MySQL satisfy both the WHERE and ORDER BY from
-- the same index scan instead of filtering then sorting separately.
ALTER TABLE `reports` ADD INDEX `idx_reports_status_created` (`status`, `created_at`);

-- ---------------------------------------------------------------------
-- tasks.priority — cleanup team dashboards commonly ask for "high
-- priority tasks first" (TaskCard.jsx / PrioritySpot.jsx).
-- ---------------------------------------------------------------------
ALTER TABLE `tasks` ADD INDEX `idx_tasks_priority` (`priority`);

-- ---------------------------------------------------------------------
-- vouchers.status — the rewards page filters "my active vouchers" vs
-- redeemed/expired ones.
-- ---------------------------------------------------------------------
ALTER TABLE `vouchers` ADD INDEX `idx_vouchers_status` (`status`);

-- ---------------------------------------------------------------------
-- point_transactions.type — used to separate "earn" vs "spend" history
-- on the rewards/points page.
-- ---------------------------------------------------------------------
ALTER TABLE `point_transactions` ADD INDEX `idx_point_transactions_type` (`type`);

-- ---------------------------------------------------------------------
-- cleanup_team.district — used when auto-assigning/filtering tasks to
-- the crew responsible for a given district (adminService.js task
-- assignment queries).
-- ---------------------------------------------------------------------
ALTER TABLE `cleanup_team` ADD INDEX `idx_cleanup_team_district` (`district`);

-- ---------------------------------------------------------------------
-- notifications.is_read — "unread count" badge is one of the most
-- frequent queries in the app (runs on every page load). It's currently
-- only covered indirectly via idx_notifications_recipient
-- (recipient_role, user_id); extending that composite index to include
-- is_read lets "unread notifications for this user" be answered
-- entirely from the index.
-- ---------------------------------------------------------------------
ALTER TABLE `notifications` DROP INDEX `idx_notifications_recipient`;
ALTER TABLE `notifications`
  ADD INDEX `idx_notifications_recipient` (`recipient_role`, `user_id`, `is_read`);


-- =====================================================================
-- Verifying the impact — EXPLAIN
-- =====================================================================
-- Run these before and after applying this script and compare the
-- `type` and `rows` columns. You want `type` to move from ALL (full
-- table scan) toward ref/range, and `rows` to drop toward the actual
-- number of matching rows instead of the whole table.

-- Example 1: admin dashboard — pending reports, newest first
EXPLAIN SELECT id, title, location, category, created_at
FROM reports
WHERE status = 'Pending'
ORDER BY created_at DESC
LIMIT 20;

-- Example 2: cleanup crew's dashboard — high priority tasks for one crew
EXPLAIN SELECT id, title, location, status
FROM tasks
WHERE assigned_to = 1 AND priority = 'high';

-- Example 3: notification bell — unread count for one user
EXPLAIN SELECT COUNT(*)
FROM notifications
WHERE recipient_role = 'user' AND user_id = 1 AND is_read = FALSE;

-- Example 4: rewards page — a user's active vouchers
EXPLAIN SELECT v.id, v.code, r.title
FROM vouchers v
JOIN rewards r ON v.reward_id = r.id
WHERE v.user_id = 1 AND v.status = 'Active';


-- =====================================================================
-- Maintenance — keep the optimizer's statistics fresh
-- =====================================================================
-- MySQL's query planner relies on table statistics (row counts, value
-- distribution) to decide whether to use an index at all. On a table
-- that grows or changes shape a lot (reports, tasks, notifications),
-- stale statistics can make the optimizer ignore a perfectly good
-- index. Re-analyze periodically (e.g. monthly, or after a bulk
-- import/cleanup):

ANALYZE TABLE reports, tasks, notifications, votes, vouchers, point_transactions;
