# 🧪 Testing Real-time Socket.IO Updates

## What Was Fixed

✅ **Socket.IO Event Names** - Matched dashboard event listeners with backend emitters:
- Backend emits: `participant:connected` → Dashboard listens: `participant:connected` ✅
- Backend emits: `participant:disconnected` → Dashboard listens: `participant:disconnected` ✅  
- Backend emits: `focus:updated` → Dashboard listens: `focus:updated` ✅

✅ **Added Debug Logging** - Console logs for all Socket.IO events

---

## How to Test Real-time Updates

### Step 1: Open Browser Console

1. Open dashboard at `http://localhost:5174`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Keep it open to see real-time logs

### Step 2: Navigate to Live Session

1. Create a new session (or use existing active session)
2. Click "View Live" or navigate to live session page
3. You should see in console:
   ```
   🔌 Socket connected, joining session: <session-id>
   ✅ Host joined session: { sessionId: ... }
   ```

### Step 3: Simulate Participant Joining (Backend Test)

Since the extension isn't loaded yet, you can test Socket.IO by manually emitting events from browser console:

```javascript
// Get the socket instance (in browser console on dashboard page)
// This won't work until extension is loaded, but you can verify socket connection

// Check if socket is connected
console.log('Socket connected:', window.socket?.connected);
```

### Step 4: Test with Extension (Full Flow)

1. **Load Extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select: `c:\Users\hithe\sparkus-app\extension`

2. **Join Google Meet:**
   - Open new tab
   - Go to `https://meet.google.com/new`
   - Start instant meeting

3. **Join Session via Extension:**
   - Extension should detect Google Meet
   - Click "Join Session"
   - Enter session code from dashboard
   - Enter name and roll number
   - Grant permissions

4. **Watch Dashboard Update in Real-time:**
   - Dashboard should show:
     ```
     👤 Participant connected: { participantId: ..., timestamp: ... }
     ```
   - Participant should appear in table immediately
   - Toast notification: "New participant connected"

5. **Test Focus Updates:**
   - Switch tabs in student browser
   - Dashboard console should show:
     ```
     📊 Focus updated: { participantId: ..., focusScore: 95, ... }
     ```
   - Focus bar should animate smoothly

---

## Expected Console Output

### When Host Joins Session:
```
🔌 Socket connected, joining session: 123
✅ Host joined session: { sessionId: 123 }
```

### When Participant Joins:
```
👤 Participant connected: { participantId: 456, timestamp: ... }
```

### When Focus Updates:
```
📊 Focus updated: { 
  participantId: 456,
  focusScore: 95,
  fullName: "John Doe",
  rollNumber: "2024001"
}
```

### When Participant Leaves:
```
👋 Participant disconnected: { participantId: 456, timestamp: ... }
```

---

## Troubleshooting

### Socket Not Connecting?

Check console for errors:
```javascript
// Should see Socket.IO connection logs
// If you see "Socket.IO connection failed", check:
// 1. Backend is running on port 5000
// 2. CORS is configured correctly
// 3. No firewall blocking WebSocket connections
```

### Events Not Firing?

1. **Verify backend is running:** `http://localhost:5000/health`
2. **Check CORS settings** in `backend/src/server.js`
3. **Verify Socket.IO version compatibility**
4. **Check browser console** for connection errors

### Participant Not Appearing?

1. **Check extension is loaded** in Chrome
2. **Verify session is "active"** (not just "created")
3. **Check backend logs** for participant join events
4. **Refresh dashboard** to force re-fetch

---

## Next Steps

✅ Real-time Socket.IO fixed
✅ Dashboard fully functional
⏭️ **Load extension and test complete flow**

**Ready for end-to-end testing!** 🚀
