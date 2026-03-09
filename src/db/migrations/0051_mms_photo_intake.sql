-- MMS Photo Intake: intake_attachments table + job_cards photo_count

CREATE TABLE intake_attachments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  job_intake_id TEXT NOT NULL REFERENCES job_intakes(id),
  job_card_id TEXT REFERENCES job_cards(id),
  lead_id TEXT REFERENCES leads(id),

  from_phone TEXT NOT NULL,

  media_url TEXT NOT NULL,
  media_content_type TEXT,
  media_size INTEGER,
  stored_url TEXT,
  caption TEXT,

  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_intake_attachments_intake ON intake_attachments(job_intake_id);
CREATE INDEX idx_intake_attachments_business ON intake_attachments(business_id);

ALTER TABLE job_cards ADD COLUMN photo_count INTEGER NOT NULL DEFAULT 0;
