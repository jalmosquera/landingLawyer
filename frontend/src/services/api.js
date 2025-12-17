/**
 * API Service
 *
 * Centralized API configuration with axios.
 * Includes automatic JWT token refresh and error handling.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login/', { username, password }),

  register: (data) =>
    api.post('/auth/register/', data),

  logout: () =>
    api.post('/auth/logout/'),

  refreshToken: (refresh) =>
    api.post('/auth/token/refresh/', { refresh }),

  getCurrentUser: () =>
    api.get('/auth/me/'),

  updateProfile: (data) =>
    api.patch('/auth/me/', data),

  changePassword: (data) =>
    api.post('/auth/change-password/', data),

  requestPasswordReset: (email) =>
    api.post('/auth/password-reset/request/', { email }),

  confirmPasswordReset: (data) =>
    api.post('/auth/password-reset/confirm/', data),
};

// ============================================================================
// USERS API
// ============================================================================
export const usersAPI = {
  getAll: (params) =>
    api.get('/users/', { params }),

  get: (id) =>
    api.get(`/users/${id}/`),

  create: (data) =>
    api.post('/users/', data),

  update: (id, data) =>
    api.patch(`/users/${id}/`, data),

  delete: (id) =>
    api.delete(`/users/${id}/`),
};

// ============================================================================
// CLIENTS API
// ============================================================================
export const clientsAPI = {
  getAll: (params) =>
    api.get('/clients/', { params }),

  list: (params) =>
    api.get('/clients/', { params }),

  create: (data) =>
    api.post('/clients/', data),

  get: (id) =>
    api.get(`/clients/${id}/`),

  update: (id, data) =>
    api.patch(`/clients/${id}/`, data),

  delete: (id) =>
    api.delete(`/clients/${id}/`),
};

// ============================================================================
// CASES API
// ============================================================================
export const casesAPI = {
  getAll: (params) =>
    api.get('/cases/', { params }),

  list: (params) =>
    api.get('/cases/', { params }),

  create: (data) =>
    api.post('/cases/', data),

  get: (id) =>
    api.get(`/cases/${id}/`),

  update: (id, data) =>
    api.patch(`/cases/${id}/`, data),

  delete: (id) =>
    api.delete(`/cases/${id}/`),

  timeline: (id) =>
    api.get(`/cases/${id}/timeline/`),

  documents: (id, params) =>
    api.get(`/cases/${id}/documents/`, { params }),

  // Portal endpoints
  portal: {
    list: () =>
      api.get('/portal/cases/'),

    get: (id) =>
      api.get(`/portal/cases/${id}/`),
  },
};

// ============================================================================
// DOCUMENTS API
// ============================================================================
export const documentsAPI = {
  getAll: (params) =>
    api.get('/documents/', { params }),

  list: (params) =>
    api.get('/documents/', { params }),

  create: (formData) =>
    api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  get: (id) =>
    api.get(`/documents/${id}/`),

  update: (id, data) =>
    api.patch(`/documents/${id}/`, data),

  delete: (id) =>
    api.delete(`/documents/${id}/`),

  notifyClient: (id, data) =>
    api.post(`/documents/${id}/notify-client/`, data),

  validateCode: (data) =>
    api.post('/documents/validate-code/', data),

  download: (token) =>
    api.get(`/documents/download/${token}/`, {
      responseType: 'blob',
    }),

  getAccessLog: (id) =>
    api.get(`/documents/${id}/access-log/`),

  accessLog: (id) =>
    api.get(`/documents/${id}/access-log/`),

  // Portal endpoints
  portal: {
    list: () =>
      api.get('/portal/documents/'),

    get: (id) =>
      api.get(`/portal/documents/${id}/`),

    upload: (formData) =>
      api.post('/portal/documents/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
  },
};

// ============================================================================
// APPOINTMENTS API
// ============================================================================
export const appointmentsAPI = {
  getAll: (params) =>
    api.get('/appointments/', { params }),

  list: (params) =>
    api.get('/appointments/', { params }),

  create: (data) =>
    api.post('/appointments/', data),

  get: (id) =>
    api.get(`/appointments/${id}/`),

  update: (id, data) =>
    api.patch(`/appointments/${id}/`, data),

  delete: (id) =>
    api.delete(`/appointments/${id}/`),

  syncGoogle: (id) =>
    api.post(`/appointments/${id}/sync-google/`),

  bulkSync: () =>
    api.post('/appointments/bulk-sync/'),

  // Public endpoints
  public: {
    availableSlots: (params) =>
      api.get('/public/appointments/available-slots/', { params }),

    request: (data) =>
      api.post('/public/appointments/request/', data),

    confirm: (token) =>
      api.get(`/public/appointments/confirm/${token}/`),
  },

  // Portal endpoints
  portal: {
    list: () =>
      api.get('/portal/appointments/'),

    get: (id) =>
      api.get(`/portal/appointments/${id}/`),
  },
};

// ============================================================================
// LANDING API
// ============================================================================
export const landingAPI = {
  // Public endpoints
  public: {
    services: () =>
      api.get('/public/services/'),

    testimonials: () =>
      api.get('/public/testimonials/'),

    successCases: () =>
      api.get('/public/success-cases/'),

    contactRequest: (data) =>
      api.post('/public/contact-requests/', data),
  },

  // Staff endpoints
  services: {
    getAll: () =>
      api.get('/landing/services/'),

    list: () =>
      api.get('/landing/services/'),

    create: (data) =>
      api.post('/landing/services/', data),

    get: (id) =>
      api.get(`/landing/services/${id}/`),

    update: (id, data) =>
      api.patch(`/landing/services/${id}/`, data),

    delete: (id) =>
      api.delete(`/landing/services/${id}/`),
  },

  testimonials: {
    getAll: () =>
      api.get('/landing/testimonials/'),

    list: () =>
      api.get('/landing/testimonials/'),

    create: (data) =>
      api.post('/landing/testimonials/', data),

    get: (id) =>
      api.get(`/landing/testimonials/${id}/`),

    update: (id, data) =>
      api.patch(`/landing/testimonials/${id}/`, data),

    delete: (id) =>
      api.delete(`/landing/testimonials/${id}/`),
  },

  successCases: {
    getAll: () =>
      api.get('/landing/success-cases/'),

    list: () =>
      api.get('/landing/success-cases/'),

    create: (data) =>
      api.post('/landing/success-cases/', data),

    get: (id) =>
      api.get(`/landing/success-cases/${id}/`),

    update: (id, data) =>
      api.patch(`/landing/success-cases/${id}/`, data),

    delete: (id) =>
      api.delete(`/landing/success-cases/${id}/`),
  },

  contactRequests: {
    getAll: (params) =>
      api.get('/landing/contact-requests/', { params }),

    list: (params) =>
      api.get('/landing/contact-requests/', { params }),

    get: (id) =>
      api.get(`/landing/contact-requests/${id}/`),

    update: (id, data) =>
      api.patch(`/landing/contact-requests/${id}/`, data),
  },
};

// ============================================================================
// PORTAL API (General)
// ============================================================================
export const portalAPI = {
  dashboard: () =>
    api.get('/portal/dashboard/'),

  cases: casesAPI.portal,
  documents: documentsAPI.portal,
  appointments: appointmentsAPI.portal,
};

export default api;
