// Focus Score Calculator - Time-Based Penalty System
// Calculates focus score based on duration of violations, not instant penalties

/**
 * Calculate focus score with time-based penalties
 * @param {number} currentScore - Current focus score (0-100)
 * @param {object} eventData - Event data from extension
 * @returns {number} New focus score
 */
export function calculateFocusScore(currentScore, eventData) {
    const {
        eventType,
        isLookingAtScreen,
        isTabActive,
        isWindowVisible,
        networkStable,
        duration, // Duration of violation in seconds
        penalty, // Custom penalty percentage (if provided)
    } = eventData;

    let newScore = currentScore;

    // Time-based penalty rates (percentage per second)
    const PENALTY_RATES = {
        tab_switch: 1.0, // 1% per second away
        minimize: 3.0, // 3% per second minimized
        eye_away: 0.4, // 0.4% per second looking away
        unauthorized_website: 2.0, // 2% per second on unauthorized site
        split_screen: 0.5, // 0.5% per second in split-screen
        camera_off: 0.3, // 0.3% per second with camera off
    };

    // Recovery rate for good behavior (percentage per 5 seconds)
    const RECOVERY_RATE = 0.5;

    // Apply time-based penalty if duration is provided
    if (duration && eventType in PENALTY_RATES) {
        const penaltyAmount = PENALTY_RATES[eventType] * duration;
        newScore -= penaltyAmount;
        console.log(`⚠️ Time-based penalty: ${eventType} for ${duration}s = -${penaltyAmount.toFixed(2)}%`);
    }

    // Apply custom penalty if provided (from extension or session config)
    if (penalty) {
        newScore -= parseFloat(penalty);
        console.log(`⚠️ Custom penalty applied: -${penalty}%`);
    }

    // Recovery for good behavior (only on focus_update events)
    if (
        eventType === 'focus_update' &&
        isLookingAtScreen === true &&
        isTabActive === true &&
        isWindowVisible === true &&
        networkStable !== false
    ) {
        // Slow recovery when behaving well
        if (newScore < 100) {
            newScore += RECOVERY_RATE;
            console.log(`✅ Recovery: +${RECOVERY_RATE}%`);
        }
    }

    // Network issues do NOT penalize focus score
    // They are tracked separately in network_logs table

    // Clamp score between 0 and 100
    newScore = Math.max(0, Math.min(100, newScore));

    return parseFloat(newScore.toFixed(2));
}

/**
 * Determine if a warning should be issued before penalty
 * @param {string} eventType - Type of event
 * @param {number} duration - Duration of violation
 * @param {object} sessionSettings - Session configuration
 * @returns {boolean} Whether to issue warning
 */
export function shouldIssueWarning(eventType, duration, sessionSettings = {}) {
    const gracePeriods = {
        tab_switch: sessionSettings.tab_switch_grace_period || 10,
        minimize: sessionSettings.minimize_grace_period || 5,
        eye_away: sessionSettings.eye_away_grace_period || 10,
        split_screen: sessionSettings.split_screen_grace_period || 30,
    };

    // Issue warning if within grace period
    if (eventType in gracePeriods) {
        return duration < gracePeriods[eventType];
    }

    return false;
}

/**
 * Calculate penalty amount for a violation
 * @param {string} eventType - Type of violation
 * @param {number} duration - Duration in seconds
 * @param {object} sessionSettings - Session configuration
 * @returns {number} Penalty percentage
 */
export function calculatePenalty(eventType, duration, sessionSettings = {}) {
    const penalties = {
        tab_switch: sessionSettings.tab_switch_penalty || 10,
        minimize: sessionSettings.minimize_penalty || 15,
        eye_away: sessionSettings.eye_away_penalty || 5,
        unauthorized_website: sessionSettings.unauthorized_website_penalty || 20,
        split_screen: sessionSettings.split_screen_penalty || 5,
    };

    return penalties[eventType] || 0;
}

// Calculate risk level based on focus score
export function calculateRiskLevel(focusScore) {
    if (focusScore >= 70) return 'low';
    if (focusScore >= 50) return 'medium';
    return 'high';
}

// Calculate status based on focus score
export function calculateStatus(focusScore, isActive) {
    if (!isActive) return 'disconnected';
    if (focusScore >= 70) return 'active';
    if (focusScore >= 50) return 'warning';
    return 'at_risk';
}

