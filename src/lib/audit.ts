import { supabase } from './supabase'

export type AuditAction =
    | 'lead.create' | 'lead.update' | 'lead.delete' | 'lead.bulk_delete'
    | 'user.invite' | 'user.update' | 'user.deactivate' | 'user.delete'
    | 'company.create' | 'company.update' | 'company.delete'
    | 'event.approve' | 'event.decline'
    | 'cost.create' | 'cost.update' | 'cost.delete'

/**
 * Log an admin action to the audit_logs table.
 * Fails silently — never throws, so it never disrupts the user action.
 */
export async function logAudit(
    action: AuditAction,
    entityType: string,
    entityId?: string | null,
    metadata?: Record<string, unknown>
) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await (supabase as any).from('audit_logs').insert({
            user_id: user.id,
            action,
            entity_type: entityType,
            entity_id: entityId ?? null,
            metadata: metadata ?? null,
        })
    } catch {
        // Audit logging must never interrupt normal operations
    }
}
