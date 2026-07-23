-- =====================================================================
-- SmartEco — Backfill reports.points_awarded
-- =====================================================================
-- reports.points_awarded already exists in the schema but was never
-- actually written to — the app used to guess "was this report already
-- paid out?" by checking whether its status was already 'Resolved',
-- which breaks if a report's status is ever moved away from Resolved
-- and back. The app now uses points_awarded as the real, atomic guard
-- (see BackEnd/src/services/adminService.js and BackEnd/src/models/task.js).
--
-- Run this once after deploying that change, so reports that were
-- already Resolved (and already paid out under the old logic) aren't
-- mistaken for unpaid and awarded a second time.
-- =====================================================================

USE `defaultdb`;

UPDATE `reports` SET `points_awarded` = 1 WHERE `status` = 'Resolved';
