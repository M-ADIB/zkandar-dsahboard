export function formatRelativeTime(isoDate: string) {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ''

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
    if (diffSeconds < 60) return `${diffSeconds}s ago`

    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
}

export function formatDateLabel(isoDate: string) {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export function formatTimeLabel(isoDate: string) {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatSessionDateTime(isoDate: string) {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return 'TBD'
    
    // Format the date part (e.g., June 3, 2026)
    const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Dubai'
    })
    
    // Format the time part (e.g., 07:00 PM)
    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Dubai'
    })
    
    return `${dateStr} @ ${timeStr} DUBAI`
}
