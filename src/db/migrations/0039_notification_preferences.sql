ALTER TABLE businesses ADD COLUMN notify_on_every_call integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN notify_on_missed_only integer DEFAULT 1;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN owner_quiet_hours_start text DEFAULT '21:00';
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN owner_quiet_hours_end text DEFAULT '08:00';
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN setup_checklist_dismissed integer DEFAULT 0;
