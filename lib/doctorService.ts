import { supabase } from './supabase';

export interface Doctor {
    id: string;
    full_name: string | null;
    specialization: string | null;
    email: string | null;
    bio: string | null;
    avatar_url: string | null;
    clinic: string | null;
}

/**
 * Fetches all doctors from the 'doctors' table.
 */
export const fetchDoctors = async (): Promise<Doctor[]> => {
    const { data, error } = await supabase
        .from('doctors')
        .select('*');

    if (error) {
        console.error('Error fetching doctors:', error);
        throw error;
    }

    return data || [];
};

/**
 * Fetches a single doctor by their UUID.
 * @param id The UUID of the doctor.
 */
export const fetchDoctorById = async (id: string): Promise<Doctor | null> => {
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching doctor by id:', error);
        throw error;
    }

    return data;
};
