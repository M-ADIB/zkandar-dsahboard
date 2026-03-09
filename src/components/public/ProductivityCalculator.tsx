import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Check } from 'lucide-react'

// ─── Constants & Types ────────────────────────────────────────────────────────

const PROJECT_TYPES = ['Luxury Residential', 'Hospitality', 'Commercial', 'Landscape', 'Mixed-Use'] as const
type ProjectType = typeof PROJECT_TYPES[number]

const AVG_PROJECT_HRS: Record<ProjectType, number> = {
    'Luxury Residential': 120,
    'Hospitality': 180,
    'Commercial': 140,
    'Landscape': 100,
    'Mixed-Use': 160
}

type ToolId = 'midjourney' | 'nanobanana' | 'higgsfield' | 'chatgpt' | 'krea' | 'all'

interface ToolDef {
    id: ToolId
    name: string
    replaces: string
    stat: string
    detail: string
}

const TOOLS: ToolDef[] = [
    {
        id: 'midjourney',
        name: 'Midjourney',
        replaces: 'Manual moodboarding & reference gathering',
        stat: '↓ 90% research time',
        detail: 'Concept directions generated in ~1 hour vs 3–7 days'
    },
    {
        id: 'nanobanana',
        name: 'Nano Banana',
        replaces: 'SketchUp iterations & Photoshop render editing',
        stat: '13-second renders',
        detail: 'Real-time material, lighting & angle changes via plain language'
    },
    {
        id: 'higgsfield',
        name: 'Higgsfield',
        replaces: 'External video & walkthrough production studios',
        stat: '↓ 90% video production time',
        detail: 'Full cinematic walkthrough from static images in minutes'
    },
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        replaces: 'Brief writing, proposal copy & client communication drafts',
        stat: '↓ 40% written task time',
        detail: 'Proposals, presentations and briefs drafted in minutes'
    },
    {
        id: 'krea',
        name: 'Krea',
        replaces: 'External retouching, slow render-export-feedback cycles, and manual upscaling',
        stat: 'Live AI canvas',
        detail: 'Real-time rendering, style controls, and HD upscaling directly on the canvas — iterate visually in seconds, not hours'
    },
    {
        id: 'all',
        name: 'Complete AI Workflow',
        replaces: 'Fragmented multi-tool, multi-day production pipelines',
        stat: '2–3× total studio output',
        detail: 'Equivalent to 20–25 designers from a team of 10. Turning this on selects all.'
    }
]

// ─── Calculation Logic ────────────────────────────────────────────────────────

