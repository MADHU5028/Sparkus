import React from 'react';
import './ProgressBar.css';

/**
 * ProgressBar Component
 * Displays a progress bar with percentage
 */
const ProgressBar = ({ value, max = 100, showLabel = true, color = 'primary', size = 'md' }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // Determine color based on value if color is 'auto'
    let barColor = color;
    if (color === 'auto') {
        if (percentage >= 70) barColor = 'success';
        else if (percentage >= 50) barColor = 'warning';
        else barColor = 'danger';
    }

    return (
        <div className={`progress-bar progress-bar--${size}`}>
            <div className="progress-bar__track">
                <div
                    className={`progress-bar__fill progress-bar__fill--${barColor}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="progress-bar__label">{Math.round(percentage)}</span>
            )}
        </div>
    );
};

export default ProgressBar;
