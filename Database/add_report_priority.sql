-- =====================================================================
-- SmartEco — Add report priority (severity)
-- =====================================================================
-- STATUS: merged into Database/defaultdb.sql — `reports.priority` is now
-- part of the base schema. Only run this file if your database was
-- created from an older copy of defaultdb.sql that predates this column
-- (ALTER TABLE ... ADD COLUMN is safe to run against existing data).
--
-- The citizen report form already collects a severity level (low/medium/
-- high), but `reports` had nowhere to store it — it was getting folded
-- into free-text inside `description` and lost as structured data. That's
-- why admin and the cleanup-team app always showed "Medium" regardless of
-- what the citizen actually picked. This adds a real column for it.
-- =====================================================================

USE `defaultdb`;

ALTER TABLE `reports`
  ADD COLUMN `priority` ENUM('low','medium','high') NOT NULL DEFAULT 'medium' AFTER `category`;
