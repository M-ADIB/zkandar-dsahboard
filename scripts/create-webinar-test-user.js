import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env.');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isCleanup = args.includes('--cleanup');

// Filter out flags starting with '--'
const positionalArgs = args.filter(arg => !arg.startsWith('--'));
const EMAIL = positionalArgs[0] || 'test_webinar_e2e@zkandar.com';
const PASSWORD = positionalArgs[1] || 'password123';
const NAME = 'E2E Test Webinar Member';
const WEBINAR_COHORT_ID = '773335a5-3d30-497c-a27d-f2702020e9a9';

async function runAutomaticSetup(userId) {
    console.log('\nService Role Key found! Running automatic database configuration...');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 1. Confirm email using Admin API
    console.log('Confirming email in Supabase Auth...');
    const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: { email_verified: true }
    });

    if (authErr) {
        console.error('Failed to confirm email via Admin API:', authErr.message);
        return false;
    }

    // 2. Set user type to webinar_member and reset onboarding
    console.log('Setting user_type and resetting onboarding in public.users...');
    const { error: dbErr } = await adminClient
        .from('users')
        .update({
            user_type: 'webinar_member',
            onboarding_completed: false,
            profile_data: {}
        })
        .eq('id', userId);

    if (dbErr) {
        console.error('Failed to update public.users:', dbErr.message);
        return false;
    }

    // 3. Link to webinar cohort
    console.log('Enrolling user in the webinar cohort...');
    const { error: cohortErr } = await adminClient
        .from('cohort_memberships')
        .insert({
            user_id: userId,
            cohort_id: WEBINAR_COHORT_ID
        });

    if (cohortErr && !cohortErr.message.includes('duplicate key')) {
        console.error('Failed to enroll user in cohort:', cohortErr.message);
        return false;
    }

    console.log('Automatic configuration complete!');
    return true;
}

async function runAutomaticCleanup() {
    console.log(`Cleaning up test user ${EMAIL}...`);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Get user id first
    const { data: users, error: findErr } = await adminClient
        .from('users')
        .select('id')
        .eq('email', EMAIL);

    if (findErr || !users || users.length === 0) {
        console.log('No public user record found. Attempting auth deletion directly...');
    }

    // Delete auth user (cascades to public.users and cohort memberships)
    const { data: authUsers, error: listErr } = await adminClient.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === EMAIL);

    if (authUser) {
        const { error: delErr } = await adminClient.auth.admin.deleteUser(authUser.id);
        if (delErr) {
            console.error('Failed to delete auth user:', delErr.message);
            process.exit(1);
        }
        console.log('Auth user deleted successfully (cascaded cleanup complete).');
    } else {
        console.log('No auth user record found for this email.');
    }
    process.exit(0);
}

function printManualSQL(userId) {
    console.log(`
============================================================
MANUAL SETUP REQUIRED (No Service Role Key found in env)
============================================================
1. Sign up the user first (which has been initiated in this script).
2. Copy and paste the following SQL in your Supabase Dashboard SQL Editor:

-- 1. Confirm email and verify metadata
UPDATE auth.users
SET email_confirmed_at = NOW(),
    raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
WHERE email = '${EMAIL}';

-- 2. Configure user type and onboarding state
UPDATE public.users
SET user_type = 'webinar_member',
    onboarding_completed = false,
    profile_data = '{}'
WHERE email = '${EMAIL}';

-- 3. Link user to the default webinar cohort
INSERT INTO public.cohort_memberships (user_id, cohort_id)
VALUES ('${userId}', '${WEBINAR_COHORT_ID}')
ON CONFLICT DO NOTHING;

============================================================
`);
}

function printManualCleanupSQL() {
    console.log(`
============================================================
MANUAL CLEANUP REQUIRED
============================================================
Copy and paste the following SQL in your Supabase Dashboard SQL Editor:

DELETE FROM auth.users WHERE email = '${EMAIL}';

============================================================
`);
}

async function main() {
    if (isCleanup) {
        if (supabaseServiceKey) {
            await runAutomaticCleanup();
        } else {
            printManualCleanupSQL();
        }
        process.exit(0);
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`Signing up user ${EMAIL} with password ${PASSWORD}...`);
    
    const { data, error } = await anonClient.auth.signUp({
        email: EMAIL,
        password: PASSWORD,
        options: {
            data: {
                full_name: NAME
            }
        }
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('User is already signed up.');
            // Get user id if already exists to print SQL
            const { data: userSearch } = await anonClient
                .from('users')
                .select('id')
                .eq('email', EMAIL);
            const userId = userSearch?.[0]?.id || '<USER_ID>';
            
            if (supabaseServiceKey) {
                const ok = await runAutomaticSetup(userId);
                if (ok) {
                    console.log(`\n🎉 Ready! Log in at: http://localhost:8080/login\nCredentials:\n  Email: ${EMAIL}\n  Password: ${PASSWORD}`);
                }
            } else {
                printManualSQL(userId);
            }
        } else {
            console.error('Signup failed:', error.message);
        }
        process.exit(0);
    }

    const userId = data.user?.id;
    console.log('Signup completed! User ID:', userId);

    if (supabaseServiceKey) {
        const ok = await runAutomaticSetup(userId);
        if (ok) {
            console.log(`\n🎉 Ready! Log in at: http://localhost:8080/login\nCredentials:\n  Email: ${EMAIL}\n  Password: ${PASSWORD}`);
        }
    } else {
        printManualSQL(userId);
    }
}

main();
