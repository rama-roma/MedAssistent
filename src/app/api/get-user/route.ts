import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        const supabase = getSupabaseServer();

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error) {
            console.error('Error fetching user:', error);
            return NextResponse.json({ data: null }, { status: 200 });
        }
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Get user API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
