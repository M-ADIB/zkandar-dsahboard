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
        // Verify the caller is authenticated
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Verify JWT and get user — use anon client for the verification
        const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        })
        const { data: { user }, error: authError } = await anonClient.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Use service role client to delete auth user (cascades to users table via RLS/FK)
        const adminClient = createClient(supabaseUrl, serviceRoleKey)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
        if (deleteError) throw deleteError

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
