import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullname, email, password, age, gender, job, address, photo } = body;

        // Debug logging
        console.log('API Request received for:', email);
        console.log('Supabase URL available:', !!supabaseUrl);
        console.log('Supabase Service Key available:', !!supabaseServiceKey);

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials' }, { status: 500 });
        }

        // Create Supabase admin client
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Create user in Supabase Auth with metadata
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullname,
                age: parseInt(age),
                gender,
                job,
                address,
                avatar_url: photo || null,
                phone: null,
            }
        });

        if (authError) {
            console.error('Supabase Auth error details:', authError);
            if (authError.message.includes('API key')) {
                return NextResponse.json({ error: 'Invalid API key. Please check your Supabase Service Role Key.' }, { status: 400 });
            }
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Also insert into users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                full_name: fullname,
                email,
                age: parseInt(age),
                gender,
                address,
                job,
                avatar_url: photo || null,
            });

        if (dbError) {
            console.error('Database insert error:', dbError);
            // User is created in auth, but not in users table - this is acceptable
        }

        // Send Telegram notification
        const token = "8513126619:AAEpf2mCm0PIejYryQKPdPHrIG-_laYiLNQ";
        const chatId = "7669402425";

        const message = `
🏥 *New Doctor Registration*

👤 *Full Name:* ${fullname}
📧 *Email:* ${email}
🎂 *Age:* ${age}
⚧ *Gender:* ${gender}
🩺 *Specialty:* ${job}
📍 *Address:* ${address}

✅ *Account created successfully!*
        `;

        if (photo) {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', message);
            formData.append('parse_mode', 'Markdown');
            
            const base64Data = photo.split(',')[1] || photo;
            const buffer = Buffer.from(base64Data, 'base64');
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            
            formData.append('photo', blob, 'doctor_photo.jpg');

            const telegramUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
            await fetch(telegramUrl, {
                method: 'POST',
                body: formData,
            });
        } else {
            const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
            await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown',
                }),
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Account created successfully!' 
        });
    } catch (error) {
        console.error('Registration API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
