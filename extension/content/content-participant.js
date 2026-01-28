// Content Script - Participant Mode - Phase 2: Time-Based Warnings
// Handles focus tracking with countdown timers and grace periods

console.log('🎓 Sparkus participant mode loaded');

let focusTracker = null;
let messageHandlerAdded = false;
let widgetInjected = false;
let activeWarning = null; // Track current warning
let gracePeriodTimer = null; // Track grace period countdown
let isLookingAtScreen = true; // Track eye contact
let eyeTrackingEnabled = false;

// Add message listener
function setupMessageListener() {
    if (messageHandlerAdded) return;

    console.log('Setting up message listener...');

    // Listen for postMessage from iframe
    window.addEventListener('message', async (event) => {
        console.log('Received postMessage:', event.data.type);

        if (event.data.type === 'PERMISSIONS_GRANTED') {
            const { session, participant } = event.data;
            console.log('PERMISSIONS_GRANTED received via postMessage!', { session, participant });

            // Close the permissions modal
            const modal = document.getElementById('sparkus-join-iframe');
            if (modal) {
                console.log('Removing modal...');
                modal.remove();
            }

            // Start monitoring (only once)
            if (!widgetInjected) {
                await startMonitoring(session, participant);
            }
        } else if (event.data.type === 'CLOSE_SPARKUS_MODAL') {
            const modal = document.getElementById('sparkus-join-iframe');
            if (modal) modal.remove();
        }
    });

    // Also listen for chrome.runtime messages from background script
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log('Received chrome.runtime message:', message.type);

        if (message.type === 'PERMISSIONS_GRANTED') {
            const { session, participant } = message;
            console.log('PERMISSIONS_GRANTED received via chrome.runtime!', { session, participant });

            // Close the permissions modal
            const modal = document.getElementById('sparkus-join-iframe');
            if (modal) {
                console.log('Removing modal...');
                modal.remove();
            }

            // Start monitoring (only once)
            if (!widgetInjected) {
                await startMonitoring(session, participant);
                sendResponse({ success: true, message: 'Monitoring started' });
            } else {
                sendResponse({ success: false, message: 'Widget already injected' });
            }
        }

        return true; // Keep channel open for async response
    });

    messageHandlerAdded = true;
    console.log('Message listener ready!');
}

async function startMonitoring(session, participant) {
    console.log('🚀 Starting Sparkus monitoring...', { session, participant });

    // Inject compact floating widget
    injectWidget(session, participant);

    // Send heartbeat every 30 seconds
    setInterval(async () => {
        try {
            if (!chrome.runtime?.id) return;

            const response = await chrome.runtime.sendMessage(chrome.runtime.id, {
                type: 'SEND_HEARTBEAT',
                participantId: participant.id,
            });

            if (response.success) {
                console.log('✅ Heartbeat sent via background script');
            } else {
                console.error('❌ Heartbeat failed:', response.error);
            }
        } catch (error) {
            console.error('❌ Heartbeat error:', error);
        }
    }, 30000);
}

