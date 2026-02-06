import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle2, Upload, Link as LinkIcon, ArrowRight } from 'lucide-react'

const assignments = [
    {
        id: 1,
        title: 'Create AI-Generated Concept Renders',
        description: 'Using the techniques from Session 2, create 5 concept renders using AI image generation tools.',
        session: 'Session 2: Prompt Engineering Basics',
        dueDate: 'February 1, 2026',
        submissionFormat: 'file',
        status: 'pending',
    },
    {
        id: 2,
        title: 'Prompt Engineering Exercise',
        description: 'Document your prompt engineering process with before/after examples.',
        session: 'Session 3: AI Image Generation',
        dueDate: 'February 8, 2026',
        submissionFormat: 'link',
        status: 'upcoming',
    },
    {
        id: 3,
        title: 'AI Workflow Documentation',
        description: 'Create a flowchart documenting your AI integration workflow.',
        session: 'Session 4: Automating Workflows',
        dueDate: 'February 15, 2026',
        submissionFormat: 'file',
        status: 'upcoming',
    },
    {
        id: 4,
        title: 'Introduction Survey Reflection',
        description: 'Write a reflection on your initial AI knowledge assessment.',
        session: 'Session 1: Introduction to AI',
        dueDate: 'January 20, 2026',
        submissionFormat: 'text',
        status: 'submitted',
        feedback: 'Great reflection! Your insights on the potential of AI in architecture are spot on.',
    },
]

export function AssignmentsPage() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all')

    const filteredAssignments = assignments.filter((assignment) => {
        if (filter === 'all') return true
        if (filter === 'pending') return assignment.status === 'pending' || assignment.status === 'upcoming'
        return assignment.status === 'submitted'
    })

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Assignments</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Complete assignments to track your progress
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'all'
                                ? 'bg-lime/10 text-lime border border-lime/20'
                                : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'pending'
                                ? 'bg-lime/10 text-lime border border-lime/20'
                                : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('submitted')}
                        className={`px-4 py-2 rounded-xl text-sm transition ${filter === 'submitted'
                                ? 'bg-lime/10 text-lime border border-lime/20'
                                : 'bg-bg-card border border-border hover:border-lime/20'
                            }`}
                    >
                        Submitted
                    </button>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {filteredAssignments.map((assignment, index) => (
                    <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-bg-card border rounded-2xl p-6 transition-colors ${assignment.status === 'pending'
                                ? 'border-yellow-500/30 hover:border-yellow-500/50'
                                : assignment.status === 'submitted'
                                    ? 'border-lime/20 hover:border-lime/40'
                                    : 'border-border hover:border-lime/20'
                            }`}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {/* Icon */}
                            <div
                                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${assignment.status === 'submitted' ? 'bg-lime/10' : 'bg-white/5'
                                    }`}
                            >
                                {assignment.status === 'submitted' ? (
                                    <CheckCircle2 className="h-6 w-6 text-lime" />
                                ) : assignment.submissionFormat === 'file' ? (
                                    <Upload className="h-6 w-6 text-gray-400" />
                                ) : assignment.submissionFormat === 'link' ? (
                                    <LinkIcon className="h-6 w-6 text-gray-400" />
                                ) : (
                                    <FileText className="h-6 w-6 text-gray-400" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                        <p className="text-xs text-lime mt-1">{assignment.session}</p>
                                    </div>
                                    {/* Status Badge */}
                                    {assignment.status === 'pending' && (
                                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg shrink-0">
                                            Due Soon
                                        </span>
                                    )}
                                    {assignment.status === 'submitted' && (
                                        <span className="px-3 py-1 bg-lime/10 text-lime text-xs rounded-lg shrink-0">
                                            Submitted
                                        </span>
                                    )}
                                    {assignment.status === 'upcoming' && (
                                        <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-lg shrink-0">
                                            Upcoming
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm mt-2">{assignment.description}</p>
                                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        Due: {assignment.dueDate}
                                    </span>
                                </div>

                                {/* Feedback */}
                                {assignment.feedback && (
                                    <div className="mt-4 p-4 bg-lime/5 border border-lime/20 rounded-xl">
                                        <p className="text-xs text-lime mb-1 font-medium">Admin Feedback</p>
                                        <p className="text-sm text-gray-300">{assignment.feedback}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            {assignment.status !== 'submitted' && (
                                <button className="px-5 py-2.5 gradient-lime text-black font-medium rounded-xl hover:opacity-90 transition shrink-0 flex items-center gap-2">
                                    Submit <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
