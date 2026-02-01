// Content Script - Participant Mode - Phase 3: Camera Modes & Refined Focus Logic
// Handles focus tracking with Camera A/B modes, refined eye tracking, and aggregated reporting.

console.log('[Sparkus] Content script injected');
console.log('🎓 Sparkus participant mode loaded (Phase 3)');


(function () {
    if (window.sparkusParticipantInjected) {
        console.log('[Sparkus] Participant script already injected, skipping.');
        return;
    }
    window.sparkusParticipantInjected = true;

    // const DEV_MODE = true;
    let focusTracker = null;
    let isGlobalEyeTrackingInitialized = false;
    let messageHandlerAdded = false;
    let widgetInjected = false;
    let activeWarning = null;
    let gracePeriodTimer = null;
    let isLookingAtScreen = true;
    let eyeTrackingEnabled = false;
    let cameraMode = 'OFF'; // 'ON' (Mode A) or 'OFF' (Mode B)
    let isMonitoringActive = false; // Guard for duplicate monitoring
    let sessionState = {
        startTime: null,
        focusDrops: {}, // reason -> { count: 0, duration: 0 }
        cameraOnDuration: 0,
        cameraOffDuration: 0,
        mainIntervalId: null
    };

    // State for aggregation
    let violationsBuffer = [];
    let warningCount = 0;

    // Add message listener
    function setupMessageListener() {
        if (messageHandlerAdded) return;

        console.log('Setting up message listener...');

        // Listen for postMessage from iframe
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'PERMISSIONS_GRANTED') {
                const { session, participant, savedScore } = event.data;
                console.log('PERMISSIONS_GRANTED received via postMessage!', { session, participant, savedScore });

                // Close the permissions modal
                const modal = document.getElementById('sparkus-join-iframe');
                if (modal) modal.remove();

                // Start monitoring (only once)
                if (!widgetInjected) {
                    await startMonitoring(session, participant, savedScore);
                }
            } else if (event.data.type === 'CLOSE_SPARKUS_MODAL') {
                const modal = document.getElementById('sparkus-join-iframe');
                if (modal) modal.remove();
            }
        });

        // Also listen for chrome.runtime messages from background script
        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            console.log('[Sparkus] Message received:', message);
            if (message.type === 'PERMISSIONS_GRANTED') {
                const { session, participant, savedScore } = message;
                console.log('PERMISSIONS_GRANTED received via chrome.runtime!', { session, participant, savedScore });

                const modal = document.getElementById('sparkus-join-iframe');
                if (modal) modal.remove();

                if (!widgetInjected) {
                    await startMonitoring(session, participant, savedScore);
                    sendResponse({ success: true, message: 'Monitoring started' });
                } else {
                    sendResponse({ success: false, message: 'Widget already injected' });
                }
            }
            return true;
        });

        messageHandlerAdded = true;
        console.log('Message listener ready!');
    }

    async function startMonitoring(session, participant, savedScore) {
        if (isMonitoringActive) {
            console.warn('⚠️ Monitoring already active, ignoring duplicate start request.');
            return;
        }
        isMonitoringActive = true;

        console.log('🚀 Starting Sparkus monitoring...', { session, participant, savedScore });

        // Tab Visibility Detection
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('[Sparkus][Event] TAB_INACTIVE');
            } else {
                console.log('[Sparkus][Event] TAB_ACTIVE');
            }
        });

        // Inject compact floating widget
        injectWidget(session, participant);

        // Initial Camera Check & Mode Selection
        await initializeCameraMode(session, participant);

        // Start Focus Tracking Loop
        sessionState.startTime = Date.now();
        startFocusTracking(participant, session, savedScore);

        // Send heartbeat every 30 seconds
        setInterval(async () => {
            // if (DEV_MODE) return;
            try {
                if (!chrome.runtime?.id) return;
                await chrome.runtime.sendMessage(chrome.runtime.id, {
                    type: 'SEND_HEARTBEAT',
                    participantId: participant.id,
                });
            } catch (error) {
                console.error('❌ Heartbeat error:', error);
            }
        }, 30000);
    }

    async function initializeCameraMode(session, participant) {
        try {
            // Try to get camera stream just to check permissions/availability
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // If successful, stop the tracks immediately - WebGazer manages its own stream
            stream.getTracks().forEach(track => track.stop());

            console.log('🟢 Camera available - Activating Mode A (Full Focus)');
            cameraMode = 'ON';
            eyeTrackingEnabled = true;

            // Initialize WebGazer
            // startEyeTracking(session.settings || {}, participant);
            console.log('[Sparkus][EyeTracking] WebGazer disabled.');

            showToast('Camera ON: Full Focus Mode Active');

        } catch (err) {
            console.warn('🟡 Camera unavailable/denied - Activating Mode B (Fallback)', err);
            cameraMode = 'OFF';
            eyeTrackingEnabled = false;

            // Show persistent warning for Mode B
            showModeBWarning();
        }
    }

    function showModeBWarning() {
        const warning = document.createElement('div');
        warning.id = 'sparkus-mode-b-banner';
        warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: rgba(255, 193, 7, 0.9);
        color: #000;
        text-align: center;
        padding: 5px;
        font-size: 14px;
        z-index: 99999;
        font-weight: 500;
        pointer-events: none;
    `;
        warning.textContent = "⚠️ Camera is OFF. Focus tracking is limited. Eye tracking features disabled.";
        document.body.appendChild(warning);

        // Auto-fade out after 10s to not annoy? Or keep it? Requirement says "Displays a transparency warning"
        // Let's make it semi-transparent after a while
        setTimeout(() => {
            warning.style.opacity = '0.5';
        }, 5000);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: #fff;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 100000;
        opacity: 0;
        transition: opacity 0.3s;
    `;
        document.body.appendChild(toast);
        setTimeout(() => toast.style.opacity = '1', 100);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

        // HTML Structure
        container.innerHTML = `
        <div class="widget-header">
            <div class="widget-label">
                <span class="widget-icon">⚡</span>
                <span id="sparkus-mode-badge" style="font-size: 10px; opacity: 0.7; margin-right: 5px;">${cameraMode === 'ON' ? 'A' : 'B'}</span>
                Focus
            </div>
            <div class="info-icon" title="Focus Score">ⓘ</div>
        </div>

        <div class="widget-body">
            <div class="focus-percent" id="sparkus-score" style="display: block; opacity: 1; visibility: visible;">100%</div>
            <div class="status-dot" id="sparkus-status-dot"></div>
        </div>

        <div class="minimized-content">S</div>
    `;

        // Force styles to ensure visibility against Google Meet background
        container.style.display = 'block';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        container.style.zIndex = '2147483647'; // Max integer value

        document.body.appendChild(container);
        setupWidgetInteractions(container);
    }

    function setupWidgetInteractions(container) {
        const infoIcon = container.querySelector('.info-icon');
        let isMinimized = false;

        container.addEventListener('dblclick', toggleMinimize);
        if (infoIcon) infoIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMinimize();
        });

        function toggleMinimize() {
            isMinimized = !isMinimized;
            container.classList.toggle('minimized', isMinimized);
        }

        // Drag Logic
        const header = container.querySelector('.widget-header');
        let isDragging = false, initialX, initialY;

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
    }

    function startFocusTracking(participant, session, initialScore) {
        let focusScore = (typeof initialScore === 'number') ? initialScore : 100;
        let focusHistory = []; // Local history log
        let lastCameraMode = null; // Track camera state transitions
        console.log('Initializing focus score to:', focusScore);

        // Config from Session
        const settings = session.settings || {};
        const isExamMode = session.modes?.examMonitoring || settings.examMonitoringEnabled;

        // Penalties & Grace Periods (Seconds)
        const GRACE = {
            TAB: settings.tabSwitchGracePeriod || (isExamMode ? 0 : 10),
            SPLIT: settings.splitScreenGracePeriod || 10,
            URL: 5,
            EYE: settings.eyeGracePeriod || 5,
            CAMERA: 10 // Time to turn camera back on in Exam Mode
        };

        const PENALTY = {
            TAB: settings.tabSwitchPenalty || (isExamMode ? 5 : 2),
            SPLIT: settings.splitScreenPenalty || 2,
            URL: 5,
            EYE: settings.eyePenalty || 2,
            CAMERA: isExamMode ? 10 : 0 // Heavy penalty for camera off in Exam Mode
        };

        const RECOVERY_RATE = settings.recoveryRate || (isExamMode ? 0 : 1); // No recovery in exam mode? Or slower?

        // State Tracking for Penalties (Timestamp of start of violation)
        let violationStart = {
            tab: null,
            split: null,
            url: null,
            eye: null,
            camera: null,
            minimized: null,
            split_focus: null
        };

        // Warnings Shown State (to avoid spamming)
        let warningActive = {
            tab: false,
            split: false,
            url: false,
            eye: false,
            camera: false,
            minimized: false,
            split_focus: false
        };

        // Camera OFF Penalty State
        let cameraOffStartTime = null;
        let lastCameraPenaltyTime = null;

        // Network State
        let networkIssueStart = null;
        let networkIssuesHistory = [];

        // --- 3. BROWSER ACTIVITY LISTENERS (ALWAYS ACTIVE) ---

        // Tab Switching / Minimization (Visibility API)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Started Violation
                if (!violationStart.tab) violationStart.tab = Date.now();
                if (!violationStart.minimized) violationStart.minimized = Date.now();
                console.log('[Sparkus][Event] WINDOW_MINIMIZED');

                // Immediate Logic: Warn if not already warned
                if (!warningActive.tab) {
                    const limit = GRACE.TAB;
                    showWarning({
                        type: 'tab_switch',
                        title: isExamMode ? '❌ Tab Switching Prohibited' : '⚠️ Tab Switched',
                        message: isExamMode ? 'Return immediately!' : `Return in ${limit}s to avoid penalty.`,
                        countdown: limit
                    });
                    warningActive.tab = true;
                }
            } else {
                // Returned
                if (violationStart.tab) {
                    // Determine if penalty should have been applied happens in the Loop, 
                    // but we can clear the start time here to reset.
                    violationStart.tab = null;
                }
                if (violationStart.minimized) violationStart.minimized = null;

                if (warningActive.tab) {
                    dismissWarning();
                    warningActive.tab = false;
                }
                if (warningActive.minimized) warningActive.minimized = false;
            }
        });

        // Window Focus/Blur (Split Screen Detection)
        window.addEventListener('blur', () => {
            if (!document.hidden && !violationStart.split_focus) {
                violationStart.split_focus = Date.now();
                console.log('[Sparkus][Event] SPLIT_SCREEN_START');
            }
        });

        window.addEventListener('focus', () => {
            if (violationStart.split_focus) {
                violationStart.split_focus = null;
                console.log('[Sparkus][Event] SPLIT_SCREEN_END');
            }
            if (warningActive.split_focus) {
                dismissWarning();
                warningActive.split_focus = false;
            }
        });

        // Network Connectivity Listeners
        window.addEventListener('offline', () => {
            networkIssueStart = Date.now();
            console.log('[Sparkus][Network] OFFLINE');
        });

        window.addEventListener('online', () => {
            console.log('[Sparkus][Network] ONLINE');
            if (networkIssueStart) {
                const duration = Math.round((Date.now() - networkIssueStart) / 1000);
                console.log(`[Sparkus][Network] Issue duration: ${duration}s`);

                networkIssuesHistory.push({
                    start: new Date(networkIssueStart).toISOString(),
                    end: new Date().toISOString(),
                    duration: duration
                });

                networkIssueStart = null;
            }
        });

        // --- 2. FOCUS EVALUATION CYCLE (EVERY 5 SECONDS) ---
        sessionState.mainIntervalId = setInterval(() => {
            const now = Date.now();
            let deduction = 0;
            let currentViolations = [];

            // 2.1 CHECK CAMERA STATUS
            // Triggered by existing initializeCameraMode logic updating 'cameraMode' global

            // State Transition Logging
            // State Transition Logging
            if (cameraMode !== lastCameraMode) {
                if (cameraMode === 'ON') {
                    console.log('[Sparkus][Camera] CAMERA_ON');
                    removeCameraOffNote();
                    console.log('[Sparkus][Camera] Camera on note removed');

                    // Clear penalty timers
                    cameraOffStartTime = null;
                    lastCameraPenaltyTime = null;

                } else if (cameraMode === 'OFF') {
                    console.log('[Sparkus][Camera] CAMERA_OFF');
                    console.log('[Sparkus][Camera] Switching to ACTIVITY_ONLY_MODE');
                    showCameraOffNote();
                    console.log('[Sparkus][Camera] Camera off note shown');

                    // Start timer
                    cameraOffStartTime = Date.now();
                    lastCameraPenaltyTime = null;
                }
                lastCameraMode = cameraMode;
            }

            // 5. CAMERA OFF SPECIAL LOGIC & 6. EXAM MODE OVERRIDE
            if (cameraMode === 'OFF') {
                // Gradual Penalty Logic (Non-Exam)
                if (!isExamMode && cameraOffStartTime) {
                    const elapsedOff = (now - cameraOffStartTime) / 1000;

                    if (elapsedOff > 30) {
                        // Grace period over
                        if (lastCameraPenaltyTime === null) {
                            console.log('[Sparkus][Camera] Camera off grace period ended');
                            lastCameraPenaltyTime = now; // Mark end of grace as start of cycles
                        }

                        // Apply every 20s
                        if ((now - lastCameraPenaltyTime) >= 20000) {
                            deduction += 1;
                            lastCameraPenaltyTime = now;
                            currentViolations.push({ type: 'camera_off_sustained' });
                            console.log('[Sparkus][Penalty] CAMERA_OFF → -1%');
                            logFocusChange('CAMERA_OFF', focusScore, focusScore - 1, 1);
                            trackDropReason('camera_off_sustained', 20);
                        }
                    }
                }

                if (isExamMode) {
                    // Exam Switch: Camera Mandatory
                    if (!violationStart.camera) violationStart.camera = now;

                    // Warn immediately
                    if (!warningActive.camera) {
                        showWarning({
                            type: 'camera_off',
                            title: '📷 Camera is Required',
                            message: 'Exam Mode requires camera. Turn it on!',
                            countdown: GRACE.CAMERA
                        });
                        warningActive.camera = true;
                    }

                    // Check Grace
                    if (now - violationStart.camera > GRACE.CAMERA * 1000) {
                        deduction += PENALTY.CAMERA;
                        currentViolations.push({ type: 'camera_mandatory_violation', mode: 'exam' });
                        trackDropReason('camera_mandatory_violation', 0);
                    }
                } else {
                    // Regular Mode: Transparency Warning (Already handled by showModeBWarning static banner)
                    // Skip Eye Tracking
                    // Continue Activity Monitoring
                }
            } else {
                // Camera ON
                if (violationStart.camera) {
                    violationStart.camera = null; // Reset
                    dismissWarning();
                    warningActive.camera = false;
                }

                // 2.2 EYE TRACKING LOGIC (Only if Camera ON)
                if (eyeTrackingEnabled) {
                    if (!isLookingAtScreen) {
                        if (!violationStart.eye) violationStart.eye = now;

                        // Warn
                        if (!warningActive.eye && (now - violationStart.eye > 1000)) { // 1s buffer before warn
                            showWarning({
                                type: 'eye_gaze',
                                title: '👀 Eyes on Screen',
                                message: 'Please focus on the meeting.',
                                countdown: null // Quick warning
                            });
                            warningActive.eye = true;
                        }

                        // Penalty Phase
                        if (now - violationStart.eye > GRACE.EYE * 1000) {
                            deduction += PENALTY.EYE;
                            currentViolations.push({ type: 'eye_gaze_sustained' });
                            trackDropReason('eye_gaze_sustained', 0);
                        }
                    } else {
                        // Looking at screen
                        if (violationStart.eye) violationStart.eye = null;
                        if (warningActive.eye) {
                            dismissWarning();
                            warningActive.eye = false;
                        }
                    }
                }
            }

            // 3.1 TAB SWITCHING / MINIMIZATION (Sustained Check)
            if (document.hidden) {
                const elapsed = (now - violationStart.tab) / 1000;

                if (elapsed > 5 && !warningActive.tab) {
                    console.log(`[Sparkus][Warning] TAB_INACTIVE for ${elapsed.toFixed(1)}s`);
                    showWarning({
                        type: 'tab_switch',
                        title: isExamMode ? '❌ Tab Switching Prohibited' : '⚠️ Tab Switched',
                        message: isExamMode ? 'Return immediately!' : `Return in ${Math.ceil(10 - elapsed)}s to avoid penalty.`,
                        countdown: Math.max(0, 10 - elapsed)
                    });
                    warningActive.tab = true;
                }

                if (elapsed > 10) {
                    // Apply penalty every cycle if sustained? Or just once? 
                    // Requirement says "Apply penalty at 10 seconds", implying once threshold crossed.
                    // But if they stay away, we might want to penalize more? 
                    // For "time-based penalty", usually it's continuous or once per threshold. 
                    // Let's assume continuous deduction for now based on existing logic "deduction += PENALTY.TAB".
                    // But user specified specific logic: "Apply penalty at 10 seconds". 
                    // To avoid double counting since we run every 5s, we need to track if we already penalized for this instance?
                    // The current loop runs every 5s. 
                    // If elapsed > 10s, we deduct. Since it runs every 5s, this effectively penalizes every 5s after 10s.
                    // Let's stick to the requested "Penalty = -2%".

                    deduction += 2; // Fixed 2% as requested
                    console.log(`[Sparkus][Penalty] TAB_INACTIVE sustained (-2%)`);
                    currentViolations.push({ type: 'tab_switch_sustained', duration: elapsed });
                    trackDropReason('tab_switch_sustained', 5); // Assuming 5s interval penalty
                }
            }

            // 3.3 SPLIT SCREEN (Check)
            // Check if window size is drastically smaller than screen available
            const isSplit = (window.outerWidth < (screen.availWidth * 0.8)) || (window.outerHeight < (screen.availHeight * 0.8));

            // Settings override
            if (settings.splitScreenAllowed === false || isExamMode) {
                if (isSplit) {
                    if (!violationStart.split) violationStart.split = now;

                    if (!warningActive.split) {
                        showWarning({
                            type: 'split_screen',
                            title: 'Full Screen Required',
                            message: 'Maximize your window.',
                            countdown: GRACE.SPLIT
                        });
                        warningActive.split = true;
                    }

                    if (now - violationStart.split > GRACE.SPLIT * 1000) {
                        deduction += PENALTY.SPLIT;
                        currentViolations.push({ type: 'split_screen_violation' });
                        trackDropReason('split_screen_violation', 0);
                    }
                } else {
                    if (violationStart.split) violationStart.split = null;
                    if (warningActive.split) {
                        dismissWarning();
                        warningActive.split = false;
                    }
                }
            }

            // 3.5 WINDOW MINIMIZATION / VISIBILITY LOST (Check)
            if (violationStart.minimized && document.hidden) {
                const elapsedMin = (now - violationStart.minimized) / 1000;
                if (elapsedMin > 5 && !warningActive.minimized) {
                    console.log(`[Sparkus][Warning] Window minimized for ${elapsedMin.toFixed(1)}s`);
                    warningActive.minimized = true;
                }
                if (elapsedMin > 15) {
                    deduction += 3;
                    console.log(`[Sparkus][Penalty] WINDOW_MINIMIZED sustained (-3%)`);
                    currentViolations.push({ type: 'window_minimized', duration: elapsedMin });
                    trackDropReason('window_minimized', 5);
                }
            }

            // 3.6 SPLIT SCREEN / NO FOCUS (Focus Lost while Visible)
            if (violationStart.split_focus && !document.hidden) {
                const elapsedFocus = (now - violationStart.split_focus) / 1000;
                if (elapsedFocus > 20 && !warningActive.split_focus) {
                    console.log(`[Sparkus][Warning] Window not focused for ${elapsedFocus.toFixed(1)}s`);
                    showWarning({
                        type: 'split_focus',
                        title: '⚠️ Focus Lost',
                        message: 'Please click on the meeting window.',
                        countdown: Math.max(0, 30 - elapsedFocus)
                    });
                    warningActive.split_focus = true;
                }
                if (elapsedFocus > 30) {
                    deduction += 2;
                    console.log(`[Sparkus][Penalty] SPLIT_SCREEN sustained (-2%)`);
                    currentViolations.push({ type: 'split_focus_sustained', duration: elapsedFocus });
                    trackDropReason('split_focus_sustained', 5);
                }
            }

            // 3.4 URL WHITELIST (Periodic Check)
            const HARDCODED_WHITELIST = ['meet.google.com', 'zoom.us', 'accounts.google.com'];
            const currentDomain = window.location.hostname;
            const isWhitelisted = HARDCODED_WHITELIST.some(d => currentDomain.includes(d));

            if (!isWhitelisted) {
                if (!violationStart.url) {
                    violationStart.url = now;
                    console.log(`[Sparkus][Event] NON_WHITELISTED_SITE_START ${currentDomain}`);
                }

                const elapsedUrl = (now - violationStart.url) / 1000;
                if (elapsedUrl > 5 && !warningActive.url) {
                    console.log(`[Sparkus][Warning] Non-whitelisted site detected for ${elapsedUrl.toFixed(1)}s`);
                    showWarning({
                        type: 'url_violation',
                        title: '🚫 Unauthorized Website',
                        message: 'You are on a restricted site.',
                        countdown: Math.max(0, 10 - elapsedUrl)
                    });
                    warningActive.url = true;
                }

                if (elapsedUrl > 10) {
                    deduction += 5;
                    console.log(`[Sparkus][Penalty] NON_WHITELISTED_SITE sustained (-5%)`);
                    currentViolations.push({ type: 'unauthorized_url', url: currentDomain });
                    trackDropReason('unauthorized_url', 0); // Count occurrence
                }
            } else {
                if (violationStart.url) {
                    console.log('[Sparkus][Event] NON_WHITELISTED_SITE_END');
                    violationStart.url = null;
                }
                if (warningActive.url) {
                    dismissWarning();
                    warningActive.url = false;
                }
            }

            // 4. APPLY PENALTY
            if (deduction > 0) {
                const oldScore = focusScore;
                focusScore -= deduction;

                // Track generic drop if not specific
                // Note: We should ideally track specific reasons above where deduction is added.
                // For now, let's just log the penalty event as a fallback if needed, or rely on `trackDropReason` calls added to specific blocks.

                console.log(`[Sparkus][Focus] Score dropped to ${focusScore}%`);
                logFocusChange('PENALTY', oldScore, focusScore, deduction);
            } else {
                // Recovery (Only if NO violations active)
                const hasActiveViolations = Object.values(violationStart).some(v => v !== null);
                if (!hasActiveViolations && focusScore < 100) {
                    const oldScore = focusScore;
                    focusScore = Math.min(100, focusScore + (RECOVERY_RATE * 0.5)); // 0.5 per 5s = 6% per min
                    if (Math.floor(oldScore) !== Math.floor(focusScore)) {
                        logFocusChange('RECOVERY', oldScore, focusScore, null);
                    }
                }
            }

            // Clamp
            focusScore = Math.max(0, focusScore);

            // Update UI
            updateWidget(focusScore, !document.hidden);

            // Report
            if (currentViolations.length > 0 || deduction > 0 || (Date.now() % 30000 === 0)) {
                // Buffer violations
                violationsBuffer.push(...currentViolations);
                sendFocusUpdate(participant, focusScore, violationsBuffer);
                violationsBuffer = [];
            }

            // Persist locally
            // if (!DEV_MODE) {
            try {
                chrome.runtime.sendMessage({
                    type: 'SAVE_FOCUS_SCORE',
                    sessionCode: session.sessionCode,
                    score: focusScore
                });
            } catch (e) { /* ignore disconnected port */ }
            // }

            // --- 6. UNIFIED STATE LOGGER ---
            const activeViolationsList = Object.keys(warningActive).filter(k => warningActive[k]);
            const runningTimers = {};

            Object.keys(violationStart).forEach(key => {
                if (violationStart[key]) {
                    runningTimers[key] = Math.round((now - violationStart[key]) / 1000) + 's';
                }
            });

            // Add camera off timer if active
            if (cameraOffStartTime) {
                runningTimers['camera_off_sustained'] = Math.round((now - cameraOffStartTime) / 1000) + 's';
            }

            console.log('[Sparkus][State]', {
                focus: Math.round(focusScore) + '%',
                mode: cameraMode === 'ON' ? 'FULL_MODE' : 'ACTIVITY_ONLY_MODE',
                camera: cameraMode,
                violations: activeViolationsList,
                timers: runningTimers
            });

            // Accumulate Camera Time
            if (cameraMode === 'ON') sessionState.cameraOnDuration += 5;
            else sessionState.cameraOffDuration += 5;

        }, 5000);

        function trackDropReason(reason, duration) {
            if (!sessionState.focusDrops[reason]) {
                sessionState.focusDrops[reason] = { count: 0, totalDuration: 0 };
            }
            sessionState.focusDrops[reason].count++;
            sessionState.focusDrops[reason].totalDuration += duration;
        }

        function finalizeSession() {
            if (!sessionState.startTime) return; // Not started

            // Stop timers
            clearInterval(sessionState.mainIntervalId);

            // Calculate totals
            const totalDuration = Math.round((Date.now() - sessionState.startTime) / 1000);

            // Network Summary
            const networkOfflineDuration = networkIssuesHistory.reduce((acc, curr) => acc + curr.duration, 0);

            const summary = {
                finalScore: Math.round(focusScore),
                sessionDuration: totalDuration + 's',
                dropReasons: sessionState.focusDrops,
                cameraStats: {
                    on: sessionState.cameraOnDuration + 's',
                    off: sessionState.cameraOffDuration + 's'
                },
                networkStats: {
                    count: networkIssuesHistory.length,
                    totalOfflineDuration: networkOfflineDuration + 's'
                }
            };

            console.log('[Sparkus][Session Summary]');
            console.log(summary);
        }

        // Hook finalization
        window.addEventListener('beforeunload', finalizeSession);

        function logFocusChange(type, oldVal, newVal, magnitude) {
            const item = {
                type: type,
                timestamp: new Date().toISOString(),
                oldFocus: Math.round(oldVal),
                newFocus: Math.round(newVal),
                duration: 0
            };
            focusHistory.push(item);
            console.log('[Sparkus][History]', item);
        }


        // Global state trackers for time-based logic
        let tabAwayStart = null;
        let lookingAwayStart = null;
        let splitScreenStart = null;

        // Hook up state trackers
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                tabAwayStart = Date.now();
            } else {
                tabAwayStart = null;
            }
        });

        function reportViolation(type, details = {}) {
            violationsBuffer.push({ type, timestamp: new Date().toISOString(), ...details });
        }

        function showCameraOffNote() {
            const container = document.getElementById('sparkus-widget-container');
            if (!container) return;
            const body = container.querySelector('.widget-body');
            if (!body) return;

            if (!document.getElementById('sparkus-camera-note')) {
                const note = document.createElement('div');
                note.id = 'sparkus-camera-note';
                note.style.cssText = 'font-size: 10px; color: #ff9800; margin-top: 5px; text-align: center; width: 100%; opacity: 0.9;';
                note.textContent = 'Turn on camera to enable focus tracking';
                body.appendChild(note);
            }
        }

        function removeCameraOffNote() {
            const note = document.getElementById('sparkus-camera-note');
            if (note) note.remove();
        }

        function updateWidget(score, isTabActive) {
            const scoreEl = document.getElementById('sparkus-score');
            const statusDot = document.getElementById('sparkus-status-dot');
            const badge = document.getElementById('sparkus-mode-badge');

            if (scoreEl) {
                scoreEl.textContent = Math.round(score) + '%';
                if (score < 50) scoreEl.style.color = '#f44336'; // Red
                else if (score < 70) scoreEl.style.color = '#ff9800'; // Orange
                else scoreEl.style.color = '#2196f3'; // Blue/Normal
            }

            if (statusDot) {
                statusDot.className = 'status-dot'; // reset
                if (score < 50) statusDot.classList.add('danger');
                else if (score < 70) statusDot.classList.add('warning');

                // Pulse if recording or something? For now just static color
            }

            if (badge) badge.textContent = cameraMode === 'ON' ? 'A' : 'B';
        }

        // --- EYE TRACKING (WebGazer) ---
        function startEyeTracking(settings, participant) {
            // PERMANENTLY DISABLED FOR STABILITY
            console.log('[Sparkus][EyeTracking] Disabled for stability');
            cameraMode = 'OFF';
            eyeTrackingEnabled = false;
            showModeBWarning();
            updateWidget(100, true);
            return;
            /*
                    if (typeof webgazer === 'undefined') {
                        console.warn('WebGazer missing - Falling back to Mode B');
                        cameraMode = 'OFF';
                        eyeTrackingEnabled = false;
                        showModeBWarning();
                        updateWidget(100, true);
                        return;
                    }
            
                    console.log('👁️ Updating Eye Tracking Listener...');
            
                    try {
                        const eyeGracePeriod = settings.eyeGracePeriod || 5;
                        let warningShown = false;
            
                        // Just update the listener (WebGazer is already running from global init)
                        webgazer.setGazeListener((data, elapsedTime) => {
                            if (data == null) {
                                handleEyeEvent('missing', null, null);
                                return;
                            }
                            handleEyeEvent('gaze', data.x, data.y);
                        });
            
                        // Ensure UI is hidden (idempotent)
                        webgazer.showVideo(false);
                        webgazer.showFaceOverlay(false);
                        webgazer.showFaceFeedbackBox(false);
            
                    } catch (e) {
                        console.error('[Sparkus][EyeTracking] Listener update failed', e);
                        // Don't fallback to Mode B just for listener fail? 
                        // If main engine is running, we should try to keep going.
                        // But if setGazeListener crashes, maybe we should?
                        // Let's safe guard.
                        cameraMode = 'OFF';
                        eyeTrackingEnabled = false;
                        showModeBWarning();
                        updateWidget(100, true);
                    }
            */

            function handleEyeEvent(type, x, y) {
                // Define Safe Zone: Screen + small Buffer
                // Define Downward Zone: Below screen (y > window.innerHeight)

                if (type === 'missing') {
                    // Treat as looking away if sustained?
                    // Or maybe they just moved back?
                    // Let's count as off-screen.
                    updateGazeState(false, 'face_missing');
                    return;
                }

                const margin = 100; // lenient margin
                const isSafe = (x >= -margin && x <= window.innerWidth + margin) &&
                    (y >= -margin && y <= window.innerHeight + margin);

                const isDownward = (y > window.innerHeight + margin); // Clearly below screen

                if (isSafe) {
                    updateGazeState(true, 'safe');
                } else if (isDownward) {
                    updateGazeState(false, 'downward_gaze');
                } else {
                    updateGazeState(false, 'looking_away');
                }
            }

            function updateGazeState(isSafe, reason) {
                isLookingAtScreen = isSafe;

                if (!isSafe) {
                    if (!lookingAwayStart) lookingAwayStart = Date.now();

                    const duration = (Date.now() - lookingAwayStart) / 1000;

                    if (duration > eyeGracePeriod && !warningShown) {
                        warningShown = true;
                        const msg = reason === 'downward_gaze'
                            ? "⚠️ You seem to be looking down consistently."
                            : "⚠️ Please look at the screen.";

                        showWarning({
                            type: 'eye_gaze',
                            title: 'Attention Check',
                            message: msg,
                            warningCount: ++warningCount,
                            maxWarnings: 3, // default
                            countdown: null
                        });

                        reportViolation('gaze_warning_shown', { reason });
                    }
                } else {
                    // Returned to safe
                    if (lookingAwayStart) {
                        // If we were away for a while, log it?
                        lookingAwayStart = null;
                        warningShown = false;
                        dismissWarning();
                    }
                }
            }
        }





        // --- WARNING SYSTEM ---
        function showWarning(config) {
            dismissWarning();
            const w = document.createElement('div');
            w.id = 'sparkus-warning';
            w.className = 'sparkus-warning-popup'; // Ensure CSS exists for this
            // Inline styles for reliability if CSS missing
            w.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        border-left: 5px solid #ff9800;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: sans-serif;
        min-width: 300px;
    `;

            w.innerHTML = `
        <div style="font-weight: bold; color: #333; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">⚠️</span> ${config.title}
        </div>
        <div style="color: #666; font-size: 14px;">${config.message}</div>
        ${config.countdown ? `<div style="font-size: 12px; color: #d32f2f; font-weight: bold;">Time remaining: <span id="warn-timer">${config.countdown}</span>s</div>` : ''}
    `;

            if (!config.countdown) {
                const btn = document.createElement('button');
                btn.textContent = "I'm Back";
                btn.style.marginTop = '10px';
                btn.onclick = dismissWarning;
                w.appendChild(btn);
            }

            document.body.appendChild(w);
            activeWarning = w;

            if (config.countdown) {
                let left = config.countdown;
                const interval = setInterval(() => {
                    left--;
                    const el = document.getElementById('warn-timer');
                    if (el) el.textContent = left;
                    if (left <= 0) clearInterval(interval);
                }, 1000);

                // Auto dismiss if not penalty logic handling it?
                // Actually the caller handles logic for penalty after timeout.
            } else {
                setTimeout(dismissWarning, 5000);
            }
        }

        function dismissWarning() {
            if (activeWarning) {
                activeWarning.remove();
                activeWarning = null;
            }
        }

        async function sendFocusUpdate(participant, score, violations) {
            /*
            if (DEV_MODE) {
                console.log('[Sparkus][DEV] Focus Update:', { score, violations });
                return;
            }
            */
            if (!chrome.runtime?.id) return;

            try {
                await chrome.runtime.sendMessage(chrome.runtime.id, {
                    type: 'SEND_FOCUS_EVENT',
                    data: {
                        participantId: participant.id,
                        sessionId: participant.sessionId,
                        eventType: 'focus_update', // Aggregated event
                        focusScore: score,
                        violations: violations,
                        cameraMode: cameraMode,
                        isLookingAtScreen,
                        isTabActive: !document.hidden,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (e) {
                // quiet fail
            }
        }

        // Helper for fullscreen detection
        function isWindowFullscreen() {
            if (document.fullscreenElement) return true;
            const widthMatch = Math.abs(window.outerWidth - screen.availWidth) < 50 || Math.abs(window.outerWidth - screen.width) < 50;
            const heightMatch = Math.abs(window.outerHeight - screen.availHeight) < 50 || Math.abs(window.outerHeight - screen.height) < 50;
            return widthMatch && heightMatch;
        }



        /*
        if (DEV_MODE && window.location.hostname.includes('meet.google.com')) {
            console.log('[Sparkus][DEV] Dev mode active — auto starting monitoring');
            const devSession = { id: "dev-session", mode: "CLASS", settings: {} };
            const devParticipant = { id: "dev-user", name: "Test Student" };
    
            // Auto-start (checking prevents duplicates)
            if (!widgetInjected) {
                startMonitoring(devSession, devParticipant, 100);
            }
        }
        */


    }

    // Check on load
    initializeEyeTrackingOnce();
    setupMessageListener();

    // --- MANUAL TRIGGER (TEMP FOR TESTING) ---
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            console.log('[Sparkus][Manual] Monitoring started');
            const manualSession = { id: "manual-session", mode: "CLASS", settings: {} };
            const manualParticipant = { id: "manual-user", name: "Manual User" };

            if (!widgetInjected) {
                startMonitoring(manualSession, manualParticipant, 100);
            }
        }
    });

    // --- SESSION REHYDRATION LOGIC ---
    (function checkExistingSession() {
        try {
            if (!chrome.runtime?.id) return;

            chrome.storage.local.get(['activeSession', 'participantData'], (result) => {
                if (chrome.runtime.lastError) return;

                if (result.activeSession && result.participantData) {
                    console.log('[Sparkus][Rehydrate] Existing session found — resuming monitoring');

                    // Get saved score separately to match pattern
                    const scoreKey = `focus_${result.activeSession.sessionCode}`;
                    chrome.storage.local.get([scoreKey], (scoreResult) => {
                        const savedScore = scoreResult[scoreKey];
                        startMonitoring(result.activeSession, result.participantData, savedScore);
                    });
                }
            });
        } catch (e) {
            console.warn('Rehydration check failed:', e);
        }
    })();

    function initializeEyeTrackingOnce() {
        // PERMANENTLY DISABLED FOR STABILITY
        console.log('[Sparkus][EyeTracking] Disabled for stability');
        return;

        /*
        if (isGlobalEyeTrackingInitialized) {
            console.log('[Sparkus][EyeTracking] Global init skipped (already done)');
            return;
        }
        console.log('[Sparkus][EyeTracking] Global init started');

        if (typeof webgazer !== 'undefined') {
            try {
                // Set up a default listener to allow begin() to work
                webgazer.setGazeListener(() => { });

                // Explicitly set backend/platform if needed by requirements?
                // webgazer.begin() handles it.

                webgazer.begin();

                webgazer.showVideo(false);
                webgazer.showFaceOverlay(false);
                webgazer.showFaceFeedbackBox(false);

                isGlobalEyeTrackingInitialized = true;
            } catch (e) {
                console.error('[Sparkus][EyeTracking] Global init failed', e);
            }
        } else {
            console.warn('[Sparkus][EyeTracking] WebGazer not found during global init');
        }
        */
    }

})();
