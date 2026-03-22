import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getCorsHeaders(req: Request): Record<string, string> {
    const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
    const requestOrigin = req.headers.get('origin') ?? ''
    
    const isLocalhost = requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:')
    const origin = isLocalhost ? requestOrigin : (allowedOrigin || '*')
    
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
}

Deno.serve(async (req) => {
    const dynamicCorsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: dynamicCorsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'DEBUG 401: Missing Auth Header' }), {
                status: 200,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const adminClient = createClient(supabaseUrl, serviceRoleKey)
        
        // Pass the auth token dynamically to verify the user
        const token = authHeader.replace(/^Bearer\s+/i, '')
        const { data: { user: callerAuth }, error: authError } = await adminClient.auth.getUser(token)
        if (authError || !callerAuth) {
            return new Response(JSON.stringify({ error: `DEBUG 401: Unauthorized user fetch.` }), {
                status: 200,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Use service role for admin operations to check caller permissions
        const { data: callerProfile } = await adminClient
            .from('users')
            .select('role')
            .eq('id', callerAuth.id)
            .single()

        if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
            return new Response(JSON.stringify({ error: `DEBUG 403: Forbidden admins only.` }), {
                status: 200,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { user_id } = await req.json() as { user_id: string }

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'DEBUG 400: user_id is required' }), {
                status: 200,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Completely obliterate the user's auth record.
        // If RLS/Triggers are set correctly, this cascades into public.users.
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id)

        if (deleteError) {
             return new Response(JSON.stringify({ error: `DEBUG 400 Delete Error: ${deleteError.message}` }), {
                status: 200,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return new Response(JSON.stringify({ error: `DEBUG 500 Catch: ${message}` }), {
            status: 200,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
