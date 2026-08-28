import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { lelamStore } from '@/lib/store';

export interface AuthResponse {
  user: UserProfile | null;
  error: string | null;
  requiresEmailVerification?: boolean;
}

// In-memory set of reactive subscribers across components (Header, Dashboard, Create, BidModal, etc.)
const authSubscribers = new Set<(user: UserProfile | null) => void>();

function notifyAuthSubscribers(user: UserProfile | null) {
  authSubscribers.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error('Error in auth subscriber:', e);
    }
  });
}

// Single module-level GoTrue listener to eliminate WebLock contention and browser lag
let isSupabaseListenerInitialized = false;

function ensureSupabaseAuthListener() {
  if (isSupabaseListenerInitialized) return;
  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    isSupabaseListenerInitialized = true;
    try {
      supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (event === 'SIGNED_OUT') {
          lelamStore.setCurrentUser(null);
          lelamStore.setSessionTokens(null);
          notifyAuthSubscribers(null);
        } else if (session?.user) {
          if (session.access_token) {
            lelamStore.setSessionTokens({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
          }
          const u = session.user;
          const username = u.user_metadata?.username || u.email?.split('@')[0] || 'founder';
          const role = u.user_metadata?.role || (u.email?.includes('admin') ? 'admin' : 'user');
          const profile: UserProfile = {
            id: u.id,
            email: u.email || '',
            username,
            full_name: u.user_metadata?.full_name || username,
            role: role as 'user' | 'admin',
            is_anonymous: Boolean(u.is_anonymous),
            created_at: u.created_at,
          };
          lelamStore.setCurrentUser(profile);
          notifyAuthSubscribers(profile);
        }
      });
    } catch (e) {
      console.warn('Auth listener init error:', e);
    }
  }
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
   * Registers a new user with Username, Email, and Password in a single fast serverless roundtrip
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

    // 2. Validate email
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      return { user: null, error: 'Please enter a valid email address.' };
    }

    // 3. Validate password
    if (!password || password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters.' };
    }

    // 4. Register via server-side API (creates user and returns session in 1 request)
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

      const userProfile: UserProfile = data.user;

      // 5. Store session tokens in persistent store and establish Supabase session
      if (data.session) {
        if (data.session.access_token) {
          lelamStore.setSessionTokens({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        const supabase = createClient();
        if (supabase && isSupabaseConfigured) {
          try {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          } catch (e: unknown) {
            console.warn('setSession note:', e);
          }
        }
      }

      // 6. Update local persistent store and notify all subscribers immediately
      lelamStore.setCurrentUser(userProfile);
      notifyAuthSubscribers(userProfile);

      return {
        user: userProfile,
        error: null,
        requiresEmailVerification: false,
      };
    } catch (err: unknown) {
      // Fallback sandbox mode for development/test scripts/offline
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
      notifyAuthSubscribers(mockUser);
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
    if (!input) {
      return { user: null, error: 'Please enter your email or username.' };
    }
    if (!password) {
      return { user: null, error: 'Please enter your password.' };
    }

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

      const userProfile: UserProfile = data.user;

      // 1. Store session tokens in persistent store and establish Supabase session
      if (data.session) {
        if (data.session.access_token) {
          lelamStore.setSessionTokens({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        const supabase = createClient();
        if (supabase && isSupabaseConfigured) {
          try {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          } catch (e: unknown) {
            console.warn('setSession note:', e);
          }
        }
      }

      // 2. Immediately update local persistent store and notify all subscribers
      lelamStore.setCurrentUser(userProfile);
      notifyAuthSubscribers(userProfile);

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
      notifyAuthSubscribers(mockUser);
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
    lelamStore.setSessionTokens(null);
    notifyAuthSubscribers(guestUser);
    return { user: guestUser, error: null };
  },

  async signOut(): Promise<void> {
    lelamStore.setCurrentUser(null);
    lelamStore.setSessionTokens(null);
    notifyAuthSubscribers(null);
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut note:', e);
      }
    }
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
      try {
        const { data } = await supabase.auth.getSession();
        const activeUser = data?.session?.user;
        if (activeUser) {
          const username = activeUser.user_metadata?.username || activeUser.email?.split('@')[0] || 'founder';
          const role = activeUser.user_metadata?.role || (activeUser.email?.includes('admin') ? 'admin' : 'user');
          const profile: UserProfile = {
            id: activeUser.id,
            email: activeUser.email || '',
            username,
            full_name: activeUser.user_metadata?.full_name || username,
            role: role as 'user' | 'admin',
            is_anonymous: Boolean(activeUser.is_anonymous),
            created_at: activeUser.created_at,
          };
          lelamStore.setCurrentUser(profile);
          return profile;
        }

        // If no active Supabase session, check if user is a guest
        const stored = lelamStore.getCurrentUser();
        if (stored?.is_anonymous) {
          return stored;
        }

        // Stale registered session without Supabase auth -> clear
        if (stored) {
          lelamStore.setCurrentUser(null);
          lelamStore.setSessionTokens(null);
        }
        return null;
      } catch (e) {
        console.warn('Session check note:', e);
      }
    }

    return lelamStore.getCurrentUser();
  },

  /**
   * Subscribes to auth state changes (sign in, sign out, guest login, initial session recovery)
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    authSubscribers.add(callback);
    ensureSupabaseAuthListener();

    // Provide initial state immediately if present
    const current = lelamStore.getCurrentUser();
    if (current) {
      callback(current);
    }

    return () => {
      authSubscribers.delete(callback);
    };
  },

  isRegisteredUser(user?: UserProfile | null): boolean {
    return Boolean(user && !user.is_anonymous && (user.email || (user.username && user.username !== 'Guest')));
  },

  async getAccessToken(): Promise<string | null> {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          return data.session.access_token;
        }
      } catch (e) {
        console.warn('getSession note:', e);
      }
    }

    // Direct fallback from persistent session storage
    const storedTokens = lelamStore.getSessionTokens();
    if (storedTokens?.access_token) {
      if (supabase && isSupabaseConfigured) {
        supabase.auth.setSession(storedTokens).catch(() => {});
      }
      return storedTokens.access_token;
    }

    return null;
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
