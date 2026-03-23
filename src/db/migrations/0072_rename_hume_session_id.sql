-- Rename hume_session_id to session_id in active_calls table
ALTER TABLE active_calls RENAME COLUMN hume_session_id TO session_id;
