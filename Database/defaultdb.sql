-- =====================================================================
-- SmartEco — Waste Management System
-- Consolidated Database Schema
-- =====================================================================
-- This file replaces the following, which grew organically as features
-- were added and is now archived (see README note at the bottom):
--   waste_management.sql, migrations_cleanup_team.sql,
--   migrations_2026_updates.sql, migrations_notifications_cleanup.sql,
--   migrations_points_guard.sql, fix_seed_passwords.sql, schema.sql,
--   seed.sql
--
-- Use this file for a FRESH install only (it does DROP + CREATE).
-- If you already have data you need to keep, use
-- migrate_existing_db.sql instead — it upgrades an existing database
-- in place without deleting anything.
--
-- Organized into 7 sections:
--   1. Identity & Access       — users, admins, cleanup_team
--   2. Locations & Reports     — locations, categories, reports
--   3. Cleanup Operations      — tasks, completion_reports
--   4. Community Engagement    — votes, feedback
--   5. Rewards & Points        — rewards, vouchers, point_transactions
--   6. Content & Notifications — tips_guides, notifications
--   7. System Settings         — admin_settings
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `defaultdb`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `defaultdb`;

SET FOREIGN_KEY_CHECKS = 0;


-- =====================================================================
-- SECTION 1 — IDENTITY & ACCESS
-- =====================================================================
-- Design note: citizens, admins, and cleanup crew are kept in three
-- separate tables (rather than one `accounts` table with a role column)
-- because each has a distinct shape (e.g. only `users` has `points`,
-- only `cleanup_team` has `district`) and the app's auth flow already
-- checks each table in turn. The trade-off is that an id like "1" is
-- not globally unique across all people in the system — only within
-- its own table. Anywhere that matters (e.g. notifications, see
-- Section 6) is handled explicitly with a role tag alongside the id.

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(150)  NOT NULL UNIQUE,
  `password`   VARCHAR(255)  NOT NULL COMMENT 'bcrypt hash, never plain text',
  `points`     INT           NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(150)  NOT NULL UNIQUE,
  `password`   VARCHAR(255)  NOT NULL COMMENT 'bcrypt hash, never plain text',
  `role`       VARCHAR(50)   NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `cleanup_team`;
CREATE TABLE `cleanup_team` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(150)  NOT NULL UNIQUE,
  `password`   VARCHAR(255)  NOT NULL COMMENT 'bcrypt hash, never plain text',
  `district`   VARCHAR(150)  DEFAULT NULL,
  `role`       VARCHAR(50)   NOT NULL DEFAULT 'cleanup_team',
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =====================================================================
-- SECTION 2 — LOCATIONS & REPORTS
-- =====================================================================

DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(150)  NOT NULL UNIQUE,
  `is_default` BOOLEAN       NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bonus normalization: the report form currently hardcodes its waste-type
-- options in the frontend rather than reading them from the database.
-- This table gives you a real place to manage them (e.g. an admin CRUD
-- screen) if you want to remove that hardcoding later — it's seeded with
-- the exact values the frontend currently uses, so nothing breaks today.
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(100)  NOT NULL UNIQUE,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT           DEFAULT NULL,
  `title`          VARCHAR(255)  NOT NULL,
  `description`    TEXT          NOT NULL,
  `location`       VARCHAR(255)  NOT NULL,
  `category`       VARCHAR(100)  NOT NULL,
  `priority`       ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  `status`         ENUM('Pending','Approved','Assigned','Resolved','Rejected')
                                 NOT NULL DEFAULT 'Pending',
  `image_url`      VARCHAR(255)  DEFAULT NULL COMMENT 'the "before" photo the citizen submitted',
  `reported_by`    VARCHAR(100)  DEFAULT NULL COMMENT 'denormalized snapshot of the reporter''s name at submit time',
  `reported_date`  DATE          DEFAULT NULL,
  `updated_by`     INT           DEFAULT NULL COMMENT 'admin who last changed the status',
  `points_awarded` TINYINT(1)    NOT NULL DEFAULT 0 COMMENT 'guards against awarding points twice for the same report',
  `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reports_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`  (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reports_admin`   FOREIGN KEY (`updated_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  INDEX `idx_reports_status` (`status`),
  INDEX `idx_reports_user` (`user_id`),
  INDEX `idx_reports_location` (`location`)
) ENGINE=InnoDB;

