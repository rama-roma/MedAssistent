import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { email, full_name, age, gender, address, job, avatar_url } = body;

        console.log('Update user request:', { email, full_name, age, gender, address, job });

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Use admin client to bypass RLS
        const supabaseAdmin = getSupabaseAdmin();


        // Update user in users table
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                full_name,
                age: age ? parseInt(age) : null,
                gender,
                address,
                job,
                fileAvatar: avatar_url,
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
            const authUser = authUsers?.users?.find((u: { email?: string }) => u.email === email);
            
            if (authUser) {
                await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                    user_metadata: {
                        ...authUser.user_metadata,
                        full_name,
                        age: age ? parseInt(age) : null,
                        gender,
                        address,
                        job,
                        avatar_url, // Keep avatar_url in metadata for frontend consistency if used there
                        fileAvatar: avatar_url, // Add fileAvatar to metadata as well for safety
                    }
                });
            }
        } catch (authError) {
            console.error('Auth metadata update error (non-critical):', authError);
        }

        console.log('Update success:', data);
        return NextResponse.json({ data, success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Update user API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: message
        }, { status: 500 });
    }
}