function injectWidget(session, participant) {
    if (document.getElementById('sparkus-widget-container')) return;

    console.log('Injecting premium widget...');
    widgetInjected = true;

    // Inject CSS
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('ui/widget.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Create Container
    const container = document.createElement('div');
    container.id = 'sparkus-widget-container';
    container.className = 'sparkus-widget';

    // HTML Structure matching new card design
    container.innerHTML = `
        <div class="widget-header">
            <div class="widget-label">
                <span class="widget-icon">⚡</span>
                Focus
            </div>
            <div class="info-icon" title="Focus Score">ⓘ</div>
        </div>

        <div class="widget-body">
            <div class="focus-percent" id="sparkus-score">100%</div>
            <div class="status-dot" id="sparkus-status-dot"></div>
        </div>

        <div class="minimized-content">S</div>
    `;

    document.body.appendChild(container);

    // Minimize Logic
    // Minimize Logic
    const infoIcon = container.querySelector('.info-icon');
    let isMinimized = false;

    // Toggle minimize on double click or icon click
    container.addEventListener('dblclick', toggleMinimize);
    if (infoIcon) infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        // Maybe show info modal? For now toggle minimize
        toggleMinimize();
    });

    function toggleMinimize() {
        isMinimized = !isMinimized;
        container.classList.toggle('minimized', isMinimized);
    }

    // Recording Logic
    const recBtn = container.querySelector('#sparkus-rec-btn-action');
    const recText = container.querySelector('#sparkus-rec-text');
    const recIndicator = container.querySelector('#sparkus-indicator-rec');

    if (recBtn) {
        recBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            recBtn.textContent = 'Requesting...';
            recBtn.disabled = true;
            recBtn.style.opacity = '0.7';

            window.dispatchEvent(new CustomEvent('SparkusStartRecording'));

            // Optimistic UI update
            setTimeout(() => {
                recBtn.style.display = 'none'; // Hide button after start
                recText.textContent = 'Recording ON';
                recIndicator.style.color = '#f44336';
                recText.style.color = '#f44336';
                recText.style.fontWeight = 'bold';
            }, 1500);
        });
    }

    // Drag Logic
    const header = container.querySelector('.widget-header');
    let isDragging = false, currentX, currentY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        initialX = e.clientX - container.offsetLeft;
        initialY = e.clientY - container.offsetTop;
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            container.style.left = (e.clientX - initialX) + 'px';
            container.style.top = (e.clientY - initialY) + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'default';
    });

    // Handle clicks on minimized widget to expand
    container.addEventListener('click', (e) => {
        if (isMinimized && !isDragging) {
            toggleMinimize();
        }
    });

    startFocusTracking(participant, session);
}

