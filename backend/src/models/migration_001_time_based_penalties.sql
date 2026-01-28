-- Migration: Add missing fields for time-based penalties and network logging
-- Run this after initial schema setup

-- Add mode column to sessions (replaces individual boolean flags)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'focus_tracking';
-- Values: 'focus_tracking', 'ai_recording', 'exam_monitoring'

-- Add settings JSONB for flexible configuration
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add penalty configuration columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tab_switch_grace_period INTEGER DEFAULT 10; -- seconds
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tab_switch_penalty INTEGER DEFAULT 10; -- percentage
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS minimize_grace_period INTEGER DEFAULT 5;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS minimize_penalty INTEGER DEFAULT 15;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS eye_away_grace_period INTEGER DEFAULT 10;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS eye_away_penalty INTEGER DEFAULT 5;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recovery_rate DECIMAL(5,2) DEFAULT 1.0; -- percentage per 5s

-- Add tracking columns to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS warnings_count INTEGER DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS violations_count INTEGER DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS network_issues JSONB DEFAULT '[]';

-- Create network_logs table for detailed network tracking
CREATE TABLE IF NOT EXISTS network_logs (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'offline', 'restored'
    duration INTEGER, -- seconds offline (null for 'offline' event, filled on 'restored')
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for network logs
CREATE INDEX IF NOT EXISTS idx_network_logs_participant ON network_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_network_logs_session ON network_logs(session_id);

-- Add duration and penalty columns to focus_events for time-based tracking
ALTER TABLE focus_events ADD COLUMN IF NOT EXISTS duration INTEGER; -- seconds of violation
ALTER TABLE focus_events ADD COLUMN IF NOT EXISTS penalty_applied DECIMAL(5,2); -- percentage penalty

-- Add grace_period_active to warnings
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS grace_period_seconds INTEGER;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS penalty_applied BOOLEAN DEFAULT false;

-- Update setupDatabase.js output
COMMENT ON TABLE network_logs IS 'Tracks network connectivity issues separately from focus score';
COMMENT ON COLUMN sessions.mode IS 'Session mode: focus_tracking, ai_recording, or exam_monitoring';
COMMENT ON COLUMN sessions.settings IS 'Flexible JSONB configuration for session-specific rules';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed: Added time-based penalty tracking and network logging';
END $$;
