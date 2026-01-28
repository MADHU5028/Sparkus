import apiClient from './client.js';

// Get all participants in a session
export const getSessionParticipants = async (sessionId) => {
    return await apiClient(`/participants/session/${sessionId}`);
};

// Get participant report
export const getParticipantReport = async (participantId) => {
    return await apiClient(`/participants/${participantId}/report`);
};

// Get focus data for session
export const getSessionFocusData = async (sessionId) => {
    return await apiClient(`/focus/session/${sessionId}`);
};
