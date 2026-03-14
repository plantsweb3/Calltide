CREATE TABLE `founder_streaks` (
  `id` text PRIMARY KEY NOT NULL,
  `streak_type` text NOT NULL,
  `current_streak` integer DEFAULT 0,
  `longest_streak` integer DEFAULT 0,
  `last_hit_date` text,
  `total_xp` integer DEFAULT 0,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `founder_streaks_streak_type_unique` ON `founder_streaks` (`streak_type`);
--> statement-breakpoint
INSERT INTO `founder_streaks` (`id`, `streak_type`, `current_streak`, `longest_streak`, `total_xp`)
VALUES ('seed-outreach', 'outreach', 0, 0, 0);
