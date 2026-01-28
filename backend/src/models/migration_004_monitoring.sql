-- Create table for storing screen recording chunks/urls
CREATE TABLE IF NOT EXISTS screen_recordings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    duration_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for keystroke dynamics logs
CREATE TABLE IF NOT EXISTS keystroke_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    wpm FLOAT,
    dwell_time_avg FLOAT, -- Average time a key is pressed (ms)
    flight_time_avg FLOAT, -- Average time between key presses (ms)
    backspace_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_screen_recordings_participant ON screen_recordings(participant_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_logs_participant ON keystroke_logs(participant_id);
