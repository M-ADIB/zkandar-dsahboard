const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
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
    console.log(JSON.stringify({ data, error }, null, 2));
}
create();
