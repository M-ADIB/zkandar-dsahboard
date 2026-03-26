import type { SurveyAnswers } from '@/types/database'

// Initial score is capped at 50 — assignments are what drive improvement beyond that.
// Final score is capped at 95 — no user is ever "100% AI ready" before completing Zkandar.
export const PENALTY_MULTIPLIER = 0.50
export const ASSIGNMENT_MAX_BOOST = 45

export function computeInitialScore(answers: SurveyAnswers | null | undefined, userType: string | null): number {
    if (!answers) return 15

    const scaleKeys =
        userType === 'management'
            ? ['ai_visibility', 'brand_confidence', 'team_readiness']
            : ['ai_confidence', 'ai_skill_level', 'quality_confidence', 'workflow_readiness']

    const scaleValues = scaleKeys
        .map((k) => (typeof answers[k] === 'number' ? (answers[k] as number) : 0))
        .filter((v) => v > 0)

    if (scaleValues.length === 0) return 15 // No data → very low
    const avg = scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length
    // Cap at 50: (5/5) * 100 * 0.50 = 50
    return Math.min(50, Math.round((avg / 5) * 100 * PENALTY_MULTIPLIER))
}

export function computeAssignmentBoost(scores: number[]): number {
    const validScores = scores.filter((s) => s != null && s !== undefined)
    if (validScores.length === 0) return 0
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length
    return Math.round((avg / 100) * ASSIGNMENT_MAX_BOOST)
}

export function computeFinalScore(initial: number, boost: number): number {
    // Cap at 95 — no one is ever fully AI-ready without continuous growth
    return Math.min(95, initial + boost)
}
