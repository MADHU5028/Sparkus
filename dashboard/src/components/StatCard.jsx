import React from 'react';
import './StatCard.css';

/**
 * StatCard Component
 * Displays a statistic with an icon, label, and value
 */
const StatCard = ({ icon, label, value, trend, trendValue, color = 'primary' }) => {
    return (
        <div className={`stat-card stat-card--${color}`}>
            <div className="stat-card__icon">
                {icon}
            </div>
            <div className="stat-card__content">
                <div className="stat-card__label">{label}</div>
                <div className="stat-card__value">{value}</div>
                {trend && (
                    <div className={`stat-card__trend stat-card__trend--${trend}`}>
                        {trend === 'up' ? '↑' : '↓'} {trendValue}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