function startFocusTracking(participant, session) {
    let focusScore = 100;
    let isTabActive = true;
    let warningCount = 0;

    // Get settings from session (with defaults)
    const settings = session.settings || {};
    const maxWarnings = settings.maxWarnings || 3;
    const tabSwitchGracePeriod = settings.tabSwitchGracePeriod || 10; // seconds
    const tabSwitchPenalty = settings.tabSwitchPenalty || 10; // percentage
    const recoveryRate = settings.recoveryRate || 1; // percentage per 5 seconds

    // Track tab visibility with grace period
    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;

        if (document.hidden) {
            // Tab switched away - start grace period
            handleTabSwitch(participant, focusScore, tabSwitchGracePeriod, tabSwitchPenalty, maxWarnings, warningCount);
        } else {
            // Tab returned - cancel grace period if active
            if (gracePeriodTimer) {
                clearTimeout(gracePeriodTimer);
                gracePeriodTimer = null;
                dismissWarning();
                console.log('✅ Returned to tab within grace period - no penalty');
            }
        }
    });

    // Track window minimization and visibility
    let windowMinimizedStart = null;
    const minimizationGracePeriod = settings.minimizationGracePeriod || 5; // seconds
    const minimizationPenalty = settings.minimizationPenalty || 15; // percentage

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && !document.hidden) {
            // Window minimized (different from tab switch)
            windowMinimizedStart = Date.now();
            console.log('⚠️ Window minimized detected');
        } else if (document.visibilityState === 'visible' && windowMinimizedStart) {
            const duration = (Date.now() - windowMinimizedStart) / 1000;
            windowMinimizedStart = null;

            if (duration > minimizationGracePeriod) {
                focusScore = Math.max(0, focusScore - minimizationPenalty);
                updateWidget(focusScore, isTabActive);
                warningCount++;
                showWarning({
                    type: 'window_minimized',
                    title: 'Window Minimization Penalty',
                    message: `You minimized the window for ${Math.round(duration)}s. Focus reduced by ${minimizationPenalty}%.`,
                    warningCount,
                    maxWarnings,
                    countdown: null,
                });
                sendFocusEvent(participant, 'window_minimized_violation', focusScore, isTabActive, {
                    penalty: minimizationPenalty,
                    duration: duration
                });
            }
        }
    });

    // Track split-screen / window size changes
    let isFullscreen = isWindowFullscreen();
    let splitScreenStart = null;
    const splitScreenGracePeriod = settings.splitScreenGracePeriod || 30; // seconds
    const splitScreenPenalty = settings.splitScreenPenalty || 5; // percentage
    const splitScreenAllowed = settings.splitScreenAllowed || false;

    function checkWindowSize() {
        const nowFullscreen = isWindowFullscreen();

        if (isFullscreen && !nowFullscreen && !splitScreenAllowed) {
            // Entered split-screen mode
            splitScreenStart = Date.now();
            console.log('⚠️ Split-screen mode detected');
            warningCount++;
            showWarning({
                type: 'split_screen',
                title: 'Split-Screen Detected',
                message: `Please return to fullscreen within ${splitScreenGracePeriod}s.`,
                warningCount,
                maxWarnings,
                countdown: null,
            });
        } else if (!isFullscreen && nowFullscreen && splitScreenStart) {
            // Returned to fullscreen
            const duration = (Date.now() - splitScreenStart) / 1000;
            splitScreenStart = null;

            if (duration > splitScreenGracePeriod) {
                focusScore = Math.max(0, focusScore - splitScreenPenalty);
                updateWidget(focusScore, isTabActive);
                sendFocusEvent(participant, 'split_screen_violation', focusScore, isTabActive, {
                    penalty: splitScreenPenalty,
                    duration: duration
                });
            } else {
                console.log('✅ Returned to fullscreen within grace period');
            }
        }

        isFullscreen = nowFullscreen;
    }

    // Check window size every 2 seconds
    setInterval(checkWindowSize, 2000);

    // URL Monitoring and Whitelist Checking
    const whitelistedUrls = settings.whitelistedUrls || [];
    const urlCheckInterval = settings.urlCheckInterval || 5000; // ms
    let lastCheckedUrl = window.location.href;

    function checkUrl() {
        const currentUrl = window.location.href;

        if (currentUrl !== lastCheckedUrl) {
            console.log('🔍 URL changed:', currentUrl);
            lastCheckedUrl = currentUrl;

            // Check if URL is whitelisted
            if (whitelistedUrls.length > 0) {
                const isWhitelisted = whitelistedUrls.some(pattern => {
                    // Simple wildcard matching
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                    return regex.test(currentUrl);
                });

                if (!isWhitelisted) {
                    focusScore = Math.max(0, focusScore - 20); // Bigger penalty for non-whitelisted sites
                    updateWidget(focusScore, isTabActive);
                    warningCount++;
                    showWarning({
                        type: 'non_whitelisted_url',
                        title: 'Unauthorized Website',
                        message: 'You navigated to a non-whitelisted website. Focus reduced by 20%.',
                        warningCount,
                        maxWarnings,
                        countdown: null,
                    });
                    sendFocusEvent(participant, 'non_whitelisted_url_violation', focusScore, isTabActive, {
                        penalty: 20,
                        unauthorizedUrl: currentUrl
                    });
                    console.log('❌ Non-whitelisted URL detected');
                }
            }
        }
    }

    // Check URL periodically (only if whitelist is configured)
    if (whitelistedUrls.length > 0) {
        setInterval(checkUrl, urlCheckInterval);
        console.log(`🔍 URL monitoring enabled with ${whitelistedUrls.length} whitelisted patterns`);
    }

    // Network Monitoring
    let isNetworkStable = navigator.onLine;
    let offlineStartTime = null;

    window.addEventListener('online', () => {
        isNetworkStable = true;
        console.log('✅ Network connection restored');

        if (offlineStartTime) {
            const duration = (Date.now() - offlineStartTime) / 1000;
            offlineStartTime = null;

            // Send network issue resolved event
            sendFocusEvent(participant, 'network_issue_resolved', focusScore, isTabActive, {
                duration: duration,
                networkStable: true
            });

            // Show notification
            showWarning({
                type: 'network_restored',
                title: 'Connection Restored',
                message: 'Your network connection is back online.',
                warningCount,
                maxWarnings,
                countdown: null
            });
        }
    });

    window.addEventListener('offline', () => {
        isNetworkStable = false;
        offlineStartTime = Date.now();
        console.log('❌ Network connection lost');

        // Send network issue event (might be queued by browser)
        sendFocusEvent(participant, 'network_issue_detected', focusScore, isTabActive, {
            networkStable: false
        });

        // Show warning
        showWarning({
            type: 'network_lost',
            title: 'Network Connection Lost',
            message: 'Your internet connection is unstable. This will be logged but won\'t reduce your focus score.',
            warningCount,
            maxWarnings,
            countdown: null
        });
    });

    // Update score every 5 seconds
    setInterval(() => {
        if (isTabActive && isLookingAtScreen && focusScore < 100) {
            focusScore = Math.min(100, focusScore + recoveryRate); // Recover if focused
            updateWidget(focusScore, isTabActive);
        } else if (!isLookingAtScreen && eyeTrackingEnabled) {
            // Penalty for looking away
            focusScore = Math.max(0, focusScore - 2); // -2% per 5s cycle
            updateWidget(focusScore, isTabActive);
        }

        // Check for low focus warning
        if (focusScore < 50 && isTabActive) {
            warningCount++;
            showWarning({
                type: 'low_focus',
                title: 'Low Focus Score',
                message: 'Your focus score is very low! Pay attention to the meeting.',
                warningCount,
                maxWarnings,
                countdown: null,
            });
        }

        sendFocusEvent(participant, 'focus_update', focusScore, isTabActive);
    }, 5000);

    console.log('✅ Focus tracking started with time-based warnings');
    console.log(`⚙️ Settings: Grace period=${tabSwitchGracePeriod}s, Penalty=${tabSwitchPenalty}%, Recovery=${recoveryRate}%/5s`);

    // Initialize Eye Tracking
    startEyeTracking(settings, participant, maxWarnings, warningCount);
}

