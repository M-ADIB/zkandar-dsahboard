import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Instagram, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventRequest } from '@/types/database'

async function downloadFile(url: string, filename: string) {
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
    } catch {
        window.open(url, '_blank')
    }
}

export function EPKPage() {
    const { slug } = useParams<{ slug: string }>()
    const [event, setEvent] = useState<EventRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const fetchEPK = async () => {
            if (!slug) {
                setNotFound(true)
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('event_requests')
                .select('*')
                .eq('epk_slug', slug)
                .eq('epk_generated', true)
                .maybeSingle()

            if (error || !data) {
                setNotFound(true)
            } else {
                setEvent(data)
                document.title = `EPK / ${(data as any).company}`
            }
            setLoading(false)
        }

        fetchEPK()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-[#D0FF71] border-t-transparent animate-spin" />
            </div>
        )
    }

    if (notFound || !event) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
                <p className="text-gray-500 text-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    This EPK is not available.
                </p>
            </div>
        )
    }

    const speakerName = event.epk_speaker_name || 'Khaled Iskandar'
    const showFlyerSection = event.epk_host_provides_flyer || !!event.epk_flyer_url

    return (
        <div
            className="min-h-screen bg-[#0B0B0B] text-white"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
            {/* ─── SECTION 1: Hero ─── */}
            <section className="relative overflow-hidden">
                {/* Dark green radial glow — top right */}
                <div
                    className="pointer-events-none absolute top-0 right-0 w-[700px] h-[700px]"
                    style={{
                        background:
                            'radial-gradient(ellipse at 85% 15%, rgba(20,80,20,0.55) 0%, transparent 65%)',
                    }}
                />

                <div className="relative max-w-5xl mx-auto px-8 pt-14 pb-16">
                    {/* Label */}
                    <div className="mb-12">
                        <span
                            className="text-[#D0FF71] font-bold tracking-[0.22em] uppercase"
                            style={{ fontSize: '10px' }}
                        >
                            Electronic Press Kit
                        </span>
                        <div className="mt-1.5 h-0.5 w-10 bg-[#D0FF71]" />
                    </div>

                    {/* Two-column layout */}
                    <div className="flex gap-14 items-start">
                        {/* Left: headshot + download */}
                        <div className="shrink-0">
                            {event.epk_headshot_url ? (
                                <img
                                    src={event.epk_headshot_url}
                                    alt={speakerName}
                                    className="w-60 h-72 object-cover shadow-2xl"
                                    style={{ objectPosition: 'top center' }}
                                />
                            ) : (
                                <div className="w-60 h-72 bg-[#1A1A1A] rounded-2xl" />
                            )}
                            <button
                                onClick={() =>
                                    event.epk_headshot_url &&
                                    downloadFile(
                                        event.epk_headshot_url,
                                        `${speakerName.replace(/\s+/g, '-').toLowerCase()}-headshot.jpg`
                                    )
                                }
                                disabled={!event.epk_headshot_url}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D0FF71] hover:bg-[#c0ef61] text-black text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Download Headshot
                            </button>
                        </div>

                        {/* Right: speaker info */}
                        <div className="flex-1 pt-2">
                            <h1
                                className="text-white font-black leading-none tracking-tight"
                                style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)' }}
                            >
                                {speakerName}
                            </h1>

                            {event.epk_speaker_title && (
                                <p className="mt-4 text-lg text-gray-300 font-medium">
                                    {event.epk_speaker_title}
                                </p>
                            )}

                            {event.epk_company && (
                                <p className="mt-1.5 text-gray-500 text-base">
                                    {event.epk_company}
                                </p>
                            )}

                            {event.epk_instagram && (
                                <a
                                    href={`https://www.instagram.com/${event.epk_instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 flex items-center gap-2 text-gray-400 hover:text-[#D0FF71] transition-colors w-fit"
                                >
                                    <Instagram className="w-4 h-4 shrink-0" />
                                    <span className="text-sm">{event.epk_instagram}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="max-w-5xl mx-auto px-8">
                <hr className="border-white/8" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* ─── SECTION 2: Talk Title ─── */}
            {event.epk_talk_title && (
                <>
                    <section className="max-w-5xl mx-auto px-8 py-16">
                        <p
                            className="text-[#D0FF71] font-bold tracking-[0.22em] uppercase mb-7"
                            style={{ fontSize: '10px' }}
                        >
                            Talk Title
                        </p>
                        <blockquote
                            className="text-white font-black italic leading-tight"
                            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
                        >
                            &ldquo;{event.epk_talk_title}&rdquo;
                        </blockquote>
                    </section>

                    <div className="max-w-5xl mx-auto px-8">
                        <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    </div>
                </>
            )}

            {/* ─── SECTION 3: Bio ─── */}
            {event.epk_bio && (
                <section className="max-w-5xl mx-auto px-8 py-16">
                    <p
                        className="text-[#D0FF71] font-bold tracking-[0.22em] uppercase mb-7"
                        style={{ fontSize: '10px' }}
                    >
                        Bio
                    </p>
                    <p className="text-gray-300 leading-relaxed max-w-3xl" style={{ fontSize: '1.05rem' }}>
                        {event.epk_bio}
                    </p>
                </section>
            )}

            {/* ─── SECTION 4: Events / Flyer ─── */}
            {showFlyerSection && (
                <>
                    <div className="max-w-5xl mx-auto px-8">
                        <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    </div>

                    <section className="relative max-w-5xl mx-auto px-8 py-16">
                        {/* Subtle glow on the right for flyer section */}
                        <div
                            className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px]"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 90% 50%, rgba(15,60,15,0.4) 0%, transparent 70%)',
                            }}
                        />

                        <p
                            className="text-[#D0FF71] font-bold tracking-[0.22em] uppercase mb-8"
                            style={{ fontSize: '10px' }}
                        >
                            Events
                        </p>

                        {event.epk_host_provides_flyer ? (
                            <p className="text-gray-500 italic text-base">
                                Flyer to be provided by the hosting organization.
                            </p>
                        ) : event.epk_flyer_url ? (
                            <div className="inline-block">
                                <img
                                    src={event.epk_flyer_url}
                                    alt="Event flyer"
                                    className="max-w-xs shadow-2xl border border-white/5"
                                />
                                <div className="mt-5">
                                    <button
                                        onClick={() =>
                                            downloadFile(
                                                event.epk_flyer_url!,
                                                `${speakerName.replace(/\s+/g, '-').toLowerCase()}-event-flyer.jpg`
                                            )
                                        }
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#D0FF71] hover:bg-[#c0ef61] text-black text-sm font-bold transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Flyer
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </section>
                </>
            )}

            {/* Footer */}
            <div className="max-w-5xl mx-auto px-8 py-12">
                <p className="text-center" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.12)' }}>
                    Zkandar AI · Electronic Press Kit
                </p>
            </div>
        </div>
    )
}
