/**
 * invite-user — Admin user invitation
 *
 * Called from: src/components/admin/users/InviteUserModal.tsx
 * Requires: caller must be owner or admin role
 *
 * Flow:
 *  1. Verify caller JWT and assert owner/admin role
 *  2. Call auth.admin.inviteUserByEmail — Supabase creates the auth user
 *     and fires the send-auth-email hook (type = "invite")
 *  3. Insert a tracking record in the `invitations` table for the admin UI
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req: Request): Record<string, string> {
    const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
    const requestOrigin = req.headers.get('origin') ?? ''
    const origin = allowedOrigin
        ? (requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin)
        : requestOrigin || '*'
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req)

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

        // Verify the caller's JWT and get their profile
        const callerClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        })
        const { data: { user: callerAuth }, error: authError } = await callerClient.auth.getUser()
        if (authError || !callerAuth) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check caller is owner or admin
        const adminClient = createClient(supabaseUrl, serviceRoleKey)
        const { data: callerProfile } = await adminClient
            .from('users')
            .select('role')
            .eq('id', callerAuth.id)
            .single()

        if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
            return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Parse body
        const { email, role, company_id, cohort_id } = await req.json() as {
            email: string
            role: string
            company_id?: string
            cohort_id?: string
        }

        if (!email || !role) {
            return new Response(JSON.stringify({ error: 'email and role are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Invite via Supabase Auth — triggers the send-auth-email hook (type=invite)
        const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
            data: {
                role,
                company_id: company_id ?? null,
                cohort_id: cohort_id ?? null,
            },
            redirectTo: `${Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.zkandar.com'}/`,
        })

        if (inviteError) {
            // Return a friendly error for already-registered emails
            const msg = inviteError.message.toLowerCase().includes('already registered')
                ? 'This email is already registered'
                : inviteError.message
            return new Response(JSON.stringify({ error: msg }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Insert tracking record in the invitations table for admin UI display
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        await adminClient.from('invitations').insert({
            email,
            company_id: company_id ?? null,
            invited_by: callerAuth.id,
            token: invitedUser?.user?.id ?? crypto.randomUUID(),
            status: 'pending',
            expires_at: expiresAt,
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error'
        console.error('invite-user error:', message)
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
