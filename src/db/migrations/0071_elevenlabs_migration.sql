-- Add ElevenLabs columns to businesses table
ALTER TABLE businesses ADD COLUMN elevenlabs_agent_id TEXT;
ALTER TABLE businesses ADD COLUMN elevenlabs_voice_id TEXT;

-- Add ElevenLabs conversation ID to calls table
ALTER TABLE calls ADD COLUMN elevenlabs_conversation_id TEXT;

-- Index for looking up calls by ElevenLabs conversation ID
CREATE INDEX IF NOT EXISTS idx_calls_elevenlabs_conversation_id ON calls(elevenlabs_conversation_id);

-- Add voice_id to setup_sessions for voice selection during onboarding
ALTER TABLE setup_sessions ADD COLUMN voice_id TEXT;
