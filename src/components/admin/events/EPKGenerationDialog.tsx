import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EventRequest } from '@/types/database'
import { EPK_DEFAULTS, generateEPKSlug } from '@/constants/epk'

export interface EPKFormData {
    epk_speaker_name: string
    epk_speaker_title: string
    epk_company: string
    epk_instagram: string
    epk_talk_title: string
    epk_bio: string
    epk_headshot_url: string
    epk_flyer_url: string | null
    epk_host_provides_flyer: boolean
    epk_slug: string
    epk_generated: true
}

interface EPKGenerationDialogProps {
    isOpen: boolean
    event: EventRequest
    onGenerateAndApprove: (epkData: EPKFormData) => Promise<void>
    onApproveWithoutEPK: () => Promise<void>
    onCancel: () => void
}

export function EPKGenerationDialog({
    isOpen,
    event,
    onGenerateAndApprove,
    onApproveWithoutEPK,
    onCancel,
}: EPKGenerationDialogProps) {
    const [speakerName, setSpeakerName] = useState(event.epk_speaker_name || EPK_DEFAULTS.speakerName)
    const [speakerTitle, setSpeakerTitle] = useState(event.epk_speaker_title || EPK_DEFAULTS.speakerTitle)
    const [company, setCompany] = useState(event.epk_company || EPK_DEFAULTS.company)
    const [instagram, setInstagram] = useState(event.epk_instagram || EPK_DEFAULTS.instagram)
    const [talkTitle, setTalkTitle] = useState(event.epk_talk_title || '')
    const [bio, setBio] = useState(event.epk_bio || EPK_DEFAULTS.bio)
    const [hostProvidesFlyer, setHostProvidesFlyer] = useState(event.epk_host_provides_flyer || false)

    const initialHeadshot = event.epk_headshot_url || EPK_DEFAULTS.headshotUrl
    const [headshotPreview, setHeadshotPreview] = useState<string>(initialHeadshot)
    const [headshotFile, setHeadshotFile] = useState<File | null>(null)

    const initialFlyer = event.epk_flyer_url || ''
    const [flyerPreview, setFlyerPreview] = useState<string>(initialFlyer)
    const [flyerFile, setFlyerFile] = useState<File | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isApprovingWithout, setIsApprovingWithout] = useState(false)

    const headshotInputRef = useRef<HTMLInputElement>(null)
    const flyerInputRef = useRef<HTMLInputElement>(null)

    const slug = generateEPKSlug(event.event_type, event.venue)

    const handleHeadshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setHeadshotFile(file)
        setHeadshotPreview(URL.createObjectURL(file))
    }

    const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFlyerFile(file)
        setFlyerPreview(URL.createObjectURL(file))
    }

    const uploadFile = async (file: File, path: string): Promise<string> => {
        const ext = file.name.split('.').pop()
        const fullPath = `${path}.${ext}`
        const { data, error } = await supabase.storage
            .from('epk-assets')
            .upload(fullPath, file, { upsert: true })
        if (error) throw error
        const { data: urlData } = supabase.storage.from('epk-assets').getPublicUrl(data.path)
        return urlData.publicUrl
    }

    const handleGenerateAndApprove = async () => {
        setIsSubmitting(true)
        try {
            let finalHeadshotUrl = headshotPreview
            let finalFlyerUrl: string | null = initialFlyer || null

            if (headshotFile) {
                finalHeadshotUrl = await uploadFile(headshotFile, `headshots/${event.id}`)
            }

            if (!hostProvidesFlyer && flyerFile) {
                finalFlyerUrl = await uploadFile(flyerFile, `flyers/${event.id}`)
            }

            const epkData: EPKFormData = {
                epk_speaker_name: speakerName,
                epk_speaker_title: speakerTitle,
                epk_company: company,
                epk_instagram: instagram,
                epk_talk_title: talkTitle,
                epk_bio: bio,
                epk_headshot_url: finalHeadshotUrl,
                epk_flyer_url: hostProvidesFlyer ? null : finalFlyerUrl,
                epk_host_provides_flyer: hostProvidesFlyer,
                epk_slug: slug,
                epk_generated: true,
            }

            await onGenerateAndApprove(epkData)
        } catch (error) {
            console.error('EPK generation error:', error)
            alert('Failed to generate EPK. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleApproveWithout = async () => {
        setIsApprovingWithout(true)
        try {
            await onApproveWithoutEPK()
        } finally {
            setIsApprovingWithout(false)
        }
    }

    const inputClass = 'w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D0FF71]/50 transition-colors'
    const labelClass = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="relative w-full max-w-2xl bg-[#0B0B0B] border border-white/10 rounded-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">Generate Electronic Press Kit</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {event.event_type} — {event.company}
                                </p>
                            </div>
                            <button
                                onClick={onCancel}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
                            {/* EPK URL preview */}
                            <div className="p-4 bg-[#D0FF71]/5 border border-[#D0FF71]/20 rounded-xl flex items-start gap-3">
                                <LinkIcon className="w-4 h-4 text-[#D0FF71] shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-xs text-[#D0FF71] font-semibold mb-0.5">Public EPK URL</p>
                                    <p className="text-sm text-white font-mono break-all">
                                        https://ops.zkandar.com/epk/{slug}
                                    </p>
                                </div>
                            </div>

                            {/* Headshot upload */}
                            <div>
                                <label className={labelClass}>Speaker Headshot</label>
                                <div className="flex items-start gap-5">
                                    <div className="relative shrink-0">
                                        {headshotPreview ? (
                                            <img
                                                src={headshotPreview}
                                                alt="Headshot preview"
                                                className="w-24 h-28 object-cover rounded-xl border border-white/10"
                                            />
                                        ) : (
                                            <div className="w-24 h-28 bg-[#1A1A1A] border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-gray-600" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => headshotInputRef.current?.click()}
                                            className="absolute -bottom-2 -right-2 p-1.5 bg-[#D0FF71] hover:bg-[#b5e55e] rounded-lg transition-colors"
                                        >
                                            <Upload className="w-3 h-3 text-black" />
                                        </button>
                                    </div>
                                    <div className="flex-1 text-sm text-gray-500 pt-1 leading-relaxed">
                                        <p>Upload a headshot for this event. Defaults are pre-filled from the configured default headshot.</p>
                                        <button
                                            onClick={() => headshotInputRef.current?.click()}
                                            className="mt-2 text-[#D0FF71] hover:underline text-xs"
                                        >
                                            Choose file
                                        </button>
                                    </div>
                                    <input
                                        ref={headshotInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleHeadshotChange}
                                    />
                                </div>
                            </div>

                            {/* Speaker details grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Speaker Name</label>
                                    <input
                                        type="text"
                                        value={speakerName}
                                        onChange={(e) => setSpeakerName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Title</label>
                                    <input
                                        type="text"
                                        value={speakerTitle}
                                        onChange={(e) => setSpeakerTitle(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Company</label>
                                    <input
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Instagram</label>
                                    <input
                                        type="text"
                                        value={instagram}
                                        onChange={(e) => setInstagram(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Talk title */}
                            <div>
                                <label className={labelClass}>Talk Title</label>
                                <input
                                    type="text"
                                    value={talkTitle}
                                    onChange={(e) => setTalkTitle(e.target.value)}
                                    placeholder="e.g. The Silent AI Revolution"
                                    className={inputClass}
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className={labelClass}>Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            {/* Flyer section */}
                            <div className="border border-white/5 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-300">Event Flyer</span>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={hostProvidesFlyer}
                                            onChange={(e) => setHostProvidesFlyer(e.target.checked)}
                                            className="w-4 h-4 accent-[#D0FF71]"
                                        />
                                        <span className="text-sm text-gray-400">Host provides their own flyer</span>
                                    </label>
                                </div>

                                {!hostProvidesFlyer ? (
                                    <div>
                                        {flyerPreview ? (
                                            <div>
                                                <img
                                                    src={flyerPreview}
                                                    alt="Flyer preview"
                                                    className="max-h-48 object-contain rounded-xl border border-white/10"
                                                />
                                                <button
                                                    onClick={() => flyerInputRef.current?.click()}
                                                    className="mt-2 text-xs text-[#D0FF71] hover:underline flex items-center gap-1"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    Replace flyer
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => flyerInputRef.current?.click()}
                                                className="w-full border-2 border-dashed border-white/10 hover:border-[#D0FF71]/30 rounded-xl p-8 flex flex-col items-center gap-2 transition-colors group"
                                            >
                                                <Upload className="w-6 h-6 text-gray-600 group-hover:text-[#D0FF71] transition-colors" />
                                                <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                                                    Click to upload event flyer
                                                </span>
                                                <span className="text-xs text-gray-600">PNG, JPG supported</span>
                                            </button>
                                        )}
                                        <input
                                            ref={flyerInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFlyerChange}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">
                                        The hosting organization will provide their own event flyer.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 shrink-0">
                            <button
                                onClick={onCancel}
                                disabled={isSubmitting || isApprovingWithout}
                                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleApproveWithout}
                                    disabled={isApprovingWithout || isSubmitting}
                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isApprovingWithout ? 'Approving...' : 'Approve Without EPK'}
                                </button>
                                <button
                                    onClick={handleGenerateAndApprove}
                                    disabled={isSubmitting || isApprovingWithout}
                                    className="px-5 py-2.5 bg-[#D0FF71] hover:bg-[#b5e55e] text-black text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Generating…
                                        </>
                                    ) : (
                                        'Generate EPK & Approve'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
