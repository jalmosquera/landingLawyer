/**
 * Auth Store
 *
 * Zustand store for authentication state management.
 * Handles login, logout, and user session persistence.
 */

import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (username, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authAPI.login(username, password);
      const { access, refresh, user } = response.data;

      // Store tokens and user in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Reset state
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  loadUser: () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        get().logout();
      }
    }
  },

  updateUser: (userData) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...userData };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearError: () => {
    set({ error: null });
  },

  // Helper getters
  isStaff: () => {
    const user = get().user;
    return user && (user.role === 'boss' || user.role === 'employe');
  },

  isClient: () => {
    const user = get().user;
    return user && user.role === 'client';
  },

  isBoss: () => {
    const user = get().user;
    return user && user.role === 'boss';
  },
}));

export default useAuthStore;
