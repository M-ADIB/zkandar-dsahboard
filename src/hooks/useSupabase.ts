import { supabase } from '@/lib/supabase';

export function useSupabase() {
    return supabase;
}

export function useAdmin() {
    // Placeholder for admin-specific logic
    // In future: check roles, fetch admin-only data
    return {};
}
