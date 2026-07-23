-- =====================================================================
-- SmartEco — Add a 50-point starter reward
-- =====================================================================
-- The seed catalog (defaultdb.sql) only had rewards costing 80-150 points,
-- so a brand-new citizen with a handful of points had nothing to redeem
-- yet. This adds a cheap, easy-to-reach reward. Safe to run against an
-- existing database — the WHERE NOT EXISTS guard means running it twice
-- (or against a DB that already has it from a fresh defaultdb.sql import)
-- won't create a duplicate row.
-- =====================================================================

USE `defaultdb`;

INSERT INTO `rewards` (`title`, `description`, `points_required`, `image_url`, `stock`)
SELECT 'Eco Sticker Pack', 'A set of 5 reusable vinyl eco-awareness stickers for your bottle, bike, or bin.', 50,
       'https://images.unsplash.com/photo-1611080626919-7cf5a9dfa5f0?auto=format&fit=crop&q=80&w=400', 100
WHERE NOT EXISTS (
  SELECT 1 FROM `rewards` WHERE `points_required` = 50
);
