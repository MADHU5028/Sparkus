# Sparkus Browser Extension

Chrome extension for focus tracking, attendance monitoring, and exam proctoring during online meetings.

## Features

- **Meeting Detection**: Automatically detects Google Meet and Zoom sessions
- **Focus Tracking**: Real-time monitoring of student engagement
- **Eye Tracking**: Camera-based gaze detection (privacy-preserving)
- **Floating Widget**: Live focus score display for students
- **Warning System**: Alerts before penalties
- **Session Management**: Easy join with session codes
- **Exam Monitoring**: Strict mode for online exams

## Installation

### For Development

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder

### For Production

1. Package the extension as a `.crx` file
2. Publish to Chrome Web Store
3. Users can install from the store

## Usage

### For Students (Participants)

1. Install the Sparkus extension
2. Join your Google Meet or Zoom class
3. When prompted, enter the session code provided by your instructor
4. Enter your name and roll number
5. Grant camera and tab permissions
6. The floating widget will show your current focus score
7. Stay engaged to maintain a high score!

### For Instructors (Hosts)

1. Create a session on the Sparkus dashboard
2. Share the session code with students
3. Start your Google Meet or Zoom meeting
4. Monitor student engagement in real-time on the dashboard

## How Focus Tracking Works

The extension monitors:
- **Eye Gaze**: Are you looking at the screen?
- **Tab Activity**: Is the meeting tab active?
- **Window State**: Is the window visible/minimized?
- **Network**: Connection stability

Focus score starts at 100% and decreases with:
- Tab switching (-5%)
- Minimizing window (-5%)
- Looking away (-2% per instance)
- Unauthorized websites (-10%)

Focus score slowly recovers when you're engaged.

## Privacy & Security

- ✅ Camera feed processed **locally only**
- ✅ No raw video sent to servers
- ✅ Only focus scores transmitted
- ✅ Monitoring active **only during sessions**
- ✅ Clear indicators when tracking is active
- ✅ Students see their own scores

## Permissions

- **Camera**: For eye tracking (processed locally)
- **Tabs**: To detect tab switching
- **Storage**: To save session data
- **Host Permissions**: For Meet/Zoom domains and backend API

## Files Structure

```
extension/
├── manifest.json              # Extension configuration
├── background/
│   └── background.js          # Service worker
├── content/
│   ├── content-detector.js    # Meeting detection
│   ├── content-participant.js # Student mode
│   └── content-host.js        # Instructor mode
├── lib/
│   ├── focus-tracker.js       # Focus tracking engine
│   └── exam-monitor.js        # Exam monitoring
├── ui/
│   ├── join-session.html      # Session join UI
│   ├── identity-entry.html    # Student details
│   ├── permissions.html       # Permission consent
│   ├── widget.html            # Floating widget
│   └── widget.css             # Widget styles
└── popup/
    ├── popup.html             # Extension popup
    └── popup.js               # Popup logic
```

## Development

### Testing

1. Load the extension in Chrome
2. Navigate to `meet.google.com` or `zoom.us`
3. The extension should detect the meeting
4. Test the join flow with a session code from the dashboard

### Debugging

- Open DevTools on the meeting page to see content script logs
- Go to `chrome://extensions/` and click "Service Worker" to debug background script
- Right-click the extension icon and select "Inspect popup" for popup debugging

## API Integration

The extension communicates with the Sparkus backend at `http://localhost:5000/api`:

- `GET /sessions/code/:code` - Get session by code
- `POST /participants/join` - Join session
- `POST /focus/event` - Send focus events
- `POST /participants/:id/heartbeat` - Keep-alive

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+ (Chromium-based)
- ❌ Firefox (requires Manifest V2 port)
- ❌ Safari (requires Safari extension port)

## License

MIT