function calculateSavings(teamSize: number, projectType: ProjectType, selectedTools: ToolId[]) {
    if (selectedTools.length === 0) return { totalHoursSaved: 0, headcountFreed: 0, projectsMonth: 0 }

    const baseHrs = { research: 6, concept: 8, render: 7, video: 4, written: 4, style: 3 }
    const savingsRates = {
        midjourney: { research: 0.9, concept: 0.6 },
        nanobanana: { render: 0.85, concept: 0.7 },
        higgsfield: { video: 0.9 },
        chatgpt: { written: 0.4 },
        krea: { style: 0.7, render: 0.3 }
    }
    const multipliers: Record<ProjectType, any> = {
        'Luxury Residential': { mj: 1.2, nb: 1.3, hf: 1.0, gpt: 1.0, krea: 1.1 },
        'Hospitality': { mj: 1.1, nb: 1.1, hf: 1.4, gpt: 1.1, krea: 1.0 },
        'Commercial': { mj: 1.0, nb: 1.0, hf: 1.1, gpt: 1.3, krea: 1.2 },
        'Landscape': { mj: 1.1, nb: 1.4, hf: 1.2, gpt: 0.9, krea: 1.1 },
        'Mixed-Use': { mj: 1.0, nb: 1.1, hf: 1.2, gpt: 1.1, krea: 1.0 }
    }

    const isAll = selectedTools.includes('all')
    const has = (id: ToolId) => isAll || selectedTools.includes(id)
    const m = multipliers[projectType]

    let savedHrsPerDesigner = 0
    if (has('midjourney')) savedHrsPerDesigner += (baseHrs.research * savingsRates.midjourney.research + baseHrs.concept * savingsRates.midjourney.concept) * m.mj
    if (has('nanobanana')) savedHrsPerDesigner += (baseHrs.render * savingsRates.nanobanana.render + baseHrs.concept * savingsRates.nanobanana.concept) * m.nb
    if (has('higgsfield')) savedHrsPerDesigner += baseHrs.video * savingsRates.higgsfield.video * m.hf
    if (has('chatgpt')) savedHrsPerDesigner += baseHrs.written * savingsRates.chatgpt.written * m.gpt
    if (has('krea')) savedHrsPerDesigner += (baseHrs.style * savingsRates.krea.style + baseHrs.render * savingsRates.krea.render) * m.krea

    // Cap at 80% (32 hours/week)
    savedHrsPerDesigner = Math.min(savedHrsPerDesigner, 32)

    const totalHoursSaved = savedHrsPerDesigner * teamSize
    const headcountFreed = totalHoursSaved / 40
    const projectsMonth = Math.floor((totalHoursSaved * 4) / AVG_PROJECT_HRS[projectType])

    return {
        totalHoursSaved: Math.round(totalHoursSaved),
        headcountFreed: parseFloat(headcountFreed.toFixed(1)),
        projectsMonth
    }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAnimatedNumber(end: number, duration = 1000, inView = true, decimals = 0) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if (!inView) return
        let start = 0
        const startTime = performance.now()
        const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            start = easeOut * end
            setValue(parseFloat(start.toFixed(decimals)))
            if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }, [end, duration, inView, decimals])
    return value
}

// ─── Output Card ──────────────────────────────────────────────────────────────

