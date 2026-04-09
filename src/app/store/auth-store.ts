import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://opapmbueopwgjmnwpprv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wYXBtYnVlb3B3Z2ptbndwcHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODY3MTksImV4cCI6MjA5MDg2MjcxOX0.lJr7f04_qcZZREE7an6SHqvC3QP15LrDFXAfjNLzees';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import type { Session, User } from '@supabase/supabase-js';

interface AuthStore {
  session: Session | null;
  user: User | null;
  manualSession: { access_token: string; user: any } | null;
  profile: any | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  syncProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; profilePic?: string }) => Promise<void>;
  setSessionFromPassport: (token: string, user: any) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      manualSession: null,
      profile: null,
      loading: true,

      initialize: async () => {
        // First check Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ session, user: session.user, loading: false });
          get().syncProfile();
        } else if (get().manualSession) {
          // If no Supabase but manual exists
          set({ user: get().manualSession?.user || null, loading: false });
          get().syncProfile();
        } else {
          set({ loading: false });
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            set({ session, user: session.user });
            get().syncProfile();
          }
        });
      },

      setSessionFromPassport: (token, user) => {
        set({ manualSession: { access_token: token, user }, user });
        get().syncProfile();
      },

      syncProfile: async () => {
        const state = get();
        const token = state.session?.access_token || state.manualSession?.access_token;
        if (!token) return;

        const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';
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

        const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';
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
