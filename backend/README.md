# Sparkus Backend

Backend server for the Sparkus remote learning engagement and attendance tracking system.

## Features

- **Authentication**: JWT-based auth with email/password and Google OAuth
- **Session Management**: Create and manage class/exam sessions
- **Real-time Focus Tracking**: WebSocket-based live participant monitoring
- **AI Processing**: Whisper transcription + GPT-4 insights generation
- **Attendance Automation**: Automatic attendance calculation based on focus scores
- **PDF Reports**: Generate comprehensive session reports
- **Email Integration**: Share reports via email

## Tech Stack

- Node.js + Express
- PostgreSQL
- Socket.io (real-time communication)
- OpenAI API (Whisper + GPT-4)
- JWT authentication
- Multer (file uploads)

## Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- OpenAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- Database credentials
- JWT secret
- OpenAI API key
- Email credentials (optional)

4. Set up database:
```bash
npm run db:setup
```

### Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create host account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/verify` - Verify JWT token

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/code/:code` - Get session by code
- `GET /api/sessions/host/:hostId` - Get all host sessions
- `POST /api/sessions/:id/start` - Start session
- `POST /api/sessions/:id/end` - End session
- `DELETE /api/sessions/:id` - Delete session

### Participants
- `POST /api/participants/join` - Join session
- `GET /api/participants/session/:sessionId` - Get all participants
- `GET /api/participants/:id/report` - Get participant report
- `POST /api/participants/:id/heartbeat` - Update heartbeat

### Focus Tracking
- `POST /api/focus/event` - Submit focus event
- `GET /api/focus/session/:sessionId` - Get session focus data

### Recordings
- `POST /api/recordings/upload` - Upload audio
- `POST /api/recordings/:id/process` - Trigger AI processing
- `GET /api/recordings/:id/summary` - Get AI summary
- `GET /api/recordings/session/:sessionId` - Get session recording

## WebSocket Events

### Client → Server
- `host:join` - Host joins session room
- `participant:join` - Participant joins session room
- `focus:update` - Real-time focus update
- `warning:issue` - Issue warning to participant
- `violation:log` - Log exam violation
- `session:end` - End session

### Server → Client
- `host:joined` - Confirmation of host join
- `participant:joined` - Confirmation of participant join
- `participant:connected` - New participant connected
- `participant:disconnected` - Participant disconnected
- `focus:updated` - Focus score updated
- `warning:received` - Warning issued
- `violation:logged` - Violation logged
- `session:ended` - Session ended

## Database Schema

See `src/models/schema.sql` for complete schema.

Main tables:
- `users` - Host accounts
- `sessions` - Class/exam sessions
- `participants` - Students in sessions
- `focus_events` - Real-time focus tracking data
- `warnings` - Warning logs
- `recordings` - Audio files and transcripts
- `ai_summaries` - AI-generated insights
- `violations` - Exam monitoring violations

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
