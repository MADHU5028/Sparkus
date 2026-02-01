# Sparkus Platform

**Remote Learning Engagement, Attendance Tracking & Exam Monitoring System**

Sparkus is a comprehensive platform that enhances online learning by tracking student focus, automating attendance, generating AI-powered meeting summaries, and ensuring exam integrity—all without replacing existing meeting platforms like Google Meet and Zoom.

---

## 🎯 What is Sparkus?

Sparkus runs **alongside** Google Meet/Zoom using a browser extension and web dashboard to:

- 📊 **Track student focus** in real-time using eye tracking and activity monitoring
- ✅ **Automate attendance** based on engagement levels
- 🎙️ **Record and summarize** sessions using AI (Whisper + GPT-4)
- 🔒 **Monitor online exams** with violation detection
- 📈 **Provide analytics** for instructors

---

## 🏗️ System Architecture

### Components

1. **Browser Extension** (Chrome)
   - Detects Google Meet/Zoom sessions
   - Tracks participant focus (eye tracking, tab activity, window state)
   - Records audio (host only)
   - Displays floating widget with live focus score

2. **Web Dashboard** (Next.js)
   - Session creation and management
   - Live monitoring of participants
   - Attendance reports
   - AI-generated summaries
   - PDF export and sharing

3. **Backend** (Node.js + Express + PostgreSQL)
   - REST API for all operations
   - WebSocket for real-time updates
   - AI processing (OpenAI Whisper + GPT-4)
   - Attendance calculation
   - PDF generation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed and running
- **Chrome** browser
- **OpenAI API key** (for AI features)

### 🐳 Docker Setup (Recommended)

The easiest way to run Sparkus is using Docker. This ensures all team members use the same environment.

1.  **Clone the repository**
2.  **Create `.env` file** in `backend/` directory (see backend/.env.example)
3.  **Run with Docker Compose**:

```bash
docker compose up --build
```

- **Backend**: `http://localhost:5000`
- **Dashboard**: `http://localhost:5173`
- **Database**: `postgres:5432`

*Note: The containers are configured for hot-reloading. Any changes you make to the code in `backend/` or `dashboard/` will instantly update in the running application.*

### 🛠️ Manual Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# - Database credentials
# - JWT secret
# - OpenAI API key

# Set up database
npm run db:setup

# Start server
npm run dev
```

Backend will run on `http://localhost:5000`

### 2. Extension Setup

```bash
# No build needed - it's vanilla JavaScript

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the /extension folder
```

### 3. Dashboard Setup (Coming Soon)

The Next.js dashboard is planned but not yet implemented in this initial build. You can interact with the backend API directly or build the dashboard following the implementation plan.

---

## 📖 How It Works

### For Instructors (Hosts)

1. **Create Session**
   - Log into Sparkus dashboard
   - Click "Create New Session"
   - Configure settings:
     - Focus threshold (default 70%)
     - Allowed websites
     - Exam mode options
   - Get session code (e.g., `SPARK-ABC123`)

2. **Start Class**
   - Share session code with students
   - Start Google Meet/Zoom
   - Monitor students in real-time on dashboard

3. **After Class**
   - View attendance report (auto-calculated)
   - Download AI summary
   - Export PDF report
   - Share via email/WhatsApp

### For Students (Participants)

1. **Join Session**
   - Install Sparkus extension
   - Open Google Meet/Zoom link
   - Enter session code when prompted
   - Provide name and roll number

2. **Grant Permissions**
   - Allow camera access (for eye tracking)
   - Allow tab monitoring

3. **During Class**
   - Floating widget shows your focus score
   - Stay engaged to maintain high score
   - Receive warnings before penalties

4. **Focus Score Calculation**
   - Starts at 100%
   - Decreases with:
     - Tab switching (-5%)
     - Looking away (-2%)
     - Minimizing window (-5%)
     - Unauthorized websites (-10%)
   - Slowly recovers with good behavior

---

## 🎨 Key Features

### ✅ Implemented (Backend + Extension)

- [x] Session creation and management
- [x] Participant join with session codes
- [x] Real-time focus tracking
- [x] Eye tracking (simulated - ready for WebGazer integration)
- [x] Tab and window monitoring
- [x] Warning system
- [x] Focus score calculation
- [x] Attendance automation (≥70% = Present)
- [x] Audio recording upload
- [x] AI transcription (Whisper)
- [x] AI summary generation (GPT-4)
- [x] PDF report generation
- [x] Email sharing
- [x] WebSocket real-time updates
- [x] Floating widget UI
- [x] Session join flow
- [x] Permission consent screens