-- Note: the "after cleanup" photo is intentionally NOT a column here.
-- It lives on `tasks.after_image_url` (Section 3) and is joined in at
-- query time, because the after-photo is something the cleanup team
-- produces as part of doing the job — it belongs to the task, not the
-- original citizen report. (Earlier versions of this schema had
-- `reports.after_image_url` and `reports.task_id` columns that were
-- never actually written to by the application — dead weight, removed.)


-- =====================================================================
-- SECTION 3 — CLEANUP OPERATIONS
-- =====================================================================

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `report_id`         INT           DEFAULT NULL COMMENT 'NULL for tasks created without a citizen report',
  `assigned_to`       INT           DEFAULT NULL COMMENT 'cleanup_team.id',
  `title`             VARCHAR(255)  NOT NULL,
  `description`       TEXT          DEFAULT NULL,
  `location`          VARCHAR(150)  NOT NULL,
  `priority`          ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  `status`            ENUM('assigned','in_progress','completed') NOT NULL DEFAULT 'assigned',
  `progress`          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `before_image_url`  VARCHAR(255)  DEFAULT NULL COMMENT 'usually copied from reports.image_url when the task is dispatched',
  `after_image_url`   VARCHAR(255)  DEFAULT NULL COMMENT 'set by the cleanup team on completion',
  `completed_at`      DATETIME      DEFAULT NULL,
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tasks_report`   FOREIGN KEY (`report_id`)   REFERENCES `reports`      (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_crew`     FOREIGN KEY (`assigned_to`) REFERENCES `cleanup_team` (`id`) ON DELETE SET NULL,
  INDEX `idx_tasks_location` (`location`),
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_assigned_to` (`assigned_to`)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `completion_reports`;
CREATE TABLE `completion_reports` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `task_id`         INT           NOT NULL,
  `cleanup_team_id` INT           NOT NULL,
  `summary`         TEXT          NOT NULL,
  `after_image_url` VARCHAR(255)  DEFAULT NULL,
  `submitted_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_completion_task` FOREIGN KEY (`task_id`)         REFERENCES `tasks`        (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_completion_crew` FOREIGN KEY (`cleanup_team_id`) REFERENCES `cleanup_team` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- SECTION 4 — COMMUNITY ENGAGEMENT
-- =====================================================================

DROP TABLE IF EXISTS `votes`;
CREATE TABLE `votes` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT       NOT NULL,
  `report_id`   INT       NOT NULL,
  `location_id` INT       DEFAULT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_report_vote` (`user_id`, `report_id`),
  CONSTRAINT `fk_votes_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`     (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_votes_report`   FOREIGN KEY (`report_id`)   REFERENCES `reports`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_votes_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT       NOT NULL,
  `report_id`  INT       NOT NULL,
  `rating`     TINYINT   DEFAULT NULL COMMENT '1-5',
  `comment`    TEXT      DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_feedback_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- SECTION 5 — REWARDS & POINTS
-- =====================================================================

DROP TABLE IF EXISTS `rewards`;
CREATE TABLE `rewards` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `title`           VARCHAR(255)  NOT NULL,
  `description`     TEXT          NOT NULL,
  `points_required` INT           NOT NULL,
  `image_url`       VARCHAR(255)  DEFAULT NULL,
  `stock`           INT           NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT           NOT NULL,
  `reward_id`    INT           NOT NULL,
  `code`         VARCHAR(50)   NOT NULL UNIQUE,
  `points_spent` INT           NOT NULL,
  `status`       VARCHAR(50)   NOT NULL DEFAULT 'Active' COMMENT 'Active | Redeemed | Expired',
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vouchers_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`   (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vouchers_reward` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS `point_transactions`;
CREATE TABLE `point_transactions` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT           NOT NULL,
  `points`      INT           NOT NULL,
  `type`        VARCHAR(50)   NOT NULL COMMENT 'earn | spend',
  `description` VARCHAR(255)  NOT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- SECTION 6 — CONTENT & NOTIFICATIONS
