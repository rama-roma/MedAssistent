import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  full_name: string;
  email: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        set({ error: error.message, loading: false });
        return;
      }

      const mappedUsers = (data || []).map((u: any) => ({
        ...u,
        avatar_url: u.fileAvatar || u.avatar_url || null,
      }));

      set({ users: mappedUsers, loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error:', err);
      set({ error: errorMessage, loading: false });
    }
  },
}));