### 🚧 To Be Implemented

- [ ] Web dashboard UI (Next.js)
- [ ] Exam monitoring strict mode
- [ ] Screenshot capture on violations
- [ ] Slide/whiteboard context analysis
- [ ] WhatsApp sharing integration
- [ ] Google OAuth login
- [ ] Host recording controls in extension
- [ ] Network issue tracking UI

---

## 📁 Project Structure

```
sparkus-app/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── server.js          # Main server
│   │   ├── config/            # Database & OpenAI config
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── sockets/           # WebSocket handlers
│   │   └── models/            # Database schema
│   └── package.json
│
├── extension/                  # Chrome extension
│   ├── manifest.json
│   ├── background/            # Service worker
│   ├── content/               # Content scripts
│   ├── lib/                   # Focus tracking engine
│   ├── ui/                    # UI components
│   └── popup/                 # Extension popup
│
└── dashboard/                  # Next.js dashboard (planned)
    └── (to be implemented)
```

---

## 🔐 Privacy & Security

- ✅ **Camera feed processed locally** - never sent to servers
- ✅ **Only focus scores transmitted** - not raw activity data
- ✅ **Explicit consent required** - clear permission screens
- ✅ **Session-bound monitoring** - only active during class
- ✅ **Transparent to students** - they see their own scores
- ✅ **No host access to camera feeds** - privacy-preserving

---

## 🛠️ Technology Stack

| Component | Technologies |
|-----------|-------------|
| **Backend** | Node.js, Express, PostgreSQL, Socket.io |
| **Extension** | Chrome Manifest V3, Vanilla JavaScript |
| **Dashboard** | Next.js 14, React, TypeScript, Tailwind CSS (planned) |
| **AI** | OpenAI Whisper (transcription), GPT-4 (insights) |
| **Real-time** | WebSocket (Socket.io) |
| **Auth** | JWT, bcrypt |

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `GET /api/sessions/code/:code` - Get by code
- `POST /api/sessions/:id/start` - Start session
- `POST /api/sessions/:id/end` - End session

### Participants
- `POST /api/participants/join` - Join session
- `GET /api/participants/session/:sessionId` - List participants
- `POST /api/participants/:id/heartbeat` - Heartbeat

### Focus Tracking
- `POST /api/focus/event` - Submit focus event
- `GET /api/focus/session/:sessionId` - Get focus data

### Recordings
- `POST /api/recordings/upload` - Upload audio
- `POST /api/recordings/:id/process` - Process with AI
- `GET /api/recordings/:id/summary` - Get summary

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test  # (tests to be implemented)
```

### Extension
1. Load extension in Chrome
2. Navigate to `meet.google.com`
3. Extension should detect meeting
4. Test join flow with session code

### Manual Testing Checklist
- [ ] Create session via API
- [ ] Join session with extension
- [ ] Grant permissions
- [ ] Verify focus tracking updates
- [ ] Test tab switching detection
- [ ] Verify warning system
- [ ] Upload audio recording
- [ ] Process with AI
- [ ] Generate PDF report

---

## 🚀 Deployment

### Backend
- Deploy to Railway, Render, or AWS
- Set up PostgreSQL database
- Configure environment variables
- Enable CORS for dashboard domain

### Extension
- Package as `.crx` file
- Publish to Chrome Web Store
- Update API URL to production

### Dashboard
- Deploy to Vercel or Netlify
- Configure API endpoint
- Set up authentication

---

## 📝 Environment Variables

See `backend/.env.example` for all required variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
- `FRONTEND_URL`

---

## 🤝 Contributing

This is a complete platform ready for:
- Dashboard UI implementation
- Enhanced eye tracking (WebGazer.js integration)
- Exam monitoring features
- Mobile app development
- Analytics and reporting enhancements

---

## 📄 License

MIT

---

## 🎓 Use Cases

- **Universities**: Track attendance in online classes
- **Coaching Centers**: Monitor student engagement
- **Corporate Training**: Measure training effectiveness
- **Online Exams**: Ensure exam integrity
- **Webinars**: Analyze audience engagement

---

## 📞 Support

For issues or questions:
- Check the implementation plan in `.gemini/antigravity/brain/`
- Review API documentation in `backend/README.md`
- Check extension docs in `extension/README.md`

---

**Built with ❤️ for better online education**
