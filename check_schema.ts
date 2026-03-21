import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data[0] || {}, null, 2));
    
    // Check if the update is erroring
    if (data[0]) {
        const testRes = await supabase.from('leads').update({ payment_amount: 1000 }).eq('id', data[0].id).select();
        console.log("UPDATE result:", testRes.error ? testRes.error.message : "SUCCESS");
    }
  }
}
check();
