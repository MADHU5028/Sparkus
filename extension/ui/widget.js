// Widget JavaScript - Simplified for debugging

console.log('Widget script loaded!');

const widget = document.getElementById('sparkus-widget');
const widgetContent = document.getElementById('widget-content');
const minimizeBtn = document.getElementById('minimize-btn');
const focusCircle = document.getElementById('focus-circle');
const focusPercentage = document.getElementById('focus-percentage');
const eyeIndicator = document.getElementById('eye-indicator');
const tabIndicator = document.getElementById('tab-indicator');
const networkIndicator = document.getElementById('network-indicator');
const sessionName = document.getElementById('session-name');

let isMinimized = false;

console.log('Widget elements:', { widget, focusCircle, focusPercentage });

// Handle minimize/maximize
if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        widget.classList.toggle('minimized', isMinimized);
        minimizeBtn.textContent = isMinimized ? '+' : '−';
    });
}

// Make widget draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;

const header = widget.querySelector('.widget-header');
if (header) {
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
}

function dragStart(e) {
    initialX = e.clientX - widget.offsetLeft;
    initialY = e.clientY - widget.offsetTop;

    if (e.target === header ||
        e.target === widget.querySelector('.widget-logo') ||
        e.target === widget.querySelector('.widget-title')) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        widget.style.left = currentX + 'px';
        widget.style.top = currentY + 'px';
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
    }
}

function dragEnd() {
    isDragging = false;
}

// Listen for focus updates
window.addEventListener('message', (event) => {
    console.log('Widget received message:', event.data.type);

    if (event.data.type === 'SPARKUS_FOCUS_UPDATE') {
        updateFocusDisplay(event.data);
    } else if (event.data.type === 'SPARKUS_WARNING') {
        showWarning(event.data.warning);
    } else if (event.data.type === 'INIT_WIDGET') {
        console.log('Widget initialized with session:', event.data.session);
        if (sessionName && event.data.session) {
            sessionName.textContent = event.data.session.sessionName || 'Session Active';
        }
    }
});

function updateFocusDisplay(data) {
    console.log('Updating focus display:', data);

    const { focusScore, isLookingAtScreen, isTabActive, isWindowVisible } = data;

    // Update percentage
    if (focusPercentage) {
        focusPercentage.textContent = Math.round(focusScore) + '%';
    }

    // Update circle color
    if (focusCircle) {
        focusCircle.style.setProperty('--focus-percent', focusScore + '%');
        focusCircle.classList.remove('warning', 'danger');

        if (focusScore >= 70) {
            // Green - good
        } else if (focusScore >= 50) {
            focusCircle.classList.add('warning');
        } else {
            focusCircle.classList.add('danger');
        }
    }

    // Update indicators
    if (eyeIndicator) {
        eyeIndicator.classList.toggle('inactive', !isLookingAtScreen);
        const eyeText = eyeIndicator.querySelector('.indicator-text');
        if (eyeText) {
            eyeText.textContent = isLookingAtScreen ? 'Looking at screen' : 'Looking away';
        }
    }

    if (tabIndicator) {
        tabIndicator.classList.toggle('inactive', !isTabActive);
        const tabText = tabIndicator.querySelector('.indicator-text');
        if (tabText) {
            tabText.textContent = isTabActive ? 'Tab active' : 'Tab inactive';
        }
    }
}

function showWarning(warning) {
    console.log('Showing warning:', warning);

    // Create warning popup
    const warningPopup = document.createElement('div');
    warningPopup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 9999999;
    max-width: 400px;
    text-align: center;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;

    warningPopup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
    <div style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px;">Focus Warning</div>
    <div style="font-size: 14px; color: #666; margin-bottom: 20px;">${warning.message}</div>
    <div style="font-size: 12px; color: #999; margin-bottom: 20px;">Warning ${warning.warningCount} of ${warning.maxWarnings}</div>
    <button style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    ">I Understand</button>
  `;

    document.body.appendChild(warningPopup);

    // Auto-dismiss after 5 seconds or on button click
    const dismissBtn = warningPopup.querySelector('button');
    dismissBtn.addEventListener('click', () => {
        warningPopup.remove();
    });

    setTimeout(() => {
        if (document.body.contains(warningPopup)) {
            warningPopup.remove();
        }
    }, 5000);
}

console.log('Widget script initialization complete');
