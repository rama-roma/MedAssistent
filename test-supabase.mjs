import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    console.log('Variables check:');
    console.log('URL:', supabaseUrl);
    console.log('Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

    console.log('\nTesting Supabase connection with Service Role Key...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error('Test failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Test successful! User count:', data);
    }
}

test();
