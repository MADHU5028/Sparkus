// Join Session JavaScript - Add widget.js to web accessible resources

const sessionCodeInput = document.getElementById('session-code');
const continueBtn = document.getElementById('continue-btn');
const cancelBtn = document.getElementById('cancel-btn');
const errorDiv = document.getElementById('error');
const formContainer = document.getElementById('form-container');
const loadingDiv = document.getElementById('loading');

// Focus on input
sessionCodeInput.focus();

// Handle continue button
continueBtn.addEventListener('click', async () => {
    const code = sessionCodeInput.value.trim().toUpperCase();

    if (!code) {
        showError('Please enter a session code');
        return;
    }

    // Show loading
    formContainer.style.display = 'none';
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
        // Get session from background script
        const response = await chrome.runtime.sendMessage({
            type: 'GET_SESSION_BY_CODE',
            code: code,
        });

        if (!response.success) {
            throw new Error(response.error || 'Session not found');
        }

        // Store session code and proceed to identity entry
        sessionStorage.setItem('sparkus_session', JSON.stringify(response.session));
        sessionStorage.setItem('sparkus_session_code', code);

        // Navigate to identity entry
        window.location.href = 'identity-entry.html';
    } catch (error) {
        console.error('Session verification error:', error);
        formContainer.style.display = 'block';
        loadingDiv.style.display = 'none';
        showError(error.message || 'Failed to verify session code');
    }
});

// Handle cancel button
cancelBtn.addEventListener('click', () => {
    window.parent.postMessage({ type: 'CLOSE_SPARKUS_MODAL' }, '*');
});

// Handle Enter key
sessionCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        continueBtn.click();
    }
});

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
