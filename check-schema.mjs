import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
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
        console.log('User data structure:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
    } else {
        console.log('No users found in table.');
    }
}

checkSchema();