-- =====================================================================

DROP TABLE IF EXISTS `tips_guides`;
CREATE TABLE `tips_guides` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `title`        VARCHAR(255)  NOT NULL,
  `category`     VARCHAR(100)  NOT NULL DEFAULT 'General',
  `content`      TEXT          NOT NULL,
  `image_url`    VARCHAR(255)  DEFAULT NULL,
  `is_published` BOOLEAN       NOT NULL DEFAULT TRUE,
  `created_by`   INT           DEFAULT NULL COMMENT 'admins.id',
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tips_admin` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Design note: `user_id` here deliberately has NO foreign key. A
-- notification's recipient can be a row in `users`, `admins`, OR
-- `cleanup_team` — three different tables that can (and do) reuse the
-- same numeric ids (e.g. cleanup_team #1 and users #1 both exist).
-- `recipient_role` disambiguates which table `user_id` actually refers
-- to. This is a deliberate trade-off for the current three-table
-- identity design (see Section 1) — a stricter alternative would be a
-- single unified `accounts` table with a `role` column, which would
-- allow a real FK here, but that's a larger structural change than
-- this cleanup covers.
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT           NOT NULL COMMENT 'id within whichever table recipient_role points to',
  `recipient_role`  VARCHAR(20)   NOT NULL DEFAULT 'user' COMMENT 'user | admin | cleanup_team',
  `title`           VARCHAR(255)  NOT NULL,
  `message`         TEXT          NOT NULL,
  `type`            VARCHAR(50)   NOT NULL DEFAULT 'info' COMMENT 'info | task | reward | broadcast',
  `report_id`       INT           DEFAULT NULL,
  `image_url`       VARCHAR(255)  DEFAULT NULL,
  `is_read`         BOOLEAN       NOT NULL DEFAULT FALSE,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_recipient` (`recipient_role`, `user_id`)
) ENGINE=InnoDB;


-- =====================================================================
-- SECTION 7 — SYSTEM SETTINGS
-- =====================================================================

