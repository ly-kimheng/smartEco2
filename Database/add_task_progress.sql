-- =====================================================================
-- SmartEco — Add task progress percentage
-- =====================================================================
-- STATUS: merged into Database/defaultdb.sql — `tasks.progress` is now
-- part of the base schema. Only run this file if your database was
-- created from an older copy of defaultdb.sql that predates this column
-- (ALTER TABLE ... ADD COLUMN + the backfill below are safe to run
-- against existing data).
--
-- `tasks.status` only has 3 states (assigned / in_progress / completed),
-- but the cleanup-team app already has a 0-100% slider for logging how
-- far along a task is. There was nowhere to put that number, so it was
-- being thrown away before it reached the backend. This adds the column.
-- =====================================================================

USE `defaultdb`;

ALTER TABLE `tasks`
  ADD COLUMN `progress` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `status`;

-- Backfill existing rows so progress matches what their status already implies.
UPDATE `tasks` SET `progress` = 100 WHERE `status` = 'completed';
UPDATE `tasks` SET `progress` = 50  WHERE `status` = 'in_progress' AND `progress` = 0;
