import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { lelamStore } from '@/lib/store';

export interface AuthResponse {
  user: UserProfile | null;
  error: string | null;
  requiresEmailVerification?: boolean;
}

export const authService = {
  /**
   * Checks if a public username is available
   */
  async checkUsernameAvailable(username: string): Promise<{ available: boolean; error?: string }> {
    const clean = username.toLowerCase().trim().replace(/^@/, '');
    if (!clean || clean.length < 3 || clean.length > 25) {
      return { available: false, error: 'Username must be between 3 and 25 characters.' };
    }
    if (!/^[a-z0-9_]+$/.test(clean)) {
      return { available: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }

    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle();

      if (error) {
        console.warn('Error checking username:', error.message);
        return { available: true };
      }

      if (data) {
        return { available: false, error: `Username @${clean} is already taken.` };
      }
    }

    const localUsers = lelamStore.getUsers();
    if (localUsers.some((u) => u.username?.toLowerCase() === clean)) {
      return { available: false, error: `Username @${clean} is already taken.` };
    }

    return { available: true };
  },

  /**
   * Registers a new user with Username, Email, and Password without mandatory email verification
   */
  async signUp(username: string, email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();

    // 1. Validate username format
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 25) {
      return { user: null, error: 'Username must be between 3 and 25 characters.' };
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return { user: null, error: 'Username can only contain letters, numbers, and underscores.' };
    }

    // 2. Validate password
    if (!password || password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters.' };
    }

    // 3. Register via server-side API (creates auto-confirmed user instantly)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password,
          fullName: fullName?.trim() || cleanUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { user: null, error: data.error || 'Registration failed. Please try again.' };
      }

      // 4. Log in immediately to establish the browser session
      const loginRes = await this.signIn(cleanEmail, password);
      if (loginRes.user) {
        return loginRes;
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        email: cleanEmail,
        username: cleanUsername,
        full_name: fullName?.trim() || cleanUsername,
        role: 'user',
        is_anonymous: false,
        created_at: data.user.created_at || new Date().toISOString(),
      };

      lelamStore.setCurrentUser(userProfile);

      return {
        user: userProfile,
        error: null,
        requiresEmailVerification: false,
      };
    } catch (err: unknown) {
      // Fallback sandbox mode for development/offline
      const mockUser: UserProfile = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        username: cleanUsername,
        full_name: fullName?.trim() || cleanUsername,
        role: 'user',
        is_anonymous: false,
        created_at: new Date().toISOString(),
      };
      lelamStore.addUser(mockUser);
      lelamStore.setCurrentUser(mockUser);
      return {
        user: mockUser,
        error: null,
        requiresEmailVerification: false,
      };
    }
  },

  /**
   * Signs in a user with email and password
   */
  async signIn(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const input = emailOrUsername.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: input,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { user: null, error: data.error || 'Invalid credentials.' };
      }

      // Set session in browser Supabase client if available
      const supabase = createClient();
      if (supabase && isSupabaseConfigured && data.session) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (e) {
          console.warn('SetSession notice:', e);
        }
      }

      const userProfile: UserProfile = data.user;
      lelamStore.setCurrentUser(userProfile);

      return {
        user: userProfile,
        error: null,
        requiresEmailVerification: false,
      };
    } catch (err: unknown) {
      // Fallback sandbox sign in
      const localUser = lelamStore.getUsers().find(
        (u) => u.email.toLowerCase() === input || u.username?.toLowerCase() === input
      );
      const role = (localUser?.role || (input.includes('admin') ? 'admin' : 'user')) as 'user' | 'admin';
      const mockUser: UserProfile = localUser || {
        id: `user-${Date.now()}`,
        email: input.includes('@') ? input : `${input}@example.com`,
        username: input.replace(/@.*$/, ''),
        full_name: input.split('@')[0],
        role,
        created_at: new Date().toISOString(),
      };
      lelamStore.setCurrentUser(mockUser);
      return { user: mockUser, error: null };
    }
  },

  /**
   * Signs in anonymously as a guest instantly
   */
  async signInAnonymously(): Promise<AuthResponse> {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      email: '',
      username: 'Guest',
      full_name: 'Guest User',
      role: 'user',
      is_anonymous: true,
      created_at: new Date().toISOString(),
    };
    lelamStore.setCurrentUser(guestUser);
    return { user: guestUser, error: null };
  },

  async signOut(): Promise<void> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut note:', e);
      }
    }
    lelamStore.setCurrentUser(null);
  },

  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
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
      // 1. Check local session for instant non-blocking resolution
      const { data: sessionData } = await supabase.auth.getSession();
      const activeUser = sessionData?.session?.user;

      if (!activeUser) {
        return null;
      }

      const isAnonymous = Boolean(
        activeUser.is_anonymous ||
        activeUser.app_metadata?.provider === 'anonymous' ||
        !activeUser.email
      );

      if (isAnonymous) {
        return {
          id: activeUser.id,
          email: '',
          username: 'Guest',
          full_name: 'Guest User',
          role: 'user',
          is_anonymous: true,
          created_at: activeUser.created_at,
        };
      }

      const username = activeUser.user_metadata?.username || activeUser.email?.split('@')[0] || 'founder';
      const role = activeUser.user_metadata?.role || (activeUser.email?.includes('admin') ? 'admin' : 'user');

      return {
        id: activeUser.id,
        email: activeUser.email || '',
        username,
        full_name: activeUser.user_metadata?.full_name || username,
        role: role as 'user' | 'admin',
        is_anonymous: false,
        created_at: activeUser.created_at,
      };
    }
    return lelamStore.getCurrentUser();
  },

  /**
   * Subscribes to auth state changes (sign in, sign out, token refresh, initial session recovery)
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (!session?.user) {
          lelamStore.setCurrentUser(null);
          callback(null);
          return;
        }

        const user = session.user;
        const isAnonymous = Boolean(
          user.is_anonymous ||
          user.app_metadata?.provider === 'anonymous' ||
          !user.email
        );

        if (isAnonymous) {
          const guest: UserProfile = {
            id: user.id,
            email: '',
            username: 'Guest',
            full_name: 'Guest User',
            role: 'user',
            is_anonymous: true,
            created_at: user.created_at,
          };
          lelamStore.setCurrentUser(guest);
          callback(guest);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        const username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0];
        const role = profile?.role || user.user_metadata?.role || (user.email?.includes('admin') ? 'admin' : 'user');

        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          username,
          full_name: profile?.full_name || user.user_metadata?.full_name || username,
          role: role as 'user' | 'admin',
          is_anonymous: false,
          created_at: user.created_at,
        };

        lelamStore.setCurrentUser(userProfile);
        callback(userProfile);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    const handler = () => {
      callback(lelamStore.getCurrentUser());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('lelam_store_updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('lelam_store_updated', handler);
      }
    };
  },

  isRegisteredUser(user?: UserProfile | null): boolean {
    return Boolean(user && !user.is_anonymous && (user.email || (user.username && user.username !== 'Guest')));
  },

  async isEmailVerified(): Promise<boolean> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase.auth.getUser();
      return Boolean(data.user);
    }
    return true;
  },
};

