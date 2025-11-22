import { supabase } from '../lib/supabase';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: data.user.user_metadata?.username,
        user_metadata: data.user.user_metadata,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed');
    }

    // If no session, it means email confirmation is required
    if (!data.session) {
      throw new Error(
        'Please check your email to confirm your account before logging in'
      );
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: credentials.username,
        user_metadata: data.user.user_metadata,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username,
      user_metadata: user.user_metadata,
    };
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  },
};