DROP TABLE IF EXISTS `admin_settings`;
CREATE TABLE `admin_settings` (
  `id`                            INT PRIMARY KEY DEFAULT 1,
  `system_name`                   VARCHAR(150) NOT NULL DEFAULT 'SmartEco',
  `default_location_id`           INT DEFAULT NULL,
  `points_per_report`             INT NOT NULL DEFAULT 50,
  `report_delete_window_minutes`  INT NOT NULL DEFAULT 60,
  `notifications_enabled`         BOOLEAN NOT NULL DEFAULT TRUE,
  `maintenance_mode`              BOOLEAN NOT NULL DEFAULT FALSE,
  `updated_at`                    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_settings_location` FOREIGN KEY (`default_location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;


SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- SEED DATA (demo/test accounts — safe to delete for a real deployment)
-- =====================================================================

INSERT INTO `locations` (`name`, `is_default`) VALUES
  ('Prek Leap', TRUE),
  ('Russey Keo', FALSE),
  ('Chroy Changvar', FALSE),
  ('Chbar Ampov', FALSE),
  ('Boeng Keng Kang', FALSE),
  ('Toul Kork', FALSE),
  ('Sen Sok', FALSE),
  ('Chamkar Mon', FALSE),
  ('Daun Penh', FALSE),
  ('Meanchey', FALSE);

-- Matches the waste-type options hardcoded in ReportWastePage.jsx today.
INSERT INTO `categories` (`name`) VALUES
  ('Illegal Dumping'),
  ('Overflowing Bin'),
  ('Hazardous Waste'),
  ('Construction Waste'),
  ('Litter'),
  ('Sewage');

-- Passwords below are real bcrypt hashes (10 salt rounds), NOT plain text.
-- Login:  user@example.com     / password123
-- Login:  admin@example.com    / admin123
-- Login:  cleanup@example.com  / cleanup123
INSERT INTO `users` (`name`, `email`, `password`, `points`) VALUES
  ('Kimheng Ly',  'user@example.com',   '$2b$10$uTQzhYeUP/Xn48cY7skzGO8fU8M/MNjjkvMFAEusuR3fetaXHA1ba', 500),
  ('Eco Warrior', 'warrior@example.com','$2b$10$uTQzhYeUP/Xn48cY7skzGO8fU8M/MNjjkvMFAEusuR3fetaXHA1ba', 120);

INSERT INTO `admins` (`name`, `email`, `password`, `role`) VALUES
  ('Aethelgard Admin', 'admin@example.com', '$2b$10$TGWnMCtwbPxXLVoMMITkbedgdCvGU8nUyJ8G681wuNiTATomRDQ/K', 'admin');

INSERT INTO `cleanup_team` (`name`, `email`, `password`, `district`) VALUES
  ('Cleanup Crew A', 'cleanup@example.com', '$2b$10$/Z2ybonMvk8/3zeUkqyF5.gkFDRXQafPJfVaqPGM71OVMhxVHbmx.', 'Prek Leap');

INSERT INTO `rewards` (`title`, `description`, `points_required`, `image_url`, `stock`) VALUES
  ('Eco Sticker Pack', 'A set of 5 reusable vinyl eco-awareness stickers for your bottle, bike, or bin.', 50, 'https://images.unsplash.com/photo-1611080626919-7cf5a9dfa5f0?auto=format&fit=crop&q=80&w=400', 100),
  ('Premium Steel Bottle', 'Highly resilient, insulated double-wall premium steel water container.', 150, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400', 30),
  ('Heavy Canvas Tote Bag', 'Woven fully cotton container bag intended to replace simple single-use plastic grocery bags.', 100, 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400', 50),
  ('Bamboo Dining Set', 'Lightweight reusable travel set of bamboo eating forks, spoons and chopsticks.', 80, 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&q=80&w=400', 25);

INSERT INTO `tips_guides` (`title`, `category`, `content`, `is_published`, `created_by`) VALUES
  ('How to sort plastic waste', 'Plastic', 'Rinse containers, check the resin code (1-7), and flatten bottles before placing them in the recycling bin.', TRUE, 1),
  ('Composting food scraps at home', 'Organic', 'Keep a small bin for fruit and vegetable scraps, avoid meat and dairy, and turn the pile weekly for faster composting.', TRUE, 1);

INSERT INTO `admin_settings` (`id`, `default_location_id`)
  VALUES (1, (SELECT id FROM `locations` WHERE name = 'Prek Leap' LIMIT 1));

-- Demo report + matching task, so the app isn't empty on first run.
INSERT INTO `reports` (`user_id`, `title`, `description`, `location`, `category`, `status`, `image_url`, `reported_by`, `reported_date`) VALUES
  (1, 'Illegal Dumping in Alleyway', 'Vast piles of plastic packaging and rotting compost have been dumped in the local alleyway.', 'Prek Leap', 'Illegal Dumping', 'Assigned', NULL, 'Kimheng Ly', '2026-06-16'),
  (2, 'Clogged Eco-Silt Sewer Grate', 'Several leaves and commercial cups are clogging up the storm drainage system.', 'Russey Keo', 'Litter', 'Pending', NULL, 'Eco Warrior', '2026-06-15');

INSERT INTO `tasks` (`report_id`, `assigned_to`, `title`, `description`, `location`, `priority`, `status`) VALUES
  (1, 1, 'Illegal Dumping in Alleyway', 'Vast piles of plastic packaging and rotting compost have been dumped in the local alleyway.', 'Prek Leap', 'high', 'assigned');
