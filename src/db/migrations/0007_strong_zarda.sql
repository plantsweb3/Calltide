CREATE TABLE `help_article_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`helpful` integer NOT NULL,
	`session_id` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`article_id`) REFERENCES `help_articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `help_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`title_es` text,
	`excerpt` text,
	`excerpt_es` text,
	`content` text NOT NULL,
	`content_es` text,
	`meta_title` text,
	`meta_title_es` text,
	`meta_description` text,
	`meta_description_es` text,
	`related_articles` text,
	`dashboard_context_routes` text,
	`status` text DEFAULT 'draft',
	`view_count` integer DEFAULT 0,
	`helpful_yes` integer DEFAULT 0,
	`helpful_no` integer DEFAULT 0,
	`search_keywords` text,
	`search_keywords_es` text,
	`reading_time_minutes` integer DEFAULT 3,
	`sort_order` integer DEFAULT 0,
	`published_at` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`category_id`) REFERENCES `help_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `help_articles_slug_unique` ON `help_articles` (`slug`);--> statement-breakpoint
CREATE TABLE `help_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`name_es` text,
	`description` text,
	`description_es` text,
	`icon` text,
	`sort_order` integer DEFAULT 0,
	`article_count` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `help_categories_slug_unique` ON `help_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `help_search_misses` (
	`id` text PRIMARY KEY NOT NULL,
	`query` text NOT NULL,
	`source` text NOT NULL,
	`result_count` integer DEFAULT 0,
	`business_id` text,
	`created_at` text DEFAULT (datetime('now'))
);
