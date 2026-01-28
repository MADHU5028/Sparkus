// Focus Tracker Library
// Core focus tracking algorithm for Sparkus

class FocusTracker {
    constructor(participantId, sessionId, settings) {
        this.participantId = participantId;
        this.sessionId = sessionId;
        this.settings = settings;

        this.focusScore = 100;
        this.isTracking = false;
        this.updateInterval = null;

        // State tracking
        this.isLookingAtScreen = true;
        this.isTabActive = true;
        this.isWindowVisible = true;
        this.networkStable = true;

        // Eye tracking (placeholder for WebGazer integration)
        this.eyeTrackingEnabled = false;
    }

    start() {
        if (this.isTracking) return;

        console.log('🎯 Starting focus tracking...');
        this.isTracking = true;

        // Set up event listeners
        this.setupEventListeners();

        // Start periodic updates
        this.updateInterval = setInterval(() => {
            this.sendFocusUpdate();
        }, (this.settings.focusUpdateInterval || 5) * 1000);

        // Initialize eye tracking (simplified version)
        this.initializeEyeTracking();
    }

    stop() {
        if (!this.isTracking) return;

        console.log('🛑 Stopping focus tracking...');
        this.isTracking = false;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.removeEventListeners();
    }

    setupEventListeners() {
        // Tab visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Window focus
        window.addEventListener('focus', this.handleWindowFocus);
        window.addEventListener('blur', this.handleWindowBlur);

        // Network status
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    removeEventListeners() {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.handleWindowFocus);
        window.removeEventListener('blur', this.handleWindowBlur);
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }

    handleVisibilityChange = () => {
        this.isTabActive = !document.hidden;

        if (document.hidden) {
            this.logEvent('tab_switch');
        }
    }

    handleWindowFocus = () => {
        this.isWindowVisible = true;
    }

    handleWindowBlur = () => {
        this.isWindowVisible = false;
        this.logEvent('minimize');
    }

    handleOnline = () => {
        this.networkStable = true;
    }

    handleOffline = () => {
        this.networkStable = false;
    }

    initializeEyeTracking() {
        // Simplified eye tracking simulation
        // In production, integrate WebGazer.js

        setInterval(() => {
            // Simulate eye tracking (random for demo)
            // In real implementation, use WebGazer to detect gaze
            const isLooking = Math.random() > 0.2; // 80% looking at screen

            if (this.isLookingAtScreen && !isLooking) {
                this.logEvent('eye_away');
            }

            this.isLookingAtScreen = isLooking;
        }, 3000);
    }

    logEvent(eventType) {
        console.log(`📊 Focus event: ${eventType}`);

        // Send event to backend immediately
        this.sendFocusEvent(eventType);
    }

    async sendFocusEvent(eventType) {
        try {
            const response = await fetch('http://localhost:5000/api/focus/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: this.participantId,
                    sessionId: this.sessionId,
                    eventType,
                    isLookingAtScreen: this.isLookingAtScreen,
                    isTabActive: this.isTabActive,
                    isWindowVisible: this.isWindowVisible,
                    currentUrl: window.location.href,
                    networkStable: this.networkStable,
                }),
            });

            const data = await response.json();

            if (data.focusScore !== undefined) {
                this.focusScore = data.focusScore;

                // Update widget
                this.updateWidget();

                // Show warning if issued
                if (data.warning) {
                    this.showWarning(data.warning);
                }
            }
        } catch (error) {
            console.error('Failed to send focus event:', error);
        }
    }

    async sendFocusUpdate() {
        if (!this.isTracking) return;

        try {
            const response = await fetch('http://localhost:5000/api/focus/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    participantId: this.participantId,
                    sessionId: this.sessionId,
                    eventType: 'focus_update',
                    isLookingAtScreen: this.isLookingAtScreen,
                    isTabActive: this.isTabActive,
                    isWindowVisible: this.isWindowVisible,
                    currentUrl: window.location.href,
                    networkStable: this.networkStable,
                }),
            });

            const data = await response.json();

            if (data.focusScore !== undefined) {
                this.focusScore = data.focusScore;
                this.updateWidget();
            }
        } catch (error) {
            console.error('Failed to send focus update:', error);
        }
    }

    updateWidget() {
        // Send message to widget
        window.postMessage({
            type: 'SPARKUS_FOCUS_UPDATE',
            focusScore: this.focusScore,
            isLookingAtScreen: this.isLookingAtScreen,
            isTabActive: this.isTabActive,
            isWindowVisible: this.isWindowVisible,
        }, '*');
    }

    showWarning(warning) {
        window.postMessage({
            type: 'SPARKUS_WARNING',
            warning,
        }, '*');
    }

    getFocusScore() {
        return this.focusScore;
    }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusTracker;
}
