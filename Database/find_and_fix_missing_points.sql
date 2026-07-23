-- =====================================================================
-- SmartEco — Find & Fix Missing Points
-- =====================================================================
-- Finds reports where `points_awarded = 1` (system thinks it already
-- paid out) but there is NO matching row in `point_transactions` for
-- that report — meaning it was flagged as paid without ever actually
-- crediting the user. This happens if a report was set to 'Resolved'
-- before the points_awarded guard existed, and the one-time
-- backfill_points_awarded.sql script then blanket-marked it as paid.
--
-- STEP 1: Run the SELECT below first to see what's affected.
-- STEP 2: Review the list, then run the generated fix statements.
-- =====================================================================

USE `defaultdb`;

-- ---------------------------------------------------------------------
-- STEP 1: Diagnostic — which reports are affected?
-- ---------------------------------------------------------------------
SELECT
  r.id            AS report_id,
  r.user_id,
  r.status,
  r.points_awarded,
  u.name          AS user_name,
  u.points        AS user_current_points
FROM reports r
JOIN users u ON u.id = r.user_id
WHERE r.points_awarded = 1
  AND r.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM point_transactions pt
    WHERE pt.user_id = r.user_id
      AND pt.description LIKE CONCAT('%Report ID #', r.id)
  )
ORDER BY r.id;

-- ---------------------------------------------------------------------
-- STEP 2: Auto-generate the fix statements for every affected report.
-- Run this SELECT, then copy the `fix_sql` column output and execute it.
-- (100 points per report — change the number below if your app awards
-- a different amount.)
-- ---------------------------------------------------------------------
SELECT CONCAT(
  'INSERT INTO point_transactions (user_id, points, type, description) VALUES (',
    r.user_id, ', 100, ''earn'', ''Points for validated report ID #', r.id, ' (backfill correction)''); ',
  'UPDATE users SET points = points + 100 WHERE id = ', r.user_id, ';'
) AS fix_sql
FROM reports r
WHERE r.points_awarded = 1
  AND r.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM point_transactions pt
    WHERE pt.user_id = r.user_id
      AND pt.description LIKE CONCAT('%Report ID #', r.id)
  )
ORDER BY r.id;

-- ---------------------------------------------------------------------
-- OPTIONAL: prevent this specific class of bug from recurring.
-- The old backfill_points_awarded.sql script (which blanket-marks every
-- Resolved report as paid) should NOT be run again. If you still need a
-- one-off cleanup in the future, always run the diagnostic SELECT above
-- first instead of the blanket UPDATE.
-- ---------------------------------------------------------------------
