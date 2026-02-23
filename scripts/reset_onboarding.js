import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EMAIL = 'adib.baroudi2@gmail.com'

async function resetOnboarding() {
    console.log(`Resetting onboarding for ${EMAIL}...`)

    // 1. Get user
    const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id, full_name')
        .ilike('email', EMAIL)

    if (userErr || !users || users.length === 0) {
        console.error('User not found:', userErr)
        // fallback, try to delete by email anyway
    }

    const userId = users && users.length > 0 ? users[0].id : null;
    console.log(`Found user: ${userId}`)

    // 2. Set onboarding_completed = false
    const { error: updateErr } = await supabase
        .from('users')
        .update({ onboarding_completed: false })
        .ilike('email', EMAIL)

    if (updateErr) {
        console.error('Error updating user:', updateErr.message)
    } else {
        console.log('User status reset to onboarding_completed: false')
    }

    // 3. Delete from team_submissions
    const { error: teamErr } = await supabase
        .from('team_submissions')
        .delete()
        .ilike('email', EMAIL)

    if (teamErr) {
        console.error('Error deleting team_submission:', teamErr.message)
    } else {
        console.log('Deleted any team submissions')
    }

    // 4. Delete from management_submissions
    const { error: mgmtErr } = await supabase
        .from('management_submissions')
        .delete()
        .ilike('email', EMAIL)

    if (mgmtErr) {
        console.error('Error deleting management_submission:', mgmtErr.message)
    } else {
        console.log('Deleted any management submissions')
    }

    console.log('Reset complete.')
}

resetOnboarding()