// Eye Tracking Implementation
function startEyeTracking(settings, participant, maxWarnings, warningCount) {
    if (typeof webgazer === 'undefined') {
        console.warn('⚠️ WebGazer not loaded - Eye tracking disabled');
        return;
    }

    console.log('👁️ Initializing Eye Tracking...');
    eyeTrackingEnabled = true;

    // Thresholds
    const eyeGracePeriod = settings.eyeGracePeriod || 10; // seconds looking away
    const eyePenalty = settings.eyePenalty || 5; // percentage

    let lookingAwayStart = null;
    let eyeWarningShown = false;

    // Start WebGazer
    webgazer.setGazeListener((data, elapsedTime) => {
        if (data == null) {
            // Face not detected or eyes closed
            // Treat as looking away if sustained
            handleLookingAway(true);
            return;
        }

        const x = data.x;
        const y = data.y;

        // Check if gaze is within window bounds (with some margin)
        const margin = 50;
        const isWithinBounds = (
            x >= -margin &&
            x <= window.innerWidth + margin &&
            y >= -margin &&
            y <= window.innerHeight + margin
        );

        handleLookingAway(!isWithinBounds);
    }).begin();

    // Hide video feed for privacy/non-intrusiveness
    webgazer.showVideo(false);
    webgazer.showFaceOverlay(false);
    webgazer.showFaceFeedbackBox(false);

    console.log('👁️ Eye tracking started');

    function handleLookingAway(isAway) {
        isLookingAtScreen = !isAway;

        // Update widget eye icon if exists (optional)
        // const eyeIcon = document.getElementById('sparkus-eye-icon');
        // if (eyeIcon) eyeIcon.style.color = isAway ? 'red' : 'green';

        if (isAway) {
            if (!lookingAwayStart) {
                lookingAwayStart = Date.now();
            } else {
                const duration = (Date.now() - lookingAwayStart) / 1000;

                if (duration > eyeGracePeriod && !eyeWarningShown) {
                    eyeWarningShown = true;
                    console.log(`⚠️ Looking away for ${Math.round(duration)}s`);

                    // Show warning
                    showWarning({
                        type: 'looking_away',
                        title: 'Attention Check',
                        message: 'Please look at the screen to maintain focus score.',
                        warningCount: warningCount++,
                        maxWarnings,
                        countdown: null
                    });
                }

                if (duration > eyeGracePeriod + 5) { // 5s after warning
                    // Apply penalty
                    // We handle penalty via the main loop or here?
                    // Let's rely on the focus update loop to degrade score based on isLookingAtScreen?
                    // Or apply one-off penalty?
                    // Spec says "Sustained off-screen gaze -> -2% per cycle".
                    // So we don't apply sudden penalty here, but flags are used in interval.
                }
            }
        } else {
            lookingAwayStart = null;
            if (eyeWarningShown) {
                eyeWarningShown = false;
                dismissWarning();
                console.log('✅ Gaze returned to screen');
            }
        }
    }
}

