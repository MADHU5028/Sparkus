import React from 'react';
import './Slider.css';

/**
 * Slider Component
 * Range slider for numeric settings
 */
const Slider = ({ id, label, value, onChange, min = 0, max = 100, step = 1, unit = '', helpText }) => {
    return (
        <div className="slider-wrapper">
            <div className="slider-header">
                <label htmlFor={id} className="slider-label">
                    {label}
                </label>
                <span className="slider-value">{value}{unit}</span>
            </div>
            <input
                type="range"
                id={id}
                className="slider-input"
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                step={step}
            />
            {helpText && <p className="slider-help">{helpText}</p>}
        </div>
    );
};

export default Slider;
