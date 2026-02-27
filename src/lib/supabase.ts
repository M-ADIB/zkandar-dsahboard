import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            // Bypass navigator.locks to prevent AbortError when multiple
            // tabs are open or React Strict Mode double-mounts.
            // This uses a simple mutex instead of the browser Lock API.
            lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                return await fn()
            },
        },
    }
)

// Export URL and key for direct REST fallback in AuthContext
export { supabaseUrl, supabaseAnonKey }
