import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY // Need service role to bypass RLS easily

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const MOCK_ASSIGNMENTS = [
    {
        title: 'Masterclass Pre-Work: Ideation',
        description: 'Submit your initial 3 ideas for the internal process you want to optimize using AI tools. Keep it under 200 words per idea.',
        submission_format: 'text',
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() // in 3 days
    },
    {
        title: 'Midjourney Prompt Engineering',
        description: 'Upload the 4 images you generated using the prompt techniques discussed in Session 2. Provide the exact prompts used.',
        submission_format: 'file',
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() // in 7 days
    },
    {
        title: 'Final Implementation Plan',
        description: 'Link your Miro board or submit a PDF outlining the 30-day rollout plan for your selected AI workflow.',
        submission_format: 'link',
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString() // in 14 days
    }
]

async function seedAssignments() {
    console.log('Fetching Finasi company...')
    const { data: finasi, error: cErr } = await supabase
        .from('companies')
        .select('*')
        .eq('name', 'Finasi')
        .single()

    if (cErr || !finasi) {
        console.error('Finasi not found', cErr)
        return
    }

    const cohortId = finasi.cohort_id
    if (!cohortId) {
        console.error('Finasi has no cohort')
        return
    }

    console.log('Fetching Finasi sessions...')
    const { data: sessions, error: sErr } = await supabase
        .from('sessions')
        .select('id')
        .eq('cohort_id', cohortId)
        .order('session_number')

    if (sErr || !sessions || sessions.length < 3) {
        console.error('Not enough sessions found', sErr)
        return
    }

    console.log('Inserting 3 mock assignments...')
    // Link Assignment 1 to Session 1, Assignment 2 to Session 3, Assignment 3 to Session 5
    const assignmentsToAdd = MOCK_ASSIGNMENTS.map((a, i) => ({
        ...a,
        session_id: sessions[i * 2].id
    }))

    const { data: insertedAssignments, error: aErr } = await supabase
        .from('assignments')
        .insert(assignmentsToAdd)
        .select()

    if (aErr) {
        console.error('Failed to insert assignments', aErr)
        return
    }

    console.log(`Inserted ${insertedAssignments.length} assignments`)

    console.log('Fetching Finasi members...')
    const { data: members, error: mErr } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('company_id', finasi.id)

    if (mErr || !members) {
        console.error('Failed to fetch members', mErr)
        return
    }

    console.log(`Found ${members.length} members. Generating submissions...`)

    // Mix of statuses
    const statuses = ['pending', 'submitted', 'graded', 'needs_revision']
    const submissionsToAdd = []

    for (const member of members) {
        // Give each member 2 random submissions out of the 3 assignments
        const randomAssignments = insertedAssignments.sort(() => 0.5 - Math.random()).slice(0, 2)

        for (const assignment of randomAssignments) {
            const status = statuses[Math.floor(Math.random() * statuses.length)]

            let content = {}
            if (status !== 'pending') {
                if (assignment.submission_format === 'text') content = { text: 'Here are my 3 ideas for optimization: 1) Automated invoicing, 2) Design brief summarization, 3) Client onboarding.' }
                if (assignment.submission_format === 'file') content = { file_url: 'https://example.com/midjourney-renders.pdf' }
                if (assignment.submission_format === 'link') content = { link: 'https://miro.com/app/board/mock-link' }
            }

            let adminFeedback = null
            if (status === 'graded') adminFeedback = 'Excellent work applying the techniques. The third idea is particularly strong for Finasi.'
            if (status === 'needs_revision') adminFeedback = 'Please provide the exact prompts you used, not just the output images.'

            submissionsToAdd.push({
                assignment_id: assignment.id,
                user_id: member.id,
                status: status,
                content: content,
                admin_feedback: adminFeedback,
                submitted_at: status !== 'pending' ? new Date(Date.now() - 1000 * 60 * 60 * Math.random() * 24 * 2).toISOString() : new Date().toISOString()
            })
        }
    }

    const { error: subErr } = await supabase
        .from('submissions')
        .insert(submissionsToAdd)

    if (subErr) {
        console.error('Failed to insert submissions', subErr)
        return
    }

    console.log(`Inserted ${submissionsToAdd.length} mixed submissions!`)
}

seedAssignments().catch(console.error)
