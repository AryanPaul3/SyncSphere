import { create } from 'zustand'
import axios from 'axios'
import socket from "../socket.js"

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const API_URL = import.meta.env.MODE === "development" ? 'http://localhost:5000/api/auth' : "/api/auth"; // Adjust the API URL based on the environment
axios.defaults.withCredentials = true; // Enable sending cookies with requests

export const useAuthStore = create((set , get) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,
    theme: getInitialTheme(),

    initTheme: () => {
        const theme = get().theme;
        if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        } else {
        document.documentElement.classList.remove('dark');
        }
    },

    toggleTheme: () => {
        set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        return { theme: newTheme };
        });
    },

    signup: async (email , password , name) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post( `${API_URL}/signup`, { email, password, name });
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error.response.data.message || 'Signup failed', isLoading: false });
            throw error;
        }
    },

    login : async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            socket.connect();
        } catch (error) {
            set({ error: error.response.data.message || 'Login failed', isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/logout`);
            set({ user: null, isAuthenticated: false, isLoading: false });
            if (socket.connected) {
                socket.disconnect();
            }
        } catch (error) {
            set({ error: 'Logout failed', isLoading: false });
            throw error;
        }
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/verify-email`, { code });
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            return response.data; // Return the response data for further processing if needed
        } catch (error) {
            set({ error: error.response.data.message || 'Email verification failed', isLoading: false });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/check-auth`);
            set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
        } catch (error) {
            set({ isAuthenticated: false, error: null, isCheckingAuth: false });
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/forgot-password`, { email });
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			set({
				isLoading: false,
				error: error.response.data.message || "Error sending reset password email",
			});
			throw error;
		}
    },

    resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/reset-password/${token}`, { newPassword });
            set({ message: response.data.message, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error.response.data.message || 'Reset password failed', isLoading: false });
            throw error;
        }
    },

}));

// Initialize theme on app load
useAuthStore.getState().initTheme();