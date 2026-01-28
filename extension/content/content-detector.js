// Content Script - Meeting Detector
// Detects when user is on Google Meet or Zoom

(function () {
    console.log('Sparkus detector loaded');

    const currentUrl = window.location.href;
    let platform = null;

    // Detect platform
    if (currentUrl.includes('meet.google.com')) {
        platform = 'google_meet';
    } else if (currentUrl.includes('zoom.us')) {
        platform = 'zoom';
    }

    if (platform) {
        console.log('Meeting platform detected:', platform);

        // Notify background script
        try {
            if (chrome.runtime?.id) {
                chrome.runtime.sendMessage({
                    type: 'MEETING_DETECTED',
                    data: {
                        platform,
                        url: currentUrl,
                        timestamp: Date.now(),
                    }
                });
            }
        } catch (e) {
            console.warn('Sparkus: Extension context invalidated, suppressing error', e);
            return; // Exit if extension context is lost
        }

        // Check if there's an active session
        try {
            if (chrome.runtime?.id) {
                chrome.runtime.sendMessage({ type: 'CHECK_SESSION' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Sparkus warning:', chrome.runtime.lastError.message);
                        return;
                    }

                    if (response && response.session) {
                        console.log('Active session found:', response.session);

                        // Inject session UI
                        if (response.participant) {
                            // Participant mode
                            chrome.runtime.sendMessage({
                                type: 'RESTORE_SESSION',
                                session: response.session,
                                participant: response.participant
                            });
                        } else if (response.session.isHost) {
                            // Host mode
                            injectHostUI(response.session);
                        }
                    } else {
                        // No active session - show join prompt when DOM is ready
                        if (document.body) {
                            showJoinPrompt(platform);
                        } else {
                            // Wait for DOM to be ready
                            document.addEventListener('DOMContentLoaded', () => {
                                showJoinPrompt(platform);
                            });
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Sparkus: Extension context invalidated during session check', e);
        }
    }

    function showJoinPrompt(platform) {
        // Create join session UI
        const joinUI = document.createElement('div');
        joinUI.id = 'sparkus-join-prompt';
        joinUI.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 10000; font-family: Arial, sans-serif; max-width: 300px;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            <span style="color: white; font-size: 20px; font-weight: bold;">S</span>
          </div>
          <div>
            <div style="font-weight: bold; font-size: 16px; color: #1a1a1a;">Sparkus</div>
            <div style="font-size: 12px; color: #666;">Focus Tracking</div>
          </div>
        </div>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #444;">Is this a Sparkus-monitored session?</p>
        <button id="sparkus-join-btn" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
          Join Session
        </button>
        <button id="sparkus-dismiss-btn" style="width: 100%; padding: 8px; background: transparent; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 12px; margin-top: 8px;">
          Not a Sparkus session
        </button>
      </div>
    `;

        document.body.appendChild(joinUI);

        // Handle join button
        document.getElementById('sparkus-join-btn').addEventListener('click', () => {
            joinUI.remove();
            showSessionCodeEntry();
        });

        // Handle dismiss button
        document.getElementById('sparkus-dismiss-btn').addEventListener('click', () => {
            joinUI.remove();
        });
    }

    function showSessionCodeEntry() {
        // Show the join iframe
        const iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL('ui/join-session.html');
        iframe.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 999999; background: rgba(0,0,0,0.5);';
        iframe.id = 'sparkus-join-iframe';
        document.body.appendChild(iframe);
    }

    function injectParticipantUI(session, participant) {
        // Logic moved to background script injection (SET_SESSION)
        console.log('Participant UI logic handled by background injection');
    }

    function injectHostUI(session) {
        // Logic moved to background script injection (SET_SESSION)
    }
})();
