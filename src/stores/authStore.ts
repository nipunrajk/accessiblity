import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            token: response.session?.access_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(credentials);
          set({
            user: response.user,
            token: response.session?.access_token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state from Supabase session on app load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    useAuthStore.setState({
      user: {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata?.username,
        user_metadata: session.user.user_metadata,
      },
      token: session.access_token,
      isAuthenticated: true,
    });
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuthStore.setState({
      user: {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata?.username,
        user_metadata: session.user.user_metadata,
      },
      token: session.access_token,
      isAuthenticated: true,
    });
  } else {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  }
});
