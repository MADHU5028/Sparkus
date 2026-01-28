// Sparkus Background Service Worker
// Handles meeting detection, session state, and communication

const API_URL = 'http://localhost:5000/api';
let currentSession = null;
let participantData = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    switch (message.type) {
        case 'CHECK_SESSION':
            // Return current session from storage
            chrome.storage.local.get(['activeSession', 'participantData'], (result) => {
                sendResponse({ session: result.activeSession, participant: result.participantData });
            });
            return true; // Keep channel open for async response

        case 'JOIN_SESSION':
            joinSession(message.data).then((result) => {
                if (result.success) {
                    // Store session and participant data
                    chrome.storage.local.set({
                        activeSession: result.session,
                        participantData: result.participant
                    }, () => {
                        sendResponse(result);
                    });
                } else {
                    sendResponse(result);
                }
            });
            return true;

        case 'LEAVE_SESSION':
            // Clear session data
            chrome.storage.local.remove(['activeSession', 'participantData'], () => {
                sendResponse({ success: true });
            });
            return true;

        case 'GET_SESSION_BY_CODE':
            getSessionByCode(message.code).then(sendResponse);
            return true;

        case 'SEND_FOCUS_EVENT':
            sendFocusEvent(message.data).then(sendResponse);
            return true;

        case 'SEND_HEARTBEAT':
            sendHeartbeat(message.participantId).then(sendResponse);
            return true;

        case 'RESTORE_SESSION':
            // Inject participant script into the sender tab to restore widget
            if (sender.tab && sender.tab.id) {
                console.log('Restoring session for tab:', sender.tab.id);
                chrome.scripting.executeScript({
                    target: { tabId: sender.tab.id },
                    files: ['content/content-participant.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Script injection failed:', chrome.runtime.lastError);
                    } else {
                        console.log('content-participant.js restored successfully');

                        // Initialize the script with session data
                        setTimeout(() => {
                            chrome.tabs.sendMessage(sender.tab.id, {
                                type: 'PERMISSIONS_GRANTED',
                                session: message.session,
                                participant: message.participant
                            });
                        }, 500);
                    }
                });
            }
            return true;

        case 'PERMISSIONS_GRANTED':
            // Forward permissions granted message to content script
            console.log('Background received PERMISSIONS_GRANTED, forwarding to content script...');
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    // Inject the participant script first
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        files: ['content/content-participant.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Script injection failed:', chrome.runtime.lastError);
                        } else {
                            console.log('content-participant.js injected successfully');

                            // Give it a moment to initialize listeners
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    type: 'PERMISSIONS_GRANTED',
                                    session: message.session,
                                    participant: message.participant
                                }, (response) => {
                                    console.log('Content script response:', response);
                                    sendResponse({ success: true });

                                    // Also verify connection
                                    if (chrome.runtime.lastError) {
                                        console.warn('Message send warning:', chrome.runtime.lastError);
                                    }
                                });
                            }, 500);
                        }
                    });
                }
            });
            return true;

        default:
            console.warn('Unknown message type:', message.type);
    }
});



// Get session by code from API
async function getSessionByCode(code) {
    try {
        const response = await fetch(`${API_URL}/sessions/code/${code}`);
        if (!response.ok) {
            throw new Error('Session not found');
        }
        const data = await response.json();
        return { success: true, session: data.session };
    } catch (error) {
        console.error('Get session error:', error);
        return { success: false, error: error.message };
    }
}

// Join session as participant
async function joinSession(data) {
    try {
        // First, get session details
        const sessionResponse = await fetch(`${API_URL}/sessions/code/${data.sessionCode}`);
        if (!sessionResponse.ok) {
            throw new Error('Session not found');
        }
        const sessionData = await sessionResponse.json();

        // Then join as participant
        const response = await fetch(`${API_URL}/participants/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionCode: data.sessionCode,
                fullName: data.fullName,
                rollNumber: data.rollNumber,
                email: data.email || '',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to join session');
        }

        const result = await response.json();
        console.log('✅ Joined session successfully:', result);

        return {
            success: true,
            participant: result.participant,
            session: sessionData.session
        };
    } catch (error) {
        console.error('Join session error:', error);
        return { success: false, error: error.message };
    }
}

// Send focus event to backend
async function sendFocusEvent(eventData) {
    try {
        const response = await fetch(`${API_URL}/focus/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            throw new Error('Failed to send focus event');
        }

        const result = await response.json();
        console.log('✅ Focus event sent successfully');
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Send focus event error:', error);
        return { success: false, error: error.message };
    }
}

// Send heartbeat to backend
async function sendHeartbeat(participantId) {
    try {
        const response = await fetch(`${API_URL}/participants/${participantId}/heartbeat`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to send heartbeat');
        }

        const result = await response.json();
        console.log('✅ Heartbeat sent successfully');
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Send heartbeat error:', error);
        return { success: false, error: error.message };
    }
}

// Restore session state on startup
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['activeSession', 'participantData'], (result) => {
        if (result.activeSession) {
            console.log('✅ Session restored on startup:', result.activeSession);
        }
    });
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Sparkus extension installed');
});

console.log('Sparkus background service worker loaded');
