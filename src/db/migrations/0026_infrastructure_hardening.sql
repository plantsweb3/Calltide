-- Rate limit entries (persistent, replaces in-memory Map)
CREATE TABLE IF NOT EXISTS `rate_limit_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `key` text NOT NULL,
  `count` integer NOT NULL DEFAULT 1,
  `window_start` text NOT NULL DEFAULT (datetime('now')),
  `window_end` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_rle_key` ON `rate_limit_entries` (`key`);
--> statement-breakpoint

-- Client feedback & feature requests
CREATE TABLE IF NOT EXISTS `client_feedback` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL,
  `type` text NOT NULL DEFAULT 'feedback',
  `category` text NOT NULL DEFAULT 'general',
  `title` text NOT NULL,
  `description` text NOT NULL,
  `status` text NOT NULL DEFAULT 'new',
  `admin_response` text,
  `admin_responded_at` text,
  `priority` text DEFAULT 'medium',
  `votes` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_cf_business` ON `client_feedback` (`business_id`, `status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_cf_status` ON `client_feedback` (`status`, `created_at`);
