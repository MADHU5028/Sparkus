-- Create table for storing AI-generated session summaries
CREATE TABLE IF NOT EXISTS session_summaries (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    summary_text TEXT,
    transcription_text TEXT,
    key_topics JSONB DEFAULT '[]', -- Array of strings
    sentiment_score FLOAT, -- -1.0 to 1.0
    questions_asked JSONB DEFAULT '[]', -- Array of strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id) -- One summary per session
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_summaries_session_id ON session_summaries(session_id);
