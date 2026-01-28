/**
 * Sparkus Keystroke Dynamics Tracker
 * Tracks typing patterns (flight time, dwell time) WITHOUT recording actual keys.
 */

let keysPressed = {}; // Map of key -> pressStartTime
let flightTimes = [];
let dwellTimes = [];
let keyCount = 0;
let backspaceCount = 0;
let lastKeyUpTime = 0;

// Listen for keydown
document.addEventListener('keydown', (e) => {
    const now = Date.now();

    // Track backspaces
    if (e.key === 'Backspace') {
        backspaceCount++;
    }

    // Ignore modifier keys for simple analysis
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    if (!keysPressed[e.code]) {
        keysPressed[e.code] = now;

        // Calculate Flight Time: Time between releasing previous key and pressing current key
        if (lastKeyUpTime > 0) {
            const flightTime = now - lastKeyUpTime;
            // Filter outliers (e.g., long pauses)
            if (flightTime < 2000) {
                flightTimes.push(flightTime);
            }
        }
    }
});

// Listen for keyup
document.addEventListener('keyup', (e) => {
    const now = Date.now();

    if (keysPressed[e.code]) {
        const dwellTime = now - keysPressed[e.code];
        dwellTimes.push(dwellTime);
        delete keysPressed[e.code];
        keyCount++;
        lastKeyUpTime = now;
    }
});

// Calculate and upload metrics every 30 seconds
setInterval(() => {
    if (keyCount > 0) {
        const avgDwell = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length || 0;
        const avgFlight = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length || 0;
        const wpm = (keyCount / 5) * 2; // Rough estimate: 30s window * 2 = 1 min

        const metrics = {
            wpm: Math.round(wpm),
            dwellTimeAvg: Math.round(avgDwell),
            flightTimeAvg: Math.round(avgFlight),
            backspaceCount
        };

        // Send to background script/backend
        console.log('Keystroke Metrics:', metrics);

        // Reset for next window
        flightTimes = [];
        dwellTimes = [];
        keyCount = 0;
        backspaceCount = 0;

        // Dispatch event for content script to pick up if needed
        window.dispatchEvent(new CustomEvent('SparkusKeystrokeMetrics', { detail: metrics }));
    }
}, 30000);
