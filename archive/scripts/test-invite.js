import { createClient } from '@supabase/supabase-js'

const url = 'https://gzzeywmbehzbassweudb.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emV5d21iZWh6YmFzc3dldWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzYyODUsImV4cCI6MjA4NTk1MjI4NX0.lnVHSOdRVOVXmjQG9mIyh6UOAeDdY8Q68vYcJvZannc'

const supabase = createClient(url, anonKey)

async function test() {
  console.log('Logging in as admin...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@zkandar.com',
    password: 'password123'
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('Logged in! Token:', authData.session.access_token.substring(0, 15) + '...')
  
  console.log('Invoking invite-user Edge Function...')
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      first_name: 'Test',
      last_name: 'Invite',
      email: 'adib@zkandar.com',
      role: 'participant',
      cohort_id: '813335a5-3d30-497c-a27d-f2702020f6b2'
    }
  })

  if (error) {
    console.error('Edge Function HTTP error:', error)
  } else {
    console.log('Edge Function response:', data)
  }
}

test()