function handleTabSwitch(participant, currentScore, gracePeriod, penalty, maxWarnings, warningCount) {
    console.log(`⚠️ Tab switched - starting ${gracePeriod}s grace period`);

    let countdown = gracePeriod;
    warningCount++;

    // Show warning with countdown
    showWarning({
        type: 'tab_switch',
        title: 'Tab Switch Detected',
        message: `Please return to the meeting within ${countdown} seconds to avoid penalty.`,
        warningCount,
        maxWarnings,
        countdown,
    });

    // Start countdown
    const countdownInterval = setInterval(() => {
        countdown--;
        updateWarningCountdown(countdown);

        if (countdown <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    // Set grace period timer
    gracePeriodTimer = setTimeout(() => {
        clearInterval(countdownInterval);

        // Apply penalty
        const newScore = Math.max(0, currentScore - penalty);
        updateWidget(newScore, false);

        // Update warning to show penalty applied
        updateWarningToPenalty(penalty);

        // Send violation event
        sendFocusEvent(participant, 'tab_switch_violation', newScore, false, {
            penalty: penalty,
            duration: gracePeriod, // or actual time away?
            isExamMode: session.settings?.examMode
        });

        console.log(`❌ Grace period expired - applied ${penalty}% penalty`);

        // Auto-dismiss after showing penalty
        setTimeout(() => {
            dismissWarning();
        }, 3000);

        gracePeriodTimer = null;
    }, gracePeriod * 1000);
}

function updateWidget(score, isTabActive) {
    const scoreEl = document.getElementById('sparkus-score');
    const statusDot = document.getElementById('sparkus-status-dot');

    if (scoreEl) {
        scoreEl.textContent = Math.round(score) + '%';

        // Dynamic color for score text
        if (score < 50) scoreEl.style.color = 'var(--danger-500)';
        else if (score < 70) scoreEl.style.color = 'var(--warning-500)';
        else scoreEl.style.color = 'var(--text-primary)';
    }

    if (statusDot) {
        // Reset classes
        statusDot.className = 'status-dot';

        // Apply status class
        if (score < 50) statusDot.classList.add('danger');
        else if (score < 70) statusDot.classList.add('warning');

        // Add tab status indication? 
        // If tab is inactive, maybe pulse or change color?
        // Current design just uses the dot color based on score/status
        if (!isTabActive) {
            statusDot.style.opacity = '0.5';
        } else {
            statusDot.style.opacity = '1';
        }
    }
}

function showWarning(config) {
    const { type, title, message, warningCount, maxWarnings, countdown } = config;

    // Don't show too many warnings
    if (warningCount > maxWarnings) return;

    // Dismiss existing warning
    dismissWarning();

    // Create warning popup
    const warning = document.createElement('div');
    warning.id = 'sparkus-warning';

    // Icon
    const icon = document.createElement('div');
    icon.textContent = countdown !== null ? '⏱️' : '⚠️';
    icon.className = 'sparkus-warning-icon';

    // Title
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.className = 'sparkus-warning-title';
    if (type === 'tab_switch' || countdown !== null) {
        titleEl.classList.add('danger');
    }

    // Message
    const msg = document.createElement('div');
    msg.id = 'sparkus-warning-message';
    msg.textContent = message;
    msg.className = 'sparkus-warning-message';

    // Count
    const count = document.createElement('div');
    count.textContent = `Warning ${warningCount} of ${maxWarnings}`;
    count.className = 'sparkus-warning-count';

    warning.appendChild(icon);
    warning.appendChild(titleEl);
    warning.appendChild(msg);
    warning.appendChild(count);

    // Only add button for non-countdown warnings
    if (countdown === null) {
        const btn = document.createElement('button');
        btn.textContent = 'Got It';
        btn.className = 'sparkus-warning-btn';
        btn.addEventListener('click', () => dismissWarning());
        warning.appendChild(btn);

        // Auto-dismiss after 5 seconds
        setTimeout(() => dismissWarning(), 5000);
    }

    document.body.appendChild(warning);
    activeWarning = warning;

    console.log(`⚠️ Warning ${warningCount}/${maxWarnings}: ${title}`);
}


function updateWarningCountdown(seconds) {
    const msg = document.getElementById('sparkus-warning-message');
    if (msg) {
        msg.textContent = `Please return to the meeting within ${seconds} seconds to avoid penalty.`;
    }
}

function updateWarningToPenalty(penalty) {
    const warning = document.getElementById('sparkus-warning');
    if (!warning) return;

    // Clear existing content safely (TrustedHTML fix)
    while (warning.firstChild) {
        warning.removeChild(warning.firstChild);
    }

    const icon = document.createElement('div');
    icon.textContent = '❌';
    icon.className = 'sparkus-warning-icon';

    const title = document.createElement('div');
    title.textContent = 'Penalty Applied';
    title.className = 'sparkus-warning-title danger';

    const msg = document.createElement('div');
    msg.textContent = `Your focus score has been reduced by ${penalty}% for staying away from the meeting.`;
    msg.className = 'sparkus-warning-message';

    warning.appendChild(icon);
    warning.appendChild(title);
    warning.appendChild(msg);
}

function dismissWarning() {
    if (activeWarning && document.body.contains(activeWarning)) {
        activeWarning.remove();
        activeWarning = null;
    }
}

async function sendFocusEvent(participant, eventType, focusScore, isTabActive, details = {}) {
    try {
        const eventData = {
            participantId: participant.id,
            sessionId: participant.sessionId,
            eventType,
            isLookingAtScreen: isLookingAtScreen, // Real eye tracking status
            isTabActive,
            isWindowVisible: true,
            currentUrl: window.location.href,
            networkStable: navigator.onLine, // Real status
            ...details
        };

        // Check if extension context is valid
        if (!chrome.runtime?.id) {
            console.warn('⚠️ Extension context invalid or missing ID. Cannot send event.');
            return;
        }

        const response = await chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'SEND_FOCUS_EVENT',
            data: eventData,
        });

        if (response.success) {
            console.log('✅ Focus event sent via background script');
        } else {
            console.error('❌ Focus event failed:', response.error);
        }
    } catch (error) {
        console.error('❌ Failed to send focus event:', error);
    }
}

function isWindowFullscreen() {
    // Check standard fullscreen API
    if (document.fullscreenElement) return true;

    // Check window dimensions against screen dimensions
    // Allow small tolerance for borders/taskbars
    const widthMatch = Math.abs(window.outerWidth - screen.availWidth) < 50 || Math.abs(window.outerWidth - screen.width) < 50;
    const heightMatch = Math.abs(window.outerHeight - screen.availHeight) < 50 || Math.abs(window.outerHeight - screen.height) < 50;

    return widthMatch && heightMatch;
}

// Initialize
setupMessageListener();
console.log('Participant content script ready with browser monitoring!');
