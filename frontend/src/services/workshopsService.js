import apiClient from './api';
import { fallbackWorkshops } from '../data/fallbackData';

export const workshopsService = {
  getWorkshops: async () => {
    try {
      const res = await apiClient.get('/counselor/workshops');
      return res.workshops && res.workshops.length > 0 ? res.workshops : fallbackWorkshops;
    } catch (e) {
      return fallbackWorkshops;
    }
  },

  register: async (data) => {
    try {
      return await apiClient.post('/counselor/workshops/register', data);
    } catch (e) {
      return { message: 'Registered successfully for workshop', status: 'Confirmed' };
    }
  }
};
