import { useAuth } from '@/context/AuthContext'
import { User, Briefcase, Brain, Zap, Target, BookOpen, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'

// Question metadata for rendering labels
const QUESTION_META: Record<string, { label: string; section: string; type: 'radio' | 'checkbox' | 'scale' | 'text' | 'matrix'; scaleLabels?: [string, string] }> = {
    role:                { label: 'Current Role', section: 'Role & Experience', type: 'radio' },
    experience_years:    { label: 'Years of Experience', section: 'Role & Experience', type: 'radio' },
    current_ai_usage:    { label: 'Current AI Usage', section: 'AI Usage', type: 'radio' },
    ai_tools_used:       { label: 'AI Tools Used', section: 'AI Usage', type: 'checkbox' },
    ai_confidence:       { label: 'AI Confidence', section: 'Skill Baseline', type: 'scale', scaleLabels: ['Not confident at all', 'Very confident'] },
    ai_skill_level:      { label: 'AI Skill Level', section: 'Skill Baseline', type: 'scale', scaleLabels: ['Beginner', 'Advanced'] },
    workflow_difficulties:{ label: 'Workflow Difficulties', section: 'Challenges', type: 'checkbox' },
    quality_confidence:  { label: 'Output Quality Confidence', section: 'Challenges', type: 'scale', scaleLabels: ['Not confident', 'Very confident'] },
    ai_concerns:         { label: 'AI Concerns', section: 'Concerns', type: 'checkbox' },
    learning_needs:      { label: 'Learning Needs', section: 'Learning', type: 'checkbox' },
    workflow_readiness:  { label: 'Workflow Readiness', section: 'Learning', type: 'scale', scaleLabels: ['Not ready', 'Fully ready'] },
    masterclass_goals:   { label: 'Sprint Workshop Goals', section: 'Expectations', type: 'checkbox' },
    success_definition:  { label: 'Success Definition', section: 'Expectations', type: 'text' },
    project_context:     { label: 'Project Context', section: 'Expectations', type: 'text' },
    // Management questions
    leadership_role:     { label: 'Leadership Role', section: 'Role & Studio', type: 'radio' },
    studio_focus:        { label: 'Studio Focus', section: 'Role & Studio', type: 'radio' },
    studio_ai_usage:     { label: 'Studio AI Usage', section: 'AI Adoption', type: 'radio' },
    ai_visibility:       { label: 'AI Visibility', section: 'AI Adoption', type: 'scale', scaleLabels: ['No visibility', 'Very clear visibility'] },
    ai_opportunities:    { label: 'AI Opportunities', section: 'Strategic Drivers', type: 'checkbox' },
    ai_risks:            { label: 'AI Risks', section: 'Strategic Drivers', type: 'checkbox' },
    brand_confidence:    { label: 'Brand Confidence', section: 'Quality & Brand', type: 'scale', scaleLabels: ['Not confident', 'Very confident'] },
    ai_guidance:         { label: 'AI Guidance', section: 'Quality & Brand', type: 'radio' },
    adoption_factor:     { label: 'Adoption Factor', section: 'Enablement', type: 'radio' },
    team_readiness:      { label: 'Team Readiness', section: 'Enablement', type: 'scale', scaleLabels: ['Not ready', 'Fully ready'] },
    business_impact:     { label: 'Business Impact', section: 'Business Impact', type: 'matrix' },
    leadership_objectives:{ label: 'Leadership Objectives', section: 'Masterclass Objectives', type: 'checkbox' },
    leadership_success:  { label: 'Success Definition', section: 'Masterclass Objectives', type: 'text' },
    work_type:           { label: 'Work Type', section: 'Projects', type: 'radio' },
    reference_value:     { label: 'Reference Value', section: 'Projects', type: 'checkbox' },
}

const SECTION_ICONS: Record<string, React.ElementType> = {
    'Role & Experience': User,
    'Role & Studio': User,
    'AI Usage': Zap,
    'AI Adoption': Zap,
    'Skill Baseline': Brain,
    'Challenges': AlertCircle,
    'Strategic Drivers': Target,
    'Concerns': AlertCircle,
    'Quality & Brand': CheckCircle2,
    'Learning': BookOpen,
    'Enablement': BookOpen,
    'Expectations': Target,
    'Masterclass Objectives': Target,
    'Business Impact': Briefcase,
    'Projects': Briefcase,
}

function ScaleBar({ value, labels }: { value: number; labels: [string, string] }) {
    const pct = ((value - 1) / 4) * 100
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full gradient-lime rounded-full shadow-[0_0_8px_rgba(208,255,113,0.4)] transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-lime font-black text-sm w-5 text-center">{value}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                <span>{labels[0]}</span>
                <span>{labels[1]}</span>
            </div>
        </div>
    )
}

function BadgePill({ text }: { text: string }) {
    return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold tracking-wide">
            {text}
        </span>
    )
}