function OutputCard({ value, label, subtext, decimals = 0, suffix = '', delay = 0 }: { value: number, label: string, subtext: string, decimals?: number, suffix?: string, delay?: number }) {
    const animated = useAnimatedNumber(value, 1500, true, decimals)
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 p-6 md:p-8 bg-[#111111]/80 backdrop-blur-md border border-lime/30 rounded-2xl shadow-[0_0_30px_rgba(208,255,113,0.1)] relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-lime/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <span className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-lime tabular-nums tracking-tight">
                {animated}{suffix}
            </span>
            <span className="text-sm font-bold text-white uppercase tracking-wider font-heading mt-2">{label}</span>
            <span className="text-xs text-gray-500 font-body text-center">{subtext}</span>
        </motion.div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductivityCalculator() {
    const [teamSize, setTeamSize] = useState(10)
    const [projectType, setProjectType] = useState<ProjectType>('Luxury Residential')
    const [selectedTools, setSelectedTools] = useState<ToolId[]>([])

    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    const toggleTool = (id: ToolId) => {
        setSelectedTools(prev => {
            if (id === 'all') {
                return prev.includes('all') ? [] : TOOLS.map(t => t.id)
            }
            if (prev.includes(id)) {
                return prev.filter(t => t !== id && t !== 'all')
            }
            const next = [...prev, id]
            // If all 5 individual tools are selected, also add 'all'
            if (next.filter(t => t !== 'all').length === 5) {
                return [...next, 'all']
            }
            return next
        })
    }

    const { totalHoursSaved, headcountFreed, projectsMonth } = calculateSavings(teamSize, projectType, selectedTools)
    const hasTools = selectedTools.length > 0

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12 py-12 border-t border-white/5"
        >
            {/* Header */}
            <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-lime font-body">Productivity Calculator</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black tracking-wide text-white">
                    What Could Your Studio Reclaim?
                </h2>
                <p className="text-base text-gray-400 font-body">
                    Build your AI stack and see the real-time impact on your team's capacity.
                </p>
            </div>

            {/* Step 1: Context */}
            <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Team Size Slider */}
                <div className="space-y-6">
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm font-bold text-gray-300 font-heading tracking-wide uppercase">Designers on your team</label>
                        <span className="text-3xl font-heading font-black text-lime">{teamSize}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={teamSize}
                        onChange={(e) => setTeamSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lime"
                    />
                    <div className="flex justify-between text-xs text-gray-500 font-body">
                        <span>1</span>
                        <span>50</span>
                    </div>
                </div>

                {/* Project Type Pills */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-300 font-heading tracking-wide uppercase">Primary Project Type</label>
                    <div className="flex flex-wrap gap-2">
                        {PROJECT_TYPES.map(type => {
                            const active = projectType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setProjectType(type)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${active ? 'bg-lime text-black' : 'bg-transparent border border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                                >
                                    {type}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Step 2: Build AI Stack */}
            <div className="space-y-6">
                <h3 className="text-xl font-heading font-black tracking-wide text-white">Select the tools your studio will use</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {TOOLS.map((tool) => {
                        const active = selectedTools.includes(tool.id) || selectedTools.includes('all');
                        return (
                            <motion.button
                                key={tool.id}
                                onClick={() => toggleTool(tool.id)}
                                whileTap={{ scale: 0.98 }}
                                className={`text-left rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden group ${active ? 'bg-[#111111]/90 border-lime shadow-[0_0_20px_rgba(208,255,113,0.15)] bg-gradient-to-br from-lime/10 to-transparent' : 'bg-bg-card border-white/10 hover:border-white/30'}`}
                            >
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-xl font-heading font-black ${active ? 'text-lime' : 'text-white'}`}>{tool.name}</h4>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${active ? 'border-lime bg-lime text-black' : 'border-white/20 text-transparent'}`}>
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded min-w-max ${active ? 'bg-lime text-black' : 'bg-white/10 text-gray-300'}`}>
                                            {tool.stat}
                                        </span>
                                        <p className="text-xs text-gray-500 font-body leading-relaxed max-w-[90%]">
                                            <strong className="text-gray-400">Replaces:</strong> {tool.replaces}
                                        </p>
                                        <p className="text-xs text-gray-400 font-body leading-relaxed max-w-[95%]">
                                            {tool.detail}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Step 3: Output Panel */}
            <AnimatePresence>
                {hasTools && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <OutputCard
                                    value={totalHoursSaved}
                                    label="Hours / Week"
                                    subtext={`Across your team of ${teamSize} designers`}
                                    delay={0}
                                />
                                <OutputCard
                                    value={headcountFreed}
                                    decimals={1}
                                    label="Designer Equivalent"
                                    subtext="Based on a 40-hour work week"
                                    delay={0.1}
                                />
                                <OutputCard
                                    value={projectsMonth}
                                    label="Projects / Month"
                                    subtext="Extra capacity at current team size"
                                    delay={0.2}
                                />
                            </div>

                            <motion.div
                                key={`${teamSize}-${projectType}-${selectedTools.length}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="text-center p-6 bg-lime/10 border border-lime/20 rounded-2xl"
                            >
                                <p className="text-base md:text-lg text-lime font-body leading-relaxed">
                                    "A {teamSize}-person {projectType} studio using {selectedTools.length === TOOLS.length || selectedTools.includes('all') ? 'the complete AI workflow' : `${selectedTools.length} AI ${selectedTools.length === 1 ? 'tool' : 'tools'}`} could reclaim <strong className="font-heading font-black tracking-wide">{totalHoursSaved}</strong> hours/week — the equivalent of <strong className="font-heading font-black tracking-wide">{headcountFreed}</strong> full-time {headcountFreed === 1 ? 'designer' : 'designers'}."
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
                {!hasTools && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl border-dashed"
                    >
                        <p className="text-gray-500 font-body">Select at least one tool to see your studio's potential.</p>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.section>
    )
}
