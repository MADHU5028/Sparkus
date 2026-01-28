import React from 'react';
import './Badge.css';

/**
 * Badge Component
 * Displays status badges with different colors
 */
const Badge = ({ children, variant = 'default', size = 'md' }) => {
    return (
        <span className={`badge badge--${variant} badge--${size}`}>
            {children}
        </span>
    );
};

export default Badge;
