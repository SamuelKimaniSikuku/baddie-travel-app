// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE — Sign up, login, OAuth, session management
// ═══════════════════════════════════════════════════════════════

import { supabase, isDemo } from '../lib/supabase';

// ── Demo mode mock ──
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@baddie.travel',
  user_metadata: { name: 'Demo Traveler', avatar: '😎' },
};

class AuthService {
  // Sign up with email/password
  async signUp({ email, password, name, avatar }) {
    if (isDemo) return { user: DEMO_USER, error: null };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar: avatar || '😎' },
      },
    });
    return { user: data?.user, session: data?.session, error };
  }

  // Sign in with email/password
  async signIn({ email, password }) {
    if (isDemo) return { user: DEMO_USER, session: { access_token: 'demo' }, error: null };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data?.user, session: data?.session, error };
  }

  // OAuth sign in (Google, Apple, etc.)
  async signInWithOAuth(provider) {
    if (isDemo) return { user: DEMO_USER, error: null };

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider, // 'google', 'apple', 'github'
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  }

  // Sign out
  async signOut() {
    if (isDemo) return { error: null };

    // Update online status before signing out
    const user = await this.getUser();
    if (user) {
      await supabase.rpc('update_online_status', {
        user_uuid: user.id,
        is_online: false,
      });
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Get current user
  async getUser() {
    if (isDemo) return DEMO_USER;

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Get current session
  async getSession() {
    if (isDemo) return { access_token: 'demo', user: DEMO_USER };

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Password reset
  async resetPassword(email) {
    if (isDemo) return { error: null };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    if (isDemo) {
      callback('SIGNED_IN', { user: DEMO_USER });
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);

      // Auto-update online status
      if (event === 'SIGNED_IN' && session?.user) {
        supabase.rpc('update_online_status', {
          user_uuid: session.user.id,
          is_online: true,
        });
      }
    });
  }

  // Delete account
  async deleteAccount() {
    if (isDemo) return { error: null };

    // Note: Requires a Supabase Edge Function for full account deletion
    const { error } = await supabase.auth.admin.deleteUser(
      (await this.getUser()).id
    );
    return { error };
  }
}

export const authService = new AuthService();
export default authService;
