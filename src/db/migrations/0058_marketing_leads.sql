CREATE TABLE `marketing_leads` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `name` text,
  `trade` text,
  `source` text NOT NULL DEFAULT 'calculator',
  `estimated_monthly_loss` integer,
  `avg_job_value` integer,
  `missed_calls_per_week` integer,
  `language` text DEFAULT 'en',
  `utm_source` text,
  `utm_medium` text,
  `utm_campaign` text,
  `converted_to_setup` integer DEFAULT false,
  `converted_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
