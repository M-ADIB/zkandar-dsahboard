export type UserRole = 'owner' | 'admin' | 'executive' | 'participant'
export type CohortStatus = 'upcoming' | 'active' | 'completed'
export type SessionStatus = 'scheduled' | 'completed'
export type SubmissionStatus = 'pending' | 'reviewed'
export type SubmissionFormat = 'file' | 'link' | 'text'
export type SurveyTrigger = 'onboarding' | 'mid_program' | 'post_program'
export type InvitationStatus = 'pending' | 'accepted' | 'expired'

export interface User {
    id: string
    email: string
    full_name: string
    role: UserRole
    company_id: string | null
    onboarding_completed: boolean
    ai_readiness_score: number
    profile_data: Record<string, unknown> | null
    created_at: string
}

export interface Company {
    id: string
    name: string
    industry: string | null
    enrollment_date: string
    cohort_id: string | null
    executive_user_id: string | null
    team_size: number
}

export interface Cohort {
    id: string
    name: string
    start_date: string
    end_date: string
    status: CohortStatus
    miro_board_url: string | null
    created_at: string
}

export interface Session {
    id: string
    cohort_id: string
    session_number: number
    title: string
    scheduled_date: string
    zoom_recording_url: string | null
    materials: SessionMaterial[]
    attendance: string[]
    status: SessionStatus
    created_at: string
}

export interface SessionMaterial {
    type: 'pdf' | 'video' | 'link' | 'image'
    url: string
    name: string
}

export interface Assignment {
    id: string
    session_id: string
    title: string
    description: string | null
    due_date: string
    submission_format: SubmissionFormat
    created_at: string
}

export interface Submission {
    id: string
    assignment_id: string
    user_id: string
    content: SubmissionContent
    submitted_at: string
    status: SubmissionStatus
    admin_feedback: string | null
}

export interface SubmissionContent {
    file_url?: string
    link?: string
    text?: string
}

export interface ChatMessage {
    id: string
    cohort_id: string | null
    company_id: string | null
    sender_id: string
    message: string
    attachments: ChatAttachment[]
    is_pinned: boolean
    created_at: string
    // Joined data
    sender?: User
}

export interface ChatAttachment {
    type: 'image' | 'file'
    url: string
    name: string
}

export interface Survey {
    id: string
    name: string
    trigger_type: SurveyTrigger
    questions: SurveyQuestion[]
    is_active: boolean
    created_at: string
}

export interface SurveyQuestion {
    id: string
    text: string
    type: 'text' | 'radio' | 'checkbox' | 'scale'
    options?: string[]
}

export interface SurveyResponse {
    id: string
    survey_id: string
    user_id: string
    responses: Record<string, unknown>
    completed_at: string
}

export interface Invitation {
    id: string
    email: string
    company_id: string | null
    invited_by: string | null
    token: string
    status: InvitationStatus
    created_at: string
    expires_at: string
}

// Database type for Supabase client
export interface Database {
    public: {
        Tables: {
            users: {
                Row: User
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    role: UserRole
                    company_id?: string | null
                    onboarding_completed?: boolean
                    ai_readiness_score?: number
                    profile_data?: Record<string, unknown> | null
                }
                Update: Partial<Omit<User, 'id' | 'created_at'>>
            }
            companies: {
                Row: Company
                Insert: Omit<Company, 'id'>
                Update: Partial<Omit<Company, 'id'>>
            }
            cohorts: {
                Row: Cohort
                Insert: Omit<Cohort, 'id' | 'created_at'>
                Update: Partial<Omit<Cohort, 'id'>>
            }
            sessions: {
                Row: Session
                Insert: Omit<Session, 'id' | 'created_at'>
                Update: Partial<Omit<Session, 'id'>>
            }
            assignments: {
                Row: Assignment
                Insert: Omit<Assignment, 'id' | 'created_at'>
                Update: Partial<Omit<Assignment, 'id'>>
            }
            submissions: {
                Row: Submission
                Insert: Omit<Submission, 'id' | 'submitted_at'>
                Update: Partial<Omit<Submission, 'id'>>
            }
            chat_messages: {
                Row: ChatMessage
                Insert: Omit<ChatMessage, 'id' | 'created_at'>
                Update: Partial<Omit<ChatMessage, 'id'>>
            }
            surveys: {
                Row: Survey
                Insert: Omit<Survey, 'id' | 'created_at'>
                Update: Partial<Omit<Survey, 'id'>>
            }
            survey_responses: {
                Row: SurveyResponse
                Insert: Omit<SurveyResponse, 'id' | 'completed_at'>
                Update: Partial<Omit<SurveyResponse, 'id'>>
            }
            invitations: {
                Row: Invitation
                Insert: Omit<Invitation, 'id' | 'created_at'>
                Update: Partial<Omit<Invitation, 'id'>>
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
            cohort_status: CohortStatus
            session_status: SessionStatus
            submission_status: SubmissionStatus
            submission_format: SubmissionFormat
            survey_trigger: SurveyTrigger
            invitation_status: InvitationStatus
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
