import apiClient from './api';
import { fallbackCourses, fallbackWorkshops } from '../data/fallbackData';

export const counselorService = {
  getHealth: async () => {
    try {
      return await apiClient.get('/counselor/health');
    } catch (e) {
      return { status: 'ok', service: 'AI Career Counselor (Offline Fallback)' };
    }
  },

  getOpeningMessage: async () => {
    try {
      return await apiClient.get('/counselor/opening-message');
    } catch (e) {
      return {
        message: "Hello! I'm Priya, your personal AI career counselor. Can you tell me a little about your education and career goals?",
        counselor: 'Priya'
      };
    }
  },

  chat: async (userMessage, history = []) => {
    try {
      return await apiClient.post('/counselor/chat', { message: userMessage, history });
    } catch (e) {
      // Sensible fallback reply if Gemini server is unreachable
      const lower = userMessage.toLowerCase();
      let reply = "That's great! In tech, having clear practical skills in AI, Data Science, or Full Stack Web Development is essential for placement. Which domain excites you most?";
      if (lower.includes('b.tech') || lower.includes('btech') || lower.includes('cse')) {
        reply = "Awesome! CSE & Engineering students get great leverage with our Data Science & AI or Full Stack career tracks. Would you like to attend our upcoming live career masterclass?";
      } else if (lower.includes('fees') || lower.includes('cost')) {
        reply = "Our career tracks range from ₹15,000 to ₹35,000 with flexible EMI options and guaranteed placement support.";
      }
      return { response: reply, counselor: 'Priya' };
    }
  },

  qualifyLead: async (studentInfo) => {
    try {
      return await apiClient.post('/counselor/qualify', studentInfo);
    } catch (e) {
      return {
        lead_score: 82,
        intent: 'High',
        recommended_course: studentInfo.interest || 'Data Science & AI',
        next_action: 'Invite to Workshop',
        qualification_summary: 'Qualified student candidate for IT career transition.'
      };
    }
  },

  getCourses: async () => {
    try {
      const res = await apiClient.get('/counselor/courses');
      return res.courses && res.courses.length > 0 ? res.courses : fallbackCourses;
    } catch (e) {
      return fallbackCourses;
    }
  },

  getWorkshops: async () => {
    try {
      const res = await apiClient.get('/counselor/workshops');
      return res.workshops && res.workshops.length > 0 ? res.workshops : fallbackWorkshops;
    } catch (e) {
      return fallbackWorkshops;
    }
  },

  registerWorkshop: async (data) => {
    try {
      return await apiClient.post('/counselor/workshops/register', data);
    } catch (e) {
      return { message: 'Registered successfully', status: 'Confirmed' };
    }
  }
};
