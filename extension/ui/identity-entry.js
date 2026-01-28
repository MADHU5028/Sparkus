// Identity Entry Logic

const form = document.getElementById('identity-form');
const fullNameInput = document.getElementById('full-name');
const rollNumberInput = document.getElementById('roll-number');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submit-btn');
const errorDiv = document.getElementById('error');

// Load session info
const session = JSON.parse(sessionStorage.getItem('sparkus_session'));
const sessionCode = sessionStorage.getItem('sparkus_session_code');

if (!session || !sessionCode) {
    window.location.href = 'join-session.html';
} else {
    // Display session info
    document.getElementById('session-name').textContent = session.sessionName;
    document.getElementById('host-name').textContent = `Host: ${session.hostName}`;

    // Display modes
    const modesDiv = document.getElementById('modes');
    if (session.modes.focusTracking) {
        modesDiv.innerHTML += '<span class="mode-badge">📊 Focus Tracking</span>';
    }
    if (session.modes.aiRecording) {
        modesDiv.innerHTML += '<span class="mode-badge">🎙️ AI Recording</span>';
    }
    if (session.modes.examMonitoring) {
        modesDiv.innerHTML += '<span class="mode-badge">🔒 Exam Monitoring</span>';
    }
}

// Focus on first input
fullNameInput.focus();

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = fullNameInput.value.trim();
    const rollNumber = rollNumberInput.value.trim();
    const email = emailInput.value.trim();

    if (!fullName || !rollNumber) {
        showError('Please fill in all required fields');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining session...';

    try {
        // Join session via background script
        const response = await chrome.runtime.sendMessage({
            type: 'JOIN_SESSION',
            data: {
                sessionCode,
                fullName,
                rollNumber,
                email: email || null,
            },
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to join session');
        }

        // Store participant data in chrome.storage (persists across page navigations)
        await chrome.storage.local.set({
            sparkus_participant: response.participant,
            sparkus_session: session
        });

        console.log('✅ Participant data saved to chrome.storage:', response.participant);

        // Save to background script
        await chrome.runtime.sendMessage({
            type: 'SET_SESSION',
            session: { ...session, isHost: false },
            participant: response.participant,
        });

        // Navigate to permissions screen
        window.location.href = 'permissions.html';
    } catch (error) {
        console.error('Join error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue to Permissions';
        showError(error.message || 'Failed to join session');
    }
});

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
