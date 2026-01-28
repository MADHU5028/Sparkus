import { format, formatDistance, formatRelative } from 'date-fns';

// Format date to readable string
export const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM dd, yyyy');
};

// Format datetime to readable string
export const formatDateTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

// Format time only
export const formatTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'HH:mm');
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
    if (!date) return '';
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

// Format number with commas
export const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
};

// Format percentage
export const formatPercentage = (value, decimals = 0) => {
    return `${value.toFixed(decimals)}%`;
};

// Format duration in seconds to readable string
export const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
};

// Get focus color based on score
export const getFocusColor = (score) => {
    if (score >= 70) return 'var(--success-500)';
    if (score >= 50) return 'var(--warning-500)';
    return 'var(--danger-500)';
};

// Get focus status
export const getFocusStatus = (score) => {
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Warning';
    return 'At Risk';
};

// Get attendance status color
export const getAttendanceColor = (status) => {
    const colors = {
        present: 'var(--success-500)',
        absent: 'var(--danger-500)',
        late: 'var(--warning-500)',
    };
    return colors[status?.toLowerCase()] || 'var(--gray-500)';
};
