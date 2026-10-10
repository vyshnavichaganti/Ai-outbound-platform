import apiClient from './api';
import { fallbackCourses } from '../data/fallbackData';

export const coursesService = {
  getCourses: async () => {
    try {
      const res = await apiClient.get('/counselor/courses');
      return res.courses && res.courses.length > 0 ? res.courses : fallbackCourses;
    } catch (e) {
      return fallbackCourses;
    }
  },

  getCourseById: async (id) => {
    try {
      return await apiClient.get(`/counselor/courses/${id}`);
    } catch (e) {
      return fallbackCourses.find(c => c.id === id || c.name.toLowerCase().includes(id.toLowerCase())) || fallbackCourses[0];
    }
  }
};
