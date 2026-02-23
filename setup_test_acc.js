import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzzeywmbehzbassweudb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function create() {
    const { data, error } = await supabase.auth.signUp({
        email: 'test@finasi.com',
        password: 'Password123!',
        options: {
            data: {
                full_name: 'Test Member',
            }
        }
    });
    console.log(data, error);
}
create();
