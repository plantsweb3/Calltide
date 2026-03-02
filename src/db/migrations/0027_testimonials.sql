CREATE TABLE `testimonials` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `owner_name` text NOT NULL,
  `business_name` text NOT NULL,
  `business_type` text,
  `quote` text NOT NULL,
  `rating` integer,
  `nps_score` integer,
  `approved` integer DEFAULT false,
  `featured` integer DEFAULT false,
  `submitted_at` text NOT NULL DEFAULT (datetime('now')),
  `approved_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
