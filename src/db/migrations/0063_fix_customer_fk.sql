-- Fix customer_notes FK: was referencing businesses(id), should reference customers(id)
CREATE TABLE `customer_notes_new` (
  `id` text PRIMARY KEY NOT NULL,
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `note_text` text NOT NULL,
  `created_by` text NOT NULL DEFAULT 'admin',
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `customer_notes_new` SELECT * FROM `customer_notes`;
--> statement-breakpoint
DROP TABLE `customer_notes`;
--> statement-breakpoint
ALTER TABLE `customer_notes_new` RENAME TO `customer_notes`;
--> statement-breakpoint
-- Fix churn_risk_scores FK: was referencing businesses(id), should reference customers(id)
CREATE TABLE `churn_risk_scores_new` (
  `id` text PRIMARY KEY NOT NULL,
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `score` integer NOT NULL DEFAULT 0,
  `factors` text DEFAULT '[]',
  `calculated_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `churn_risk_scores_new` SELECT * FROM `churn_risk_scores`;
--> statement-breakpoint
DROP TABLE `churn_risk_scores`;
--> statement-breakpoint
ALTER TABLE `churn_risk_scores_new` RENAME TO `churn_risk_scores`;
--> statement-breakpoint
-- Fix escalations FK: was referencing businesses(id), should reference customers(id)
CREATE TABLE `escalations_new` (
  `id` text PRIMARY KEY NOT NULL,
  `call_id` text REFERENCES `calls`(`id`),
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `reason` text NOT NULL,
  `resolution_status` text NOT NULL DEFAULT 'open',
  `assigned_to` text,
  `notes` text,
  `resolved_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `escalations_new` SELECT * FROM `escalations`;
--> statement-breakpoint
DROP TABLE `escalations`;
--> statement-breakpoint
ALTER TABLE `escalations_new` RENAME TO `escalations`;
