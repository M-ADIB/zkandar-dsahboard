export const EPK_DEFAULTS = {
    speakerName: 'Khaled Iskandar',
    speakerTitle: 'AI Educator & Workflow Strategist',
    company: 'Zkandar L.L.C',
    instagram: '@zkandar',
    bio: 'Khaled is an architect and interior designer turned AI Educator and workflow strategist, specializing in integrating AI tools into design workflows. With experience in Luxury F&B, wellness spaces and high profile projects like Formula 1 venues, he now leads tailored AI Masterclasses for global firms and award-winning studios, transforming how creative teams work.',
    headshotUrl: 'https://gzzeywmbehzbassweudb.supabase.co/storage/v1/object/public/epk-assets/Khaled-Iskandar-Headshot.jpg',
} as const

export function generateEPKSlug(eventType: string, venue: string): string {
    return `${eventType} ${venue}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80)
        .replace(/^-+|-+$/g, '')
}
