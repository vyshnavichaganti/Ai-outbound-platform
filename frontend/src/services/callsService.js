import apiClient from './api';

export const callsService = {
  getCallLogs: async (params = {}) => {
    const res = await apiClient.get('/calls', { params });
    return Array.isArray(res) ? res : [];
  },

  getCallById: async (id) => {
    return await apiClient.get(`/calls/${id}`);
  },

  initiateCall: async (data) => {
    // data can be { lead_id, phone_number, student_name, campaign_id }
    return await apiClient.post('/calls/initiate', data);
  },

  makeCall: async (leadId) => {
    return await apiClient.post(`/call/${leadId}`);
  },

  getActiveCalls: async () => {
    const res = await apiClient.get('/calls/active');
    return Array.isArray(res) ? res : [];
  },

  getCallStatus: async (callSid) => {
    return await apiClient.get(`/calls/status/${callSid}`);
  },

  processIntelligence: async (callId) => {
    return await apiClient.post(`/calls/${callId}/process-intelligence`);
  }
};
