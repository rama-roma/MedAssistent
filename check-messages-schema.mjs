import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ocoxfiilcdmasvmxxasp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jb3hmaWlsY2RtYXN2bXh4YXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA4OTc2MiwiZXhwIjoyMDg1NjY1NzYyfQ.D6bO8vP9pqss3ufHa7_RRzW_Z-6GGysdRaCdyiaVaoQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- MESSAGES TABLE ---');
    const { data: messagesData } = await supabase.from('messages').select('*').limit(1);
    if (messagesData && messagesData[0]) console.log('Columns in messages:', Object.keys(messagesData[0]));

    console.log('\n--- PROFILES TABLE ---');
    const { data: profilesData } = await supabase.from('profiles').select('*').limit(1);
    if (profilesData && profilesData[0]) console.log('Columns in profiles:', Object.keys(profilesData[0]));
    else console.log('Profiles table empty or error');
}

checkSchema();
