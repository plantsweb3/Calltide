ALTER TABLE businesses ADD COLUMN buffer_minutes INTEGER DEFAULT 0;--> statement-breakpoint
ALTER TABLE calls ADD COLUMN recording_url TEXT;--> statement-breakpoint
ALTER TABLE calls ADD COLUMN twilio_call_sid TEXT;