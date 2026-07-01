import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(url, anonKey)

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'm.mohan@finasi.ae',
    password: 'password123'
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('Logged in!')
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError) {
    console.error('Profile error:', profileError)
  } else {
    console.log('Profile loaded:', userProfile)
  }
}
test()
