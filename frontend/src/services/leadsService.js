import apiClient from './api';

export const leadsService = {
  getStats: async () => {
    return await apiClient.get('/dashboard/stats');
  },

  getLeads: async (params = {}) => {
    const res = await apiClient.get('/leads', { params });
    return Array.isArray(res) ? res : [];
  },

  getLeadById: async (id) => {
    return await apiClient.get(`/leads/${id}`);
  },

  createLead: async (leadData) => {
    return await apiClient.post('/leads', leadData);
  },

  updateLead: async (id, data) => {
    return await apiClient.put(`/leads/${id}`, data);
  },

  deleteLead: async (id) => {
    return await apiClient.delete(`/leads/${id}`);
  },

  markDNC: async (id) => {
    return await apiClient.post(`/leads/${id}/dnc`);
  },

  unmarkDNC: async (id) => {
    return await apiClient.post(`/leads/${id}/undnc`);
  },

  exportCSV: async () => {
    const response = await apiClient.get('/leads/export-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  importCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post('/leads/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  importBulk: async (leads) => {
    return await apiClient.post('/leads/import-bulk', { leads });
  }
};
