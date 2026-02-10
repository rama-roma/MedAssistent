const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('='))
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Fetching a single user to check column names...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
        console.error('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('User data keys:', Object.keys(data[0]));
        // Check specifically for avatar fields
        console.log('Has avatar_url:', 'avatar_url' in data[0]);
        console.log('Has fileAvatar:', 'fileAvatar' in data[0]);
        console.log('Sample avatar_url:', data[0].avatar_url);
        console.log('Sample fileAvatar:', data[0].fileAvatar);
    } else {
        console.log('No users found in table.');
    }
}

checkSchema();
