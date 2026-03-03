/**
 * Accepts any Vimeo URL format or a bare video ID.
 * Returns a canonical embed URL like:
 *   https://player.vimeo.com/video/123456789
 * or null if the input cannot be parsed as a Vimeo video.
 */
export function parseVimeoEmbedUrl(input: string): string | null {
    if (!input || !input.trim()) return null

    const raw = input.trim()

    // Already a Vimeo embed URL — extract ID and reconstruct cleanly
    const embedMatch = raw.match(/player\.vimeo\.com\/video\/(\d+)/)
    if (embedMatch) {
        return `https://player.vimeo.com/video/${embedMatch[1]}`
    }

    // Standard vimeo.com URL: vimeo.com/<id>, vimeo.com/channels/x/<id>,
    // vimeo.com/groups/x/videos/<id>, vimeo.com/album/x/video/<id>
    const watchMatch = raw.match(/vimeo\.com\/(?:.*\/)?(\d+)(?:\/|\?|#|$)/)
    if (watchMatch) {
        return `https://player.vimeo.com/video/${watchMatch[1]}`
    }

    // Bare numeric ID
    if (/^\d+$/.test(raw)) {
        return `https://player.vimeo.com/video/${raw}`
    }

    return null
}
