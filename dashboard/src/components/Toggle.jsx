import React from 'react';
import './Toggle.css';

/**
 * Toggle Component
 * Modern toggle switch for boolean settings
 */
const Toggle = ({ id, checked, onChange, label, description }) => {
    return (
        <div className="toggle-wrapper">
            <div className="toggle-content">
                <label htmlFor={id} className="toggle-label">
                    {label}
                </label>
                {description && <p className="toggle-description">{description}</p>}
            </div>
            <label className="toggle-switch">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={onChange}
                />
                <span className="toggle-slider"></span>
            </label>
        </div>
    );
};

export default Toggle;
