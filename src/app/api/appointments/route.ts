import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize admin client to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { doctor_id, patient_name, patient_phone, note, appointment_date, status, type } = body;

        if (!doctor_id || !appointment_date) {
            return NextResponse.json({ error: 'Doctor ID and appointment date are required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('appointments')
            .insert([{
                doctor_id,
                patient_name,
                patient_phone,
                note,
                appointment_date,
                type,
                status: status || 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating appointment:', error);
            return NextResponse.json({ error: 'Failed to create appointment', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('API error in POST /api/appointments:', error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, doctor_id, patient_name, patient_phone, note, appointment_date, status, type } = body;

        if (!id) {
            return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('appointments')
            .update({
                patient_name,
                patient_phone,
                note,
                appointment_date,
                type,
                status
            })
            .eq('id', id)
            .eq('doctor_id', doctor_id) // Security check
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating appointment:', error);
            return NextResponse.json({ error: 'Failed to update appointment', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('API error in PUT /api/appointments:', error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const doctorId = searchParams.get('doctor_id');

        if (!id || !doctorId) {
            return NextResponse.json({ error: 'Appointment ID and Doctor ID are required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .eq('doctor_id', doctorId); // Security check

        if (error) {
            console.error('Supabase error deleting appointment:', error);
            return NextResponse.json({ error: 'Failed to delete appointment', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('API error in DELETE /api/appointments:', error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctor_id');

        let query = supabaseAdmin.from('appointments').select('*');

        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query.order('appointment_date', { ascending: true });

        if (error) {
            console.error('Supabase error fetching appointments:', error);
            return NextResponse.json({ error: 'Failed to fetch appointments', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('API error in GET /api/appointments:', error);
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
    }
}
