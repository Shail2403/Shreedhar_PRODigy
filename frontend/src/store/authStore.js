import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login/', credentials);
      const { tokens, user: userData } = response.data;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.errors || 'Login failed' };
    }
  },

  signup: async (userData) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/signup/', userData);
      const { tokens, user: newUser } = response.data;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, error: error.response?.data?.errors || 'Signup failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  setAuth: (userData, tokens) => {
    if (tokens) {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/auth/profile/', profileData);
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.errors || 'Update failed' };
    }
  },
}));

export default useAuthStore;
