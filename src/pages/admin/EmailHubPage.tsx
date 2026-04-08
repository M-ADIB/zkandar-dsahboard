import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { useAuth } from '@/context/AuthContext'
import { buildCampaignEmail } from '@/lib/buildCampaignEmail'
import type {
    EmailBlock,
    EmailTemplate,
    EmailCampaign,
    EmailCampaignRecipient,
} from '@/types/database'
import {
    Mail,
    Send,
    Clock,
    History,
    FileText,
    Trash2,
    ChevronUp,
    ChevronDown,
    X,
    Type,
    AlignLeft,
    List,
    ImageIcon,
    Minus,
    MoveVertical,
    MousePointerClick,
    Eye,
    Calendar,
    CheckCircle,
    AlertCircle,
    XCircle,
    Copy,
    Loader2,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid(): string {
    return crypto.randomUUID()
}

function defaultBlock(type: EmailBlock['type']): EmailBlock {
    switch (type) {
        case 'heading':
            return { id: uid(), type: 'heading', text: 'Your Heading' }
        case 'paragraph':
            return { id: uid(), type: 'paragraph', text: 'Write your message here...' }
        case 'bullet_list':
            return { id: uid(), type: 'bullet_list', items: ['Item 1', 'Item 2'] }
        case 'image':
            return { id: uid(), type: 'image', url: '', alt: '' }
        case 'divider':
            return { id: uid(), type: 'divider' }
        case 'spacer':
            return { id: uid(), type: 'spacer', height: 24 }
        case 'button':
            return { id: uid(), type: 'button', label: 'Click Here', url: 'https://' }
    }
}

type AudienceKey = 'all_members' | 'leads' | 'hot_leads' | 'active_leads' | 'lava_leads' | 'executives' | 'custom'

const AUDIENCE_OPTIONS: { key: AudienceKey; label: string; description: string }[] = [
    { key: 'all_members', label: 'All Members', description: 'Participants & executives' },
    { key: 'leads', label: 'All Leads', description: 'Leads with email addresses' },
    { key: 'hot_leads', label: 'Hot Leads', description: 'Priority = HOT' },
    { key: 'active_leads', label: 'Active Leads', description: 'Priority = ACTIVE' },
    { key: 'lava_leads', label: 'Lava Leads', description: 'Priority = LAVA' },
    { key: 'executives', label: 'Executives', description: 'Company executives' },
    { key: 'custom', label: 'Custom Emails', description: 'Paste email addresses' },
]

type TabKey = 'compose' | 'templates' | 'history' | 'scheduled'

// ── Main Component ────────────────────────────────────────────────────────────
export function EmailHubPage() {
    const supabase = useSupabase()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<TabKey>('compose')

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 4000)
    }, [])

    // ── Shared state ──────────────────────────────────────────────────────────
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(true)
    const [loadingCampaigns, setLoadingCampaigns] = useState(true)

    // ── Compose state ─────────────────────────────────────────────────────────
    const [subject, setSubject] = useState('')
    const [headline, setHeadline] = useState('')
    const [blocks, setBlocks] = useState<EmailBlock[]>([defaultBlock('paragraph')])
    const [ctaText, setCtaText] = useState('')
    const [ctaUrl, setCtaUrl] = useState('')
    const [audiences, setAudiences] = useState<Set<AudienceKey>>(new Set())
    const [customEmails, setCustomEmails] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleTime, setScheduleTime] = useState('')
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
    const [templateName, setTemplateName] = useState('')

    // ── Fetch data ────────────────────────────────────────────────────────────
    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true)
        const { data } = await supabase
            .from('email_templates')
            .select('*')
            .order('created_at', { ascending: false })
        setTemplates((data as EmailTemplate[]) || [])
        setLoadingTemplates(false)
    }, [supabase])

    const fetchCampaigns = useCallback(async () => {
        setLoadingCampaigns(true)
        const { data } = await supabase
            .from('email_campaigns')
            .select('*')
            .order('created_at', { ascending: false })
        setCampaigns((data as EmailCampaign[]) || [])
        setLoadingCampaigns(false)
    }, [supabase])

    useEffect(() => {
        fetchTemplates()
        fetchCampaigns()
    }, [fetchTemplates, fetchCampaigns])

    // ── Audience resolution ───────────────────────────────────────────────────
    const resolveRecipients = useCallback(async (): Promise<{ email: string; name: string }[]> => {
        const recipients = new Map<string, string>()

        if (audiences.has('all_members') || audiences.has('executives')) {
            const roles = audiences.has('all_members')
                ? ['participant', 'executive']
                : ['executive']
            const { data } = await supabase
                .from('users')
                .select('email, full_name')
                .in('role', roles)
            data?.forEach((u: any) => {
                if (u.email) recipients.set(u.email.toLowerCase(), u.full_name || '')
            })
        }

        if (audiences.has('leads') || audiences.has('hot_leads') || audiences.has('active_leads') || audiences.has('lava_leads')) {
            let query = supabase.from('leads').select('email, full_name').not('email', 'is', null)
            if (audiences.has('hot_leads') && !audiences.has('leads')) {
                query = query.eq('priority', 'HOT') as any
            } else if (audiences.has('active_leads') && !audiences.has('leads')) {
                query = query.eq('priority', 'ACTIVE') as any
            } else if (audiences.has('lava_leads') && !audiences.has('leads')) {
                query = query.eq('priority', 'LAVA') as any
            }
            // If multiple lead filters or 'leads' is selected, combine
            if (audiences.has('leads')) {
                // all leads — no filter needed
            } else {
                const priorities: string[] = []
                if (audiences.has('hot_leads')) priorities.push('HOT')
                if (audiences.has('active_leads')) priorities.push('ACTIVE')
                if (audiences.has('lava_leads')) priorities.push('LAVA')
                if (priorities.length > 1) {
                    query = supabase.from('leads').select('email, full_name').not('email', 'is', null).in('priority', priorities) as any
                }
            }
            const { data } = await query
            data?.forEach((l: any) => {
                if (l.email) recipients.set(l.email.toLowerCase(), l.full_name || '')
            })
        }

        if (audiences.has('custom') && customEmails.trim()) {
            const emails = customEmails.split(/[,\n;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))
            emails.forEach(e => {
                if (!recipients.has(e)) recipients.set(e, '')
            })
        }

        return Array.from(recipients.entries()).map(([email, name]) => ({ email, name }))
    }, [supabase, audiences, customEmails])

    // ── Preview HTML ──────────────────────────────────────────────────────────
    const previewHtml = useMemo(() => {
        return buildCampaignEmail({
            subject,
            headline: headline || null,
            blocks,
            ctaText: ctaText || null,
            ctaUrl: ctaUrl || null,
        }, 'John')
    }, [subject, headline, blocks, ctaText, ctaUrl])

    // ── Block operations ──────────────────────────────────────────────────────
    const addBlock = (type: EmailBlock['type']) => {
        setBlocks(prev => [...prev, defaultBlock(type)])
    }

    const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } as EmailBlock : b))
    }

    const removeBlock = (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id))
    }

    const moveBlock = (id: string, direction: 'up' | 'down') => {
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === id)
            if (idx < 0) return prev
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1
            if (swapIdx < 0 || swapIdx >= prev.length) return prev
            const arr = [...prev]
            ;[arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]]
            return arr
        })
    }

    const toggleAudience = (key: AudienceKey) => {
        setAudiences(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // ── Send Now ──────────────────────────────────────────────────────────────
    const handleSendNow = async () => {
        if (!subject.trim()) { showToast('Subject is required', 'error'); return }
        if (audiences.size === 0) { showToast('Select at least one audience', 'error'); return }
        if (blocks.length === 0) { showToast('Add at least one content block', 'error'); return }

        setIsSending(true)
        try {
            const recipients = await resolveRecipients()
            if (recipients.length === 0) { showToast('No recipients found', 'error'); setIsSending(false); return }

            const htmlPreview = buildCampaignEmail({ subject, headline: headline || null, blocks, ctaText: ctaText || null, ctaUrl: ctaUrl || null }, 'Preview')
            const audienceLabel = Array.from(audiences).join(', ')

            // Create campaign
            const { data: campaign, error: campErr } = await (supabase
                .from('email_campaigns') as any)
                .insert({
                    subject,
                    headline: headline || null,
                    body: JSON.stringify(blocks),
                    html_preview: htmlPreview,
                    audience: audienceLabel,
                    recipient_count: recipients.length,
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    created_by: user?.id || null,
                })
                .select()
                .single()
            if (campErr || !campaign) throw new Error(campErr?.message || 'Failed to create campaign')

            // Insert recipients
            const recipientRows = recipients.map(r => ({
                campaign_id: campaign.id,
                email: r.email,
                name: r.name || null,
                status: 'queued' as const,
            }))
            await (supabase.from('email_campaign_recipients') as any).insert(recipientRows)

            // Insert queue rows
            const queueRows = recipients.map(r => ({
                campaign_id: campaign.id,
                recipient_email: r.email,
                recipient_name: r.name || null,
                subject,
                html_body: buildCampaignEmail({ subject, headline: headline || null, blocks, ctaText: ctaText || null, ctaUrl: ctaUrl || null }, r.name?.split(' ')[0] || ''),
                status: 'pending' as const,
                attempts: 0,
                send_after: null,
            }))
            await (supabase.from('email_queue') as any).insert(queueRows)

            // Call edge function
            await supabase.functions.invoke('send-campaign-email', {
                body: { campaign_id: campaign.id },
            })

            showToast(`Sending to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}...`)
            resetCompose()
            fetchCampaigns()
        } catch (err: any) {
            showToast(err.message || 'Failed to send', 'error')
        } finally {
            setIsSending(false)
        }
    }

    // ── Schedule ──────────────────────────────────────────────────────────────
    const handleSchedule = async () => {
        if (!subject.trim() || !scheduleDate || !scheduleTime) return
        if (audiences.size === 0) { showToast('Select at least one audience', 'error'); return }

        setIsScheduling(true)
        try {
            const recipients = await resolveRecipients()
            if (recipients.length === 0) { showToast('No recipients found', 'error'); setIsScheduling(false); return }

            const sendAfter = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
            const htmlPreview = buildCampaignEmail({ subject, headline: headline || null, blocks, ctaText: ctaText || null, ctaUrl: ctaUrl || null }, 'Preview')
            const audienceLabel = Array.from(audiences).join(', ')

            const { data: campaign, error: campErr } = await (supabase
                .from('email_campaigns') as any)
                .insert({
                    subject,
                    headline: headline || null,
                    body: JSON.stringify(blocks),
                    html_preview: htmlPreview,
                    audience: audienceLabel,
                    recipient_count: recipients.length,
                    status: 'scheduled',
                    scheduled_for: sendAfter,
                    created_by: user?.id || null,
                })
                .select()
                .single()
            if (campErr || !campaign) throw new Error(campErr?.message || 'Failed to create campaign')

            const recipientRows = recipients.map(r => ({
                campaign_id: campaign.id,
                email: r.email,
                name: r.name || null,
                status: 'queued' as const,
            }))
            await (supabase.from('email_campaign_recipients') as any).insert(recipientRows)

            const queueRows = recipients.map(r => ({
                campaign_id: campaign.id,
                recipient_email: r.email,
                recipient_name: r.name || null,
                subject,
                html_body: buildCampaignEmail({ subject, headline: headline || null, blocks, ctaText: ctaText || null, ctaUrl: ctaUrl || null }, r.name?.split(' ')[0] || ''),
                status: 'pending' as const,
                attempts: 0,
                send_after: sendAfter,
            }))
            await (supabase.from('email_queue') as any).insert(queueRows)

            showToast(`Scheduled for ${recipients.length} recipients`)
            setShowScheduleModal(false)
            resetCompose()
            fetchCampaigns()
        } catch (err: any) {
            showToast(err.message || 'Failed to schedule', 'error')
        } finally {
            setIsScheduling(false)
        }
    }

    // ── Save Template ─────────────────────────────────────────────────────────
    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !subject.trim()) return
        const { error } = await (supabase.from('email_templates') as any).insert({
            name: templateName,
            subject,
            headline: headline || null,
            body: JSON.stringify(blocks),
            blocks: blocks as any,
            cta_text: ctaText || null,
            cta_url: ctaUrl || null,
            created_by: user?.id || null,
        })
        if (error) { showToast('Failed to save template', 'error'); return }
        showToast('Template saved')
        setShowSaveTemplateModal(false)
        setTemplateName('')
        fetchTemplates()
    }

    // ── Load Template into Compose ────────────────────────────────────────────
    const loadTemplate = (tpl: EmailTemplate) => {
        setSubject(tpl.subject)
        setHeadline(tpl.headline || '')
        setBlocks(tpl.blocks && tpl.blocks.length > 0 ? tpl.blocks : [defaultBlock('paragraph')])
        setCtaText(tpl.cta_text || '')
        setCtaUrl(tpl.cta_url || '')
        setActiveTab('compose')
        showToast('Template loaded into composer')
    }

    // ── Delete Template ───────────────────────────────────────────────────────
    const deleteTemplate = async (id: string) => {
        await supabase.from('email_templates').delete().eq('id', id)
        setTemplates(prev => prev.filter(t => t.id !== id))
        showToast('Template deleted')
    }

    // ── Cancel Scheduled ──────────────────────────────────────────────────────
    const cancelScheduled = async (campaignId: string) => {
        await (supabase.from('email_campaigns') as any).update({ status: 'cancelled' }).eq('id', campaignId)
        await (supabase.from('email_queue') as any).update({ status: 'skipped' }).eq('campaign_id', campaignId).eq('status', 'pending')
        fetchCampaigns()
        showToast('Campaign cancelled')
    }

    const resetCompose = () => {
        setSubject('')
        setHeadline('')
        setBlocks([defaultBlock('paragraph')])
        setCtaText('')
        setCtaUrl('')
        setAudiences(new Set())
        setCustomEmails('')
        setScheduleDate('')
        setScheduleTime('')
    }

    // ── Tab configs ───────────────────────────────────────────────────────────
    const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
        { key: 'compose', label: 'Compose', icon: Send },
        { key: 'templates', label: 'Templates', icon: FileText },
        { key: 'history', label: 'History', icon: History },
        { key: 'scheduled', label: 'Scheduled', icon: Clock },
    ]

    const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled')
    const historyCampaigns = campaigns.filter(c => c.status !== 'scheduled' || (c.scheduled_for && new Date(c.scheduled_for) <= new Date()))

    return (
        <div className="space-y-6 max-w-full min-w-0">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 border rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                    toast.type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-bg-elevated border-lime/30'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="h-5 w-5 text-red-400 shrink-0" /> : <CheckCircle className="h-5 w-5 text-lime shrink-0" />}
                    <span className="text-sm font-medium text-white">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-lime/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-lime" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Email Hub</h1>
                        <p className="text-sm text-gray-500">Compose, schedule, and track campaigns</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key
                    const count = tab.key === 'scheduled' ? scheduledCampaigns.length : tab.key === 'history' ? historyCampaigns.length : tab.key === 'templates' ? templates.length : undefined
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-lime/10 text-lime border border-lime/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                            {count !== undefined && count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-lime/20 text-lime' : 'bg-white/10 text-gray-500'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'compose' && (
                <ComposeTab
                    subject={subject} setSubject={setSubject}
                    headline={headline} setHeadline={setHeadline}
                    blocks={blocks} addBlock={addBlock} updateBlock={updateBlock} removeBlock={removeBlock} moveBlock={moveBlock}
                    ctaText={ctaText} setCtaText={setCtaText}
                    ctaUrl={ctaUrl} setCtaUrl={setCtaUrl}
                    audiences={audiences} toggleAudience={toggleAudience}
                    customEmails={customEmails} setCustomEmails={setCustomEmails}
                    previewHtml={previewHtml}
                    onSendNow={handleSendNow} isSending={isSending}
                    onScheduleClick={() => setShowScheduleModal(true)}
                    onSaveTemplate={() => setShowSaveTemplateModal(true)}
                />
            )}

            {activeTab === 'templates' && (
                <TemplatesTab
                    templates={templates}
                    loading={loadingTemplates}
                    onUse={loadTemplate}
                    onDelete={deleteTemplate}
                />
            )}

            {activeTab === 'history' && (
                <HistoryTab campaigns={historyCampaigns} loading={loadingCampaigns} supabase={supabase} />
            )}

            {activeTab === 'scheduled' && (
                <ScheduledTab campaigns={scheduledCampaigns} loading={loadingCampaigns} onCancel={cancelScheduled} />
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <Modal onClose={() => setShowScheduleModal(false)} title="Schedule Email">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Date</label>
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-lg text-sm text-white focus:outline-none focus:border-lime/40"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Time</label>
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={e => setScheduleTime(e.target.value)}
                                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-lg text-sm text-white focus:outline-none focus:border-lime/40"
                            />
                        </div>
                        <button
                            onClick={handleSchedule}
                            disabled={isScheduling || !scheduleDate || !scheduleTime}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 gradient-lime text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                            {isScheduling ? 'Scheduling...' : 'Schedule Campaign'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Save Template Modal */}
            {showSaveTemplateModal && (
                <Modal onClose={() => setShowSaveTemplateModal(false)} title="Save as Template">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Template Name</label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={e => setTemplateName(e.target.value)}
                                placeholder="e.g. Monthly Newsletter"
                                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40"
                            />
                        </div>
                        <button
                            onClick={handleSaveTemplate}
                            disabled={!templateName.trim() || !subject.trim()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 gradient-lime text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                            <FileText className="h-4 w-4" />
                            Save Template
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPOSE TAB
// ══════════════════════════════════════════════════════════════════════════════
interface ComposeProps {
    subject: string; setSubject: (v: string) => void
    headline: string; setHeadline: (v: string) => void
    blocks: EmailBlock[]
    addBlock: (type: EmailBlock['type']) => void
    updateBlock: (id: string, updates: Partial<EmailBlock>) => void
    removeBlock: (id: string) => void
    moveBlock: (id: string, direction: 'up' | 'down') => void
    ctaText: string; setCtaText: (v: string) => void
    ctaUrl: string; setCtaUrl: (v: string) => void
    audiences: Set<AudienceKey>; toggleAudience: (k: AudienceKey) => void
    customEmails: string; setCustomEmails: (v: string) => void
    previewHtml: string
    onSendNow: () => void; isSending: boolean
    onScheduleClick: () => void
    onSaveTemplate: () => void
}

function ComposeTab(props: ComposeProps) {
    const {
        subject, setSubject, headline, setHeadline,
        blocks, addBlock, updateBlock, removeBlock, moveBlock,
        ctaText, setCtaText, ctaUrl, setCtaUrl,
        audiences, toggleAudience, customEmails, setCustomEmails,
        previewHtml, onSendNow, isSending, onScheduleClick, onSaveTemplate,
    } = props

    const blockPalette: { type: EmailBlock['type']; icon: React.ElementType; label: string }[] = [
        { type: 'heading', icon: Type, label: 'Heading' },
        { type: 'paragraph', icon: AlignLeft, label: 'Text' },
        { type: 'bullet_list', icon: List, label: 'List' },
        { type: 'image', icon: ImageIcon, label: 'Image' },
        { type: 'button', icon: MousePointerClick, label: 'Button' },
        { type: 'divider', icon: Minus, label: 'Line' },
        { type: 'spacer', icon: MoveVertical, label: 'Space' },
    ]

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Builder */}
            <div className="space-y-5">
                {/* Subject & Headline */}
                <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Subject *</label>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Your email subject line"
                            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Headline <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                        <input
                            value={headline}
                            onChange={e => setHeadline(e.target.value)}
                            placeholder="Optional heading above the body"
                            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                        />
                    </div>
                </div>

                {/* Block palette */}
                <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Content Block</p>
                    <div className="flex flex-wrap gap-2">
                        {blockPalette.map(item => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.type}
                                    onClick={() => addBlock(item.type)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-gray-300 hover:text-white hover:border-lime/30 hover:bg-lime/5 transition-all duration-200"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Block list */}
                <div className="space-y-3">
                    {blocks.length === 0 && (
                        <div className="rounded-[20px] border border-dashed border-white/[0.08] bg-white/[0.01] py-12 text-center">
                            <AlignLeft className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No content blocks yet. Add one above.</p>
                        </div>
                    )}
                    {blocks.map((block, idx) => (
                        <BlockEditor
                            key={block.id}
                            block={block}
                            index={idx}
                            total={blocks.length}
                            onUpdate={(updates) => updateBlock(block.id, updates)}
                            onRemove={() => removeBlock(block.id)}
                            onMove={(dir) => moveBlock(block.id, dir)}
                        />
                    ))}
                </div>

                {/* CTA */}
                <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Global CTA Button <span className="text-gray-600 normal-case font-normal">(optional)</span></p>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            value={ctaText}
                            onChange={e => setCtaText(e.target.value)}
                            placeholder="Button text"
                            className="px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                        />
                        <input
                            value={ctaUrl}
                            onChange={e => setCtaUrl(e.target.value)}
                            placeholder="https://..."
                            className="px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition"
                        />
                    </div>
                </div>

                {/* Audience */}
                <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Audience *</p>
                    <div className="grid grid-cols-2 gap-2">
                        {AUDIENCE_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => toggleAudience(opt.key)}
                                className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                                    audiences.has(opt.key)
                                        ? 'bg-lime/10 border-lime/30 text-white'
                                        : 'bg-bg-elevated border-border text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                <p className="text-sm font-medium">{opt.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{opt.description}</p>
                            </button>
                        ))}
                    </div>
                    {audiences.has('custom') && (
                        <textarea
                            value={customEmails}
                            onChange={e => setCustomEmails(e.target.value)}
                            placeholder="Paste emails separated by commas or new lines..."
                            rows={3}
                            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 transition resize-none"
                        />
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={onSendNow}
                        disabled={isSending}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 gradient-lime text-black font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {isSending ? 'Sending...' : 'Send Now'}
                    </button>
                    <button
                        onClick={onScheduleClick}
                        className="flex items-center gap-2 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white font-medium rounded-xl hover:bg-white/[0.08] transition"
                    >
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Schedule
                    </button>
                    <button
                        onClick={onSaveTemplate}
                        className="flex items-center gap-2 px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] text-white font-medium rounded-xl hover:bg-white/[0.08] transition"
                    >
                        <Copy className="h-4 w-4 text-gray-400" />
                        Save Template
                    </button>
                </div>
            </div>

            {/* Right: Preview */}
            <div className="hidden xl:block sticky top-6">
                <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Preview</span>
                    </div>
                    <div className="p-4">
                        <iframe
                            srcDoc={previewHtml}
                            className="w-full bg-white rounded-lg"
                            style={{ height: '600px', border: 'none' }}
                            sandbox="allow-same-origin"
                            title="Email Preview"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
//  BLOCK EDITOR
// ══════════════════════════════════════════════════════════════════════════════
interface BlockEditorProps {
    block: EmailBlock
    index: number
    total: number
    onUpdate: (updates: Partial<EmailBlock>) => void
    onRemove: () => void
    onMove: (dir: 'up' | 'down') => void
}

function BlockEditor({ block, index, total, onUpdate, onRemove, onMove }: BlockEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const wrapSelection = (tag: string) => {
        const el = textareaRef.current
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        const selected = el.value.substring(start, end)
        if (!selected) return

        let wrapped: string
        if (tag === 'a') {
            const url = prompt('Enter URL:')
            if (!url) return
            wrapped = `<a href="${url}" style="color:#D0FF71;text-decoration:underline;">${selected}</a>`
        } else {
            wrapped = `<${tag}>${selected}</${tag}>`
        }

        const newText = el.value.substring(0, start) + wrapped + el.value.substring(end)
        onUpdate({ text: newText } as any)
    }

    const typeLabel = {
        heading: 'Heading',
        paragraph: 'Text',
        bullet_list: 'List',
        image: 'Image',
        divider: 'Divider',
        spacer: 'Spacer',
        button: 'Button',
    }[block.type]

    return (
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] overflow-hidden group">
            {/* Block header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.04]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{typeLabel}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white disabled:opacity-30 transition">
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white disabled:opacity-30 transition">
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Block body */}
            <div className="p-4">
                {block.type === 'heading' && (
                    <input
                        value={block.text}
                        onChange={e => onUpdate({ text: e.target.value })}
                        placeholder="Heading text"
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-lime/40"
                    />
                )}

                {block.type === 'paragraph' && (
                    <div className="space-y-2">
                        <div className="flex gap-1">
                            <button onClick={() => wrapSelection('strong')} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 font-bold transition" title="Bold">B</button>
                            <button onClick={() => wrapSelection('em')} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 italic transition" title="Italic">I</button>
                            <button onClick={() => wrapSelection('a')} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition" title="Link">🔗</button>
                            <span className="text-[10px] text-gray-600 self-center ml-2">Select text, then click format</span>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={block.text}
                            onChange={e => onUpdate({ text: e.target.value })}
                            placeholder="Write your text..."
                            rows={3}
                            className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 resize-none"
                        />
                        <p className="text-[10px] text-gray-600">Use {'{{name}}'} to personalize with recipient's name</p>
                    </div>
                )}

                {block.type === 'bullet_list' && (
                    <textarea
                        value={block.items.join('\n')}
                        onChange={e => onUpdate({ items: e.target.value.split('\n') } as any)}
                        placeholder="One item per line"
                        rows={4}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40 resize-none"
                    />
                )}

                {block.type === 'image' && (
                    <div className="space-y-2">
                        <input
                            value={block.url}
                            onChange={e => onUpdate({ url: e.target.value })}
                            placeholder="Image URL (https://...)"
                            className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40"
                        />
                        {block.url && (
                            <img src={block.url} alt="preview" className="max-h-32 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        )}
                    </div>
                )}

                {block.type === 'button' && (
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            value={block.label}
                            onChange={e => onUpdate({ label: e.target.value })}
                            placeholder="Button label"
                            className="px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40"
                        />
                        <input
                            value={block.url}
                            onChange={e => onUpdate({ url: e.target.value })}
                            placeholder="https://..."
                            className="px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lime/40"
                        />
                    </div>
                )}

                {block.type === 'spacer' && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Height: {block.height}px</span>
                        <input
                            type="range"
                            min={8}
                            max={64}
                            value={block.height}
                            onChange={e => onUpdate({ height: Number(e.target.value) } as any)}
                            className="flex-1 accent-lime-400"
                        />
                    </div>
                )}

                {block.type === 'divider' && (
                    <div className="border-t border-white/10 my-2" />
                )}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
//  TEMPLATES TAB
// ══════════════════════════════════════════════════════════════════════════════
function TemplatesTab({ templates, loading, onUse, onDelete }: {
    templates: EmailTemplate[]
    loading: boolean
    onUse: (t: EmailTemplate) => void
    onDelete: (id: string) => void
}) {
    if (loading) return <LoadingSpinner />

    if (templates.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="No templates yet"
                description="Save your first template from the Compose tab to reuse it later."
            />
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
                <div key={tpl.id} className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 space-y-3 hover:border-white/[0.12] transition-colors">
                    <div>
                        <h3 className="text-sm font-bold text-white truncate">{tpl.name}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{tpl.subject}</p>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {tpl.blocks?.[0]?.type === 'paragraph'
                            ? (tpl.blocks[0] as any).text?.replace(/<[^>]*>/g, '').slice(0, 100)
                            : tpl.blocks?.[0]?.type === 'heading'
                                ? (tpl.blocks[0] as any).text?.slice(0, 100)
                                : `${tpl.blocks?.length || 0} blocks`}
                    </p>
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => onUse(tpl)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-lime/10 text-lime text-xs font-semibold rounded-lg hover:bg-lime/20 transition"
                        >
                            <Send className="h-3 w-3" /> Use
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Delete this template?')) onDelete(tpl.id)
                            }}
                            className="flex items-center justify-center px-3 py-2 bg-red-500/5 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/10 transition"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
//  HISTORY TAB
// ══════════════════════════════════════════════════════════════════════════════
function HistoryTab({ campaigns, loading, supabase }: {
    campaigns: EmailCampaign[]
    loading: boolean
    supabase: any
}) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [recipients, setRecipients] = useState<EmailCampaignRecipient[]>([])
    const [loadingRecipients, setLoadingRecipients] = useState(false)

    const loadRecipients = async (campaignId: string) => {
        setLoadingRecipients(true)
        const { data } = await supabase
            .from('email_campaign_recipients')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true })
        setRecipients((data as EmailCampaignRecipient[]) || [])
        setLoadingRecipients(false)
    }

    const toggleExpand = (c: EmailCampaign) => {
        if (expandedId === c.id) {
            setExpandedId(null)
            setPreviewHtml(null)
            return
        }
        setExpandedId(c.id)
        setPreviewHtml(c.html_preview || null)
        loadRecipients(c.id)
    }

    if (loading) return <LoadingSpinner />

    if (campaigns.length === 0) {
        return (
            <EmptyState
                icon={History}
                title="No emails sent yet"
                description="Your sent and completed campaigns will appear here."
            />
        )
    }

    return (
        <div className="space-y-3">
            {campaigns.map(c => (
                <div key={c.id} className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    {/* Summary row */}
                    <button
                        onClick={() => toggleExpand(c)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white truncate">{c.subject}</h3>
                                <StatusBadge status={c.status} />
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">{c.audience}</span>
                                <span className="text-xs text-gray-600">{c.recipient_count} recipients</span>
                                <span className="text-xs text-gray-600">
                                    {new Date(c.sent_at || c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded content */}
                    {expandedId === c.id && (
                        <div className="border-t border-white/[0.06] p-5 space-y-4">
                            {/* HTML Preview */}
                            {previewHtml ? (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Preview</p>
                                    <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full bg-white rounded-lg"
                                            style={{ height: '500px', border: 'none' }}
                                            sandbox="allow-same-origin"
                                            title="Email Preview"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">No HTML preview available for this campaign.</p>
                            )}

                            {/* Recipients */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recipients</p>
                                {loadingRecipients ? (
                                    <LoadingSpinner />
                                ) : (
                                    <div className="max-h-60 overflow-y-auto rounded-xl border border-white/[0.06]">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-[10px] text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                                                    <th className="px-4 py-2">Email</th>
                                                    <th className="px-4 py-2">Name</th>
                                                    <th className="px-4 py-2 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recipients.map(r => (
                                                    <tr key={r.id} className="border-t border-white/[0.04]">
                                                        <td className="px-4 py-2 text-gray-300 text-xs truncate max-w-[200px]">{r.email}</td>
                                                        <td className="px-4 py-2 text-gray-400 text-xs truncate max-w-[120px]">{r.name || '-'}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <RecipientBadge status={r.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
//  SCHEDULED TAB
// ══════════════════════════════════════════════════════════════════════════════
function ScheduledTab({ campaigns, loading, onCancel }: {
    campaigns: EmailCampaign[]
    loading: boolean
    onCancel: (id: string) => void
}) {
    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-4">
            {/* Info banner */}
            <div className="rounded-[16px] border border-lime/10 bg-lime/5 px-5 py-3 flex items-center gap-3">
                <Clock className="h-4 w-4 text-lime shrink-0" />
                <p className="text-xs text-gray-300">
                    Scheduled emails send automatically within 5 minutes of their scheduled time via the database scheduler.
                </p>
            </div>

            {campaigns.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="No scheduled campaigns"
                    description="Schedule an email from the Compose tab and it will appear here."
                />
            ) : (
                campaigns.map(c => (
                    <div key={c.id} className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-white truncate">{c.subject}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">{c.audience}</span>
                                <span className="text-xs text-gray-600">{c.recipient_count} recipients</span>
                                <span className="text-xs text-lime font-medium">
                                    {c.scheduled_for && new Date(c.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('Cancel this scheduled campaign?')) onCancel(c.id)
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/10 transition ml-4 shrink-0"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                        </button>
                    </div>
                ))
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
//  SHARED UI
// ══════════════════════════════════════════════════════════════════════════════
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    }
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status] || styles.cancelled}`}>
            {status}
        </span>
    )
}

function RecipientBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ElementType }> = {
        sent: { color: 'text-emerald-400', icon: CheckCircle },
        queued: { color: 'text-amber-400', icon: Clock },
        failed: { color: 'text-red-400', icon: AlertCircle },
        skipped: { color: 'text-gray-500', icon: Minus },
    }
    const cfg = map[status] || map.skipped
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {status}
        </span>
    )
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-lime/50 border-t-transparent animate-spin" />
        </div>
    )
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="rounded-[20px] border border-dashed border-white/[0.08] bg-white/[0.01] py-16 text-center">
            <Icon className="h-10 w-10 text-gray-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-500 max-w-[280px] mx-auto">{description}</p>
        </div>
    )
}
