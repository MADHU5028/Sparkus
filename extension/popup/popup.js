// Extension Popup Logic

const statusEl = document.getElementById('status');
const dashboardBtn = document.getElementById('dashboard-btn');
const joinSection = document.getElementById('join-section');
const activeSession = document.getElementById('active-session');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');

// Form inputs
const sessionCodeInput = document.getElementById('session-code');
const fullNameInput = document.getElementById('full-name');
const rollNumberInput = document.getElementById('roll-number');

// Active session elements
const sessionNameEl = document.getElementById('session-name');
const focusScoreEl = document.getElementById('focus-score');
const trackingStatusEl = document.getElementById('tracking-status');

// Check current session status on popup open
function checkSessionStatus() {
    chrome.storage.local.get(['activeSession', 'participantData'], (result) => {
        if (result.activeSession && result.participantData) {
            // Session is active
            showActiveSession(result.activeSession, result.participantData);
        } else {
            // No active session
            showJoinForm();
        }
    });
}

function showJoinForm() {
    statusEl.textContent = 'No Active Session';
    joinSection.classList.remove('hidden');
    activeSession.classList.add('hidden');
}

function showActiveSession(session, participant) {
    statusEl.textContent = 'Session Active';
    joinSection.classList.add('hidden');
    activeSession.classList.remove('hidden');

    sessionNameEl.textContent = session.sessionName || 'Unknown';
    focusScoreEl.textContent = `${participant.focusScore || 100}%`;
    trackingStatusEl.textContent = participant.extensionActive ? 'Active' : 'Inactive';
}

// Join session button
joinBtn.addEventListener('click', async () => {
    const sessionCode = sessionCodeInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const rollNumber = rollNumberInput.value.trim();

    if (!sessionCode || !fullName || !rollNumber) {
        alert('Please fill in all fields');
        return;
    }

    joinBtn.textContent = 'Joining...';
    joinBtn.disabled = true;

    try {
        // Send join request to background script
        chrome.runtime.sendMessage({
            type: 'JOIN_SESSION',
            data: { sessionCode, fullName, rollNumber }
        }, (response) => {
            if (response && response.success) {
                alert('Joined session successfully!');
                checkSessionStatus();
            } else {
                alert(response?.error || 'Failed to join session');
                joinBtn.textContent = 'Join Session';
                joinBtn.disabled = false;
            }
        });
    } catch (error) {
        alert('Error joining session: ' + error.message);
        joinBtn.textContent = 'Join Session';
        joinBtn.disabled = false;
    }
});

// Leave session button
leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave this session?')) {
        chrome.runtime.sendMessage({ type: 'LEAVE_SESSION' }, (response) => {
            if (response && response.success) {
                alert('Left session');
                checkSessionStatus();
            }
        });
    }
});

// Open dashboard
dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5174/dashboard' });
});

// Initialize
checkSessionStatus();

// Refresh session status every 5 seconds
setInterval(checkSessionStatus, 5000);
