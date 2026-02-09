import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ocoxfiilcdmasvmxxasp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jb3hmaWlsY2RtYXN2bXh4YXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA4OTc2MiwiZXhwIjoyMDg1NjY1NzYyfQ.D6bO8vP9pqss3ufHa7_RRzW_Z-6GGysdRaCdyiaVaoQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addIsReadColumn() {
    console.log('--- ATTEMPTING TO ADD is_read COLUMN ---');
    
    // First check if it's already there (just in case)
    const { data: messagesData } = await supabase.from('messages').select('*').limit(1);
    if (messagesData && messagesData[0] && 'is_read' in messagesData[0]) {
        console.log('Column is_read already exists!');
        return;
    }

    const sql = 'ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;';
    
    // Attempt via common RPC names if they exist
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('RPC exec_sql failed:', error.message);
        
        // Try another variation
        const { data: data2, error: error2 } = await supabase.rpc('run_sql', { sql });
        if (error2) {
            console.error('RPC run_sql failed:', error2.message);
            console.log('\n--- NOTIFICATION ---');
            console.log('Could not add column via RPC. Please add "is_read" (boolean, default false) to "messages" table manually.');
        } else {
            console.log('Column added successfully via run_sql!');
        }
    } else {
        console.log('Column added successfully via exec_sql!');
    }
}

addIsReadColumn();
