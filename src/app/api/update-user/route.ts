import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { email, full_name, age, gender, address, job } = body;

        console.log('Update user request:', { email, full_name, age, gender, address, job });

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase credentials');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Use admin client to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Update user in users table
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                full_name,
                age: age ? parseInt(age) : null,
                gender,
                address,
                job,
            })
            .eq('email', email)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ 
                error: 'Failed to update profile', 
                details: error.message 
            }, { status: 500 });
        }

        // Also update user_metadata in auth
        try {
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);
            
            if (authUser) {
                await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                    user_metadata: {
                        ...authUser.user_metadata,
                        full_name,
                        age: age ? parseInt(age) : null,
                        gender,
                        address,
                        job,
                    }
                });
            }
        } catch (authError) {
            console.error('Auth metadata update error (non-critical):', authError);
        }

        console.log('Update success:', data);
        return NextResponse.json({ data, success: true });
    } catch (error: any) {
        console.error('Update user API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
