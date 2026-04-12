// ─── Shared types for the Content Aggregator feature ─────────────────────────

export type SourceType = 'video_channel' | 'blog' | 'search_query'
export type SourceStatus = 'pending' | 'success' | 'failing'

export interface ContentSource {
    id: string
    name: string
    type: SourceType
    url: string | null
    query: string | null
    max_results: number
    last_checked_at: string | null
    status: SourceStatus
    error_log: string | null
    active: boolean
    created_at: string
    updated_at: string
}

export interface ContentItem {
    id: string
    source_id: string | null
    title: string
    original_url: string
    published_at: string | null
    summary: string | null
    relevance_score: number | null
    deep_dive: string | null
    action_items: string[]
    is_read: boolean
    is_pinned: boolean
    is_archived: boolean
    created_at: string
    updated_at: string
    content_sources?: { name: string; type: SourceType } | null
}

export interface ContentSubscriber {
    id: string
    email: string
    name: string | null
    origin_source: string | null
    active: boolean
    created_at: string
}
