import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { lelamStore } from '@/lib/store';

export interface AuthResponse {
  user: UserProfile | null;
  error: string | null;
  requiresEmailVerification?: boolean;
}

export const authService = {
  async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const supabase = createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user',
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      const isVerified = Boolean(data.user?.email_confirmed_at);
      const userProfile: UserProfile = {
        id: data.user?.id || `user-${Date.now()}`,
        email: data.user?.email || email,
        full_name: fullName,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      return {
        user: userProfile,
        error: null,
        requiresEmailVerification: !isVerified,
      };
    }

    // Fallback sandbox mode for development
    const mockUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      full_name: fullName,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    lelamStore.setCurrentUser(mockUser);
    return {
      user: mockUser,
      error: null,
      requiresEmailVerification: false,
    };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const supabase = createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      const role = data.user?.user_metadata?.role || (email.includes('admin') ? 'admin' : 'user');
      const userProfile: UserProfile = {
        id: data.user?.id || `user-${Date.now()}`,
        email: data.user?.email || email,
        full_name: data.user?.user_metadata?.full_name || email.split('@')[0],
        role,
        created_at: data.user?.created_at || new Date().toISOString(),
      };

      return {
        user: userProfile,
        error: null,
        requiresEmailVerification: !data.user?.email_confirmed_at,
      };
    }

    // Fallback sandbox sign in
    const role = email.includes('admin') ? 'admin' : 'user';
    const mockUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      full_name: email.split('@')[0],
      role,
      created_at: new Date().toISOString(),
    };
    lelamStore.setCurrentUser(mockUser);
    return { user: mockUser, error: null };
  },

  async signOut(): Promise<void> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    }
    return { success: true, error: null };
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
      return {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        role: data.user.user_metadata?.role || (data.user.email?.includes('admin') ? 'admin' : 'user'),
        created_at: data.user.created_at,
      };
    }
    return lelamStore.getCurrentUser();
  },

  async isEmailVerified(): Promise<boolean> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase.auth.getUser();
      return Boolean(data.user?.email_confirmed_at);
    }
    return true;
  },
};
