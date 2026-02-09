import { supabase } from './supabase';

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

/**
 * Fetches all users from the 'users' table sorted by created_at descending.
 * @returns {Promise<User[]>} A promise that resolves to an array of User objects, or an empty array if an error occurs.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data as User[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching users:', err);
    return [];
  }
};
