// src/services/authService.js
// Authentication API service linking frontend auth to Express backend

import api from './api';

export const authService = {
  syncProfile: (data) => api.post('/auth/firebase-sync', data),
  instantSync: (data) => api.post('/auth/firebase-sync', data), // backwards-compatible alias
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export default authService;
