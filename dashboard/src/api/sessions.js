import apiClient from './client.js';

// Create session
export const createSession = async (sessionData) => {
    return await apiClient('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
    });
};

// Get session by ID
export const getSession = async (sessionId) => {
    return await apiClient(`/sessions/${sessionId}`);
};

// Get session by code
export const getSessionByCode = async (code) => {
    return await apiClient(`/sessions/code/${code}`);
};

// Get all sessions for host
export const getHostSessions = async (hostId) => {
    return await apiClient(`/sessions/host/${hostId}`);
};

// Start session
export const startSession = async (sessionId) => {
    return await apiClient(`/sessions/${sessionId}/start`, {
        method: 'POST',
    });
};

// End session
export const endSession = async (sessionId) => {
    return await apiClient(`/sessions/${sessionId}/end`, {
        method: 'POST',
    });
};

// Delete session
export const deleteSession = async (sessionId) => {
    return await apiClient(`/sessions/${sessionId}`, {
        method: 'DELETE',
    });
};

// Get participant history
export const getParticipantHistory = async () => {
    return await apiClient('/participants/history');
};
