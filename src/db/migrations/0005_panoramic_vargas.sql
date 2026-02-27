CREATE TABLE `audit_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`business_type` text,
	`language` text DEFAULT 'en',
	`prospect_id` text,
	`audit_call_sid` text,
	`audit_call_status` text DEFAULT 'scheduled',
	`audit_call_answered_by` text,
	`audit_call_ring_time` integer,
	`audit_call_completed_at` text,
	`report_sent_at` text,
	`report_opened_at` text,
	`demo_booked_at` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`body` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`category` text,
	`meta_title` text,
	`meta_description` text,
	`og_image` text,
	`published` integer DEFAULT false,
	`published_at` text,
	`author_name` text DEFAULT 'Calltide',
	`reading_time_min` integer,
	`target_keyword` text,
	`related_post_slugs` text,
	`audit_cta_clicks` integer DEFAULT 0,
	`page_views` integer DEFAULT 0,
	`paired_post_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE TABLE `content_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`image_url` text,
	`scheduled_for` text,
	`published_at` text,
	`status` text DEFAULT 'draft',
	`category` text,
	`engagement_data` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
