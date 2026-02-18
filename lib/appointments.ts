import { supabase } from './supabase';

export interface Appointment {
    id: string;
    doctor_id: string;
    patient_name: string | null;
    patient_phone: string | null;
    note: string | null;
    appointment_date: string | null; // ISO 8601 timestamp
    type: string | null;
    created_at?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
}

/**
 * Creates a new appointment in the 'appointments' table.
 */
export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> => {
    const { data, error } = await supabase
        .from('appointments')
        .insert([appointment])
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }

    return data;
};

/**
 * Fetches appointments for a specific doctor.
 */
export const fetchAppointmentsByDoctorId = async (doctorId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true });

    if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
    }

    return data || [];
};

/**
 * Fetches all appointments (Admin/General).
 */
export const fetchAllAppointments = async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

    if (error) {
        console.error('Error fetching all appointments:', error);
        throw error;
    }

    return data || [];
};

/**
 * Deletes an appointment by ID.
 */
export const deleteAppointment = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
    }
};
