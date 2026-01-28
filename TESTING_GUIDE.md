# 🎯 Sparkus Testing Guide

## ✅ What's Ready

- ✅ Backend server running on `http://localhost:5000`
- ✅ Database set up with all tables
- ✅ Chrome extension loaded
- ✅ Active session created with code: **SPARK-FJ533Z**

---

## 🚀 How to Test the Complete Flow

### Step 1: Join or Create a Google Meet

You need to be **INSIDE** a Google Meet meeting for the extension to work.

**Option A: Create a new meeting**
1. Go to: https://meet.google.com/new
2. Click "Start an instant meeting"
3. You'll be in a meeting room

**Option B: Join an existing meeting**
1. Use any Google Meet link
2. Join the meeting

### Step 2: The Extension Will Auto-Detect

Once you're in the meeting, the Sparkus extension will:
1. Detect that you're on Google Meet
2. Show a popup in the top-right corner asking: "Is this a Sparkus-monitored session?"
3. Click **"Join Session"**

### Step 3: Enter Session Code

1. A modal will appear asking for the session code
2. Enter: **`SPARK-FJ533Z`**
3. Click "Continue"

### Step 4: Enter Your Details

1. Enter your name (e.g., "John Doe")
2. Enter roll number (e.g., "2024001")
3. Click "Continue to Permissions"

### Step 5: Enable Monitoring

1. Review the permissions screen
2. Click **"Enable Sparkus Monitoring"**

### Step 6: See the Widget!

A floating purple widget should appear in the bottom-right showing:
- Your focus score (starts at 100%)
- Status indicators (eye, tab, network)

---

## 🧪 Test Focus Tracking

Once the widget appears, try these:

1. **Switch to another tab** → Focus drops to 95%, warning appears
2. **Return to meeting** → Focus slowly recovers
3. **Minimize window** → Focus drops again
4. **Drag the widget** → It's draggable!

---

## 🎨 Widget Colors

- 🟢 **Green** (≥70%) - Good focus, will be marked "Present"
- 🟡 **Yellow** (50-69%) - Warning zone
- 🔴 **Red** (<50%) - At risk, will be marked "Absent"

---

## ❌ Common Issues

### "No active session" in extension popup
- This is normal! The popup just shows status
- You need to be **inside a Google Meet** for the join flow to start

### Extension doesn't detect meeting
- Make sure you're on `meet.google.com` (not just the landing page)
- You need to be in an actual meeting room
- Try refreshing the page

### Session code not found
- Use the latest code: **SPARK-FJ533Z**
- Make sure backend is running
- Check backend terminal for errors

---

## 📊 Check Backend Logs

The backend terminal should show:
- Session created
- Participant joined
- Focus events being received
- Heartbeat updates

---

## 🎉 What Should Work

1. ✅ Meeting detection
2. ✅ Session join flow
3. ✅ Identity entry
4. ✅ Permissions screen
5. ✅ Widget appearance
6. ✅ Focus tracking (tab, window)
7. ✅ Warning system
8. ✅ Real-time backend updates

---

## 🐛 If Something Breaks

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for Sparkus logs
4. Share any errors you see

---

**Ready? Go to https://meet.google.com/new and start a meeting!** 🚀
