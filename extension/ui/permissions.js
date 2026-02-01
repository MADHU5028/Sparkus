// Permissions Screen Logic - Using chrome.storage for data persistence

const enableBtn = document.getElementById('enable-btn');

enableBtn.addEventListener('click', async () => {
    enableBtn.disabled = true;
    enableBtn.textContent = 'Starting monitoring...';

    try {
        // Get session and participant data from chrome.storage
        const result = await chrome.storage.local.get(['activeSession', 'participantData']);
        const session = result.activeSession;
        const participant = result.participantData;

        console.log('Permissions granted, data from chrome.storage:', { session, participant });

        if (!session || !participant) {
            throw new Error('Session or participant data not found. Please try joining again.');
        }

        // Send message to content script via chrome.runtime
        chrome.runtime.sendMessage({
            type: 'PERMISSIONS_GRANTED',
            session,
            participant
        }, (response) => {
            console.log('Message sent to background, response:', response);
        });

        // Also send postMessage for content script to catch
        window.parent.postMessage({
            type: 'PERMISSIONS_GRANTED',
            session,
            participant
        }, '*');

        window.top.postMessage({
            type: 'PERMISSIONS_GRANTED',
            session,
            participant
        }, '*');

        console.log('✅ All messages sent, waiting for content script to start monitoring...');

        // Close the iframe after a short delay
        setTimeout(() => {
            try {
                const iframe = window.parent.document.getElementById('sparkus-join-iframe');
                if (iframe) {
                    iframe.remove();
                    console.log('Iframe removed');
                }
            } catch (e) {
                console.log('Could not remove iframe from here, content script will handle it');
            }
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        enableBtn.disabled = false;
        enableBtn.textContent = 'Enable Sparkus Monitoring';
        alert('Failed to start monitoring. Error: ' + error.message);
    }
});

console.log('Permissions script loaded');

