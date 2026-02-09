import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: null | any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    set({ user: data.user, loading: false });
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token'); // Clear specific tokens if known, or clear all
    localStorage.clear(); // Nuclear option as requested to be sure
    set({ user: null });
    // Optional: Force reload to ensure memory state is clean
    window.location.href = '/'; 
  },

  init: async () => {
    const { data } = await supabase.auth.getUser();
    set({ user: data.user });
  },
}));
