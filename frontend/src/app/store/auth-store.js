import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://opapmbueopwgjmnwpprv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wYXBtYnVlb3B3Z2ptbndwcHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODY3MTksImV4cCI6MjA5MDg2MjcxOX0.lJr7f04_qcZZREE7an6SHqvC3QP15LrDFXAfjNLzees';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { API_BASE } from '../config';

// ─── Module-level guard: ensures the Supabase listener is NEVER registered more
// than once, no matter how many times initialize() is accidentally called.
let _authSubscription = null;
let _initialized = false;

// ─── Debounce helper: prevents syncProfile from firing in a burst
let _syncProfileTimer = null;
const debouncedSyncProfile = (fn) => {
  clearTimeout(_syncProfileTimer);
  _syncProfileTimer = setTimeout(fn, 300);
};

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      manualSession: null,
      profile: null,
      loading: true,

      initialize: async () => {
        // ✅ IDEMPOTENCY GUARD — prevents stacked listeners from multiple calls
        if (_initialized) {
          console.log('[Auth] initialize() already called — skipping duplicate.');
          return;
        }
        _initialized = true;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ session, user: session.user, loading: false });
          get().syncProfile();
        } else if (get().manualSession) {
          set({ user: get().manualSession?.user || null, loading: false });
          get().syncProfile();
        } else {
          set({ loading: false });
        }

        // ✅ SINGLE SUBSCRIPTION — store it so we can clean up if needed
        // onAuthStateChange returns { data: { subscription } } — must destructure the inner object
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          // Only act on meaningful events, not background token refreshes that fire repeatedly
          if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
            if (session) {
              set({ session, user: session.user });
              // ✅ DEBOUNCED — prevents burst of syncProfile calls on rapid auth events
              debouncedSyncProfile(() => get().syncProfile());
            }
          }
          if (_event === 'SIGNED_OUT') {
            set({ session: null, user: null, profile: null });
          }
        });
        _authSubscription = subscription; // subscription.unsubscribe() is now valid
      },

      setSessionFromPassport: (token, user) => {
        set({ manualSession: { access_token: token, user }, user });
        get().syncProfile();
      },

      syncProfile: async () => {
        const state = get();
        const token = state.session?.access_token || state.manualSession?.access_token;
        if (!token) return;

        try {
          const resp = await fetch(`${API_BASE}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (resp.ok) {
            set({ profile: await resp.json() });
          }
        } catch (err) { console.error('Sync profile failed', err); }
      },

      updateProfile: async (data) => {
        const state = get();
        const token = state.session?.access_token || state.manualSession?.access_token;
        if (!token) return;

        try {
          const resp = await fetch(`${API_BASE}/api/user/update`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data),
          });
          if (resp.ok) {
            const result = await resp.json();
            set({ profile: result.user });
          }
        } catch (err) { console.error('Update profile failed', err); }
      },

      signOut: async () => {
        // ✅ Clean up the Supabase subscription on sign out
        if (_authSubscription) {
          _authSubscription.unsubscribe();
          _authSubscription = null;
          _initialized = false; // Allow re-initialization after sign out
        }
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null, manualSession: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ manualSession: state.manualSession }),
    }
  )
);
