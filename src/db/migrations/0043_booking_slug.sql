ALTER TABLE businesses ADD COLUMN booking_slug TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX idx_businesses_booking_slug ON businesses(booking_slug);