export function SprintMemberProfilePage() {
    const { user } = useAuth()

    const onboardingData = (user?.onboarding_data as Record<string, any> | null)
    const basicInfo = onboardingData?.basic_info as Record<string, string> | undefined
    const surveyAnswers = onboardingData?.survey_answers as Record<string, any> | undefined
    const otherSpecs = onboardingData?.other_specifications as Record<string, string> | undefined
    const completedAt = onboardingData?.completed_at as string | undefined

    const hasOnboarding = !!surveyAnswers && Object.keys(surveyAnswers).length > 0

    // Group answered questions by section
    const sections: Record<string, Array<{ id: string; meta: typeof QUESTION_META[string]; answer: any }>> = {}
    if (surveyAnswers) {
        for (const [id, answer] of Object.entries(surveyAnswers)) {
            const meta = QUESTION_META[id]
            if (!meta) continue
            if (!sections[meta.section]) sections[meta.section] = []
            sections[meta.section].push({ id, meta, answer })
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Profile</h1>
                    <p className="text-gray-400 text-sm mt-1">Your onboarding survey responses and AI readiness overview</p>
                </div>
                <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-card hover:border-lime/30 transition text-sm text-gray-300 hover:text-white"
                >
                    <Edit3 className="h-4 w-4" />
                    Account Settings
                </Link>
            </div>

            {/* Identity Card */}
            <div className="rounded-2xl border border-border bg-bg-card p-6 flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl gradient-lime flex items-center justify-center shrink-0">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                        <span className="text-3xl font-black text-black">
                            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white truncate">{user?.full_name || 'Member'}</h2>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime text-xs font-bold uppercase tracking-wide">
                            {user?.user_type === 'sprint_member'
                                ? 'Sprint Member'
                                : user?.user_type === 'webinar_member'
                                    ? 'Webinar Member'
                                    : user?.user_type === 'management'
                                        ? 'Management Member'
                                        : 'Team Member'}
                        </span>
                        {basicInfo?.nationality && (
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-border text-gray-300 text-xs font-medium">
                                {basicInfo.nationality}
                            </span>
                        )}
                        {basicInfo?.age && (
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-border text-gray-300 text-xs font-medium">
                                Age {basicInfo.age}
                            </span>
                        )}
                    </div>
                </div>
                {hasOnboarding && completedAt && (
                    <div className="shrink-0 text-right hidden md:block">
                        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Onboarding Completed</p>
                        <p className="text-sm text-gray-300 font-medium mt-1">
                            {new Date(completedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                )}
            </div>

            {/* Not completed yet */}
            {!hasOnboarding && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                    <div>
                        <p className="font-bold text-white text-lg">Onboarding Survey Not Completed</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Complete the onboarding survey to see your AI readiness profile here.
                        </p>
                    </div>
                    <Link
                        to={user?.user_type === 'sprint_member' || user?.user_type === 'webinar_member' ? '/onboarding/sprint-workshop' : '/onboarding'}
                        className="inline-flex items-center gap-2 px-6 py-3 gradient-lime text-black font-black uppercase tracking-widest text-sm rounded-xl hover:opacity-90 transition"
                    >
                        Start Onboarding
                    </Link>
                </div>
            )}

            {/* Survey Sections */}
            {hasOnboarding && Object.entries(sections).map(([sectionName, items]) => {
                const Icon = SECTION_ICONS[sectionName] || User
                return (
                    <div key={sectionName} className="rounded-2xl border border-border bg-bg-card overflow-hidden">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-white/[0.02]">
                            <div className="h-8 w-8 rounded-xl bg-lime/10 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-lime" />
                            </div>
                            <h3 className="font-heading text-lg font-bold text-white">{sectionName}</h3>
                        </div>

                        {/* Questions */}
                        <div className="divide-y divide-border">
                            {items.map(({ id, meta, answer }) => (
                                <div key={id} className="px-6 py-5 space-y-3">
                                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">{meta.label}</p>

                                    {/* Radio / text answer */}
                                    {(meta.type === 'radio' || meta.type === 'text') && (
                                        <div className="space-y-1">
                                            <p className="text-white font-medium">{answer}</p>
                                            {otherSpecs?.[id] && (
                                                <p className="text-gray-400 text-sm italic pl-3 border-l-2 border-lime/30">
                                                    "{otherSpecs[id]}"
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Checkbox — badge pills */}
                                    {meta.type === 'checkbox' && Array.isArray(answer) && (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {(answer as string[]).map(v => (
                                                    <BadgePill key={v} text={v} />
                                                ))}
                                            </div>
                                            {otherSpecs?.[id] && (
                                                <p className="text-gray-400 text-sm italic pl-3 border-l-2 border-lime/30">
                                                    Other: "{otherSpecs[id]}"
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Scale — visual bar */}
                                    {meta.type === 'scale' && typeof answer === 'number' && meta.scaleLabels && (
                                        <ScaleBar value={answer} labels={meta.scaleLabels} />
                                    )}

                                    {/* Matrix */}
                                    {meta.type === 'matrix' && typeof answer === 'object' && !Array.isArray(answer) && (
                                        <div className="space-y-3">
                                            {Object.entries(answer as Record<string, number>).map(([item, val]) => (
                                                <div key={item} className="flex items-center gap-4">
                                                    <span className="text-xs text-gray-400 w-36 shrink-0">{item}</span>
                                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full gradient-lime rounded-full"
                                                            style={{ width: `${((val - 1) / 4) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-lime text-xs font-black w-4 text-center">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
