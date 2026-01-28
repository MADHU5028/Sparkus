-- Sparkus Database Schema
-- PostgreSQL Database Setup

-- Users Table (Hosts - Teachers/Invigilators)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table (Classes/Exams)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(20) UNIQUE NOT NULL,
    host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'google_meet' or 'zoom'
    
    -- Mode flags
    focus_tracking_enabled BOOLEAN DEFAULT true,
    ai_recording_enabled BOOLEAN DEFAULT false,
    exam_monitoring_enabled BOOLEAN DEFAULT false,
    
    -- Focus tracking settings
    focus_threshold INTEGER DEFAULT 70,
    focus_update_interval INTEGER DEFAULT 5, -- seconds
    warning_limit INTEGER DEFAULT 3,
    
    -- Browser rules
    allowed_websites TEXT[], -- array of allowed URLs
    tab_switching_allowed BOOLEAN DEFAULT false,
    split_screen_duration INTEGER DEFAULT 0, -- seconds allowed
    
    -- Exam mode settings
    fullscreen_mandatory BOOLEAN DEFAULT false,
    zero_tolerance_mode BOOLEAN DEFAULT false,
    camera_enforcement BOOLEAN DEFAULT false,
    
    -- Session status
    status VARCHAR(50) DEFAULT 'created', -- 'created', 'active', 'ended'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participants Table (Students)
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    
    -- Extension status
    extension_active BOOLEAN DEFAULT false,
    last_heartbeat TIMESTAMP,
    
    -- Final metrics
    final_focus_score DECIMAL(5,2) DEFAULT 100.00,
    attendance_status VARCHAR(50), -- 'present', 'absent'
    network_issue_duration INTEGER DEFAULT 0, -- seconds
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(session_id, roll_number)
);

-- Focus Events Table (Real-time tracking data)
CREATE TABLE focus_events (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Event data
    event_type VARCHAR(50) NOT NULL, -- 'focus_update', 'tab_switch', 'minimize', 'eye_away', 'network_issue'
    focus_score DECIMAL(5,2) NOT NULL,
    
    -- Context
    is_looking_at_screen BOOLEAN,
    is_tab_active BOOLEAN,
    is_window_visible BOOLEAN,
    current_url TEXT,
    
    -- Network
    network_stable BOOLEAN DEFAULT true,
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warnings Table
CREATE TABLE warnings (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    
    warning_type VARCHAR(100) NOT NULL, -- 'tab_switch', 'minimize', 'unauthorized_website', 'eye_away'
    warning_message TEXT,
    acknowledged BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recordings Table (Audio files and transcripts)
CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- File info
    audio_file_path TEXT,
    audio_duration INTEGER, -- seconds
    file_size BIGINT, -- bytes
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    transcript TEXT,
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- AI Summaries Table
CREATE TABLE ai_summaries (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES recordings(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- AI-generated content
    meeting_summary TEXT,
    key_topics TEXT[], -- array of topics
    important_notes TEXT,
    action_items TEXT[],
    slide_contexts JSONB, -- array of {timestamp, image_url, explanation}
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Violations Table (Exam monitoring)
CREATE TABLE violations (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    
    violation_type VARCHAR(100) NOT NULL, -- 'tab_switch', 'exit_fullscreen', 'camera_off', 'unauthorized_app'
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    screenshot_path TEXT,
    context_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sessions_host ON sessions(host_id);
CREATE INDEX idx_sessions_code ON sessions(session_code);
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_focus_events_participant ON focus_events(participant_id);
CREATE INDEX idx_focus_events_session ON focus_events(session_id);
CREATE INDEX idx_focus_events_timestamp ON focus_events(timestamp);
CREATE INDEX idx_warnings_participant ON warnings(participant_id);
CREATE INDEX idx_violations_participant ON violations(participant_id);
CREATE INDEX idx_recordings_session ON recordings(session_id);
