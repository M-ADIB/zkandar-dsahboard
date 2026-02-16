export type UserRole = 'owner' | 'admin' | 'executive' | 'participant'
export type UserType = 'management' | 'team'
export type CohortStatus = 'upcoming' | 'active' | 'completed'
export type OfferingType = 'sprint_workshop' | 'master_class'
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
    user_type: UserType | null
    company_id: string | null
    onboarding_completed: boolean
    ai_readiness_score: number
    profile_data: Record<string, unknown> | null
    onboarding_data: Record<string, unknown> | null
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

export interface Notification {
    id: string
    user_id: string
    title: string
    message: string | null
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    action_url: string | null
    created_at: string
}

export interface Lead {
    id: string;
    created_at: string;
    updated_at: string;

    // Contact Info
    record_id?: string | null;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    instagram?: string | null;
    company_name?: string | null;
    job_title?: string | null;
    country?: string | null;
    city?: string | null;
    description?: string | null;

    // Deal Info
    priority?: 'ACTIVE' | 'HOT' | 'COLD' | 'LAVA' | 'COMPLETED' | 'NOT INTERESTED' | null;
    discovery_call_date?: string | null;
    offering_type?: string | null;
    session_type?: string | null;

    // Financial
    payment_amount?: number | null;
    seats?: number | null;
    balance?: number | null;
    balance_2?: number | null;
    coupon_percent?: number | null;
    coupon_code?: string | null;
    paid_deposit?: boolean | null;
    amount_paid?: number | null;
    amount_paid_2?: number | null;
    date_of_payment?: string | null;
    date_of_payment_2?: string | null;
    date_of_payment_3?: string | null;
    payment_plan?: string | null;
    paid_full?: boolean | null;
    balance_dop?: string | null;

    // Schedule
    day_slot?: string | null;
    time_slot?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    sessions_done?: number | null;

    // Support
    booked_support?: string | null;
    support_date_booked?: string | null;

    // Notes
    notes?: string | null;

    // Metadata
    priority_changed_at?: string | null;
    priority_previous_values?: string[] | null;

    // Ownership
    owner_id?: string | null;
}


export interface Cohort {
    id: string
    name: string
    start_date: string
    end_date: string
    status: CohortStatus
    offering_type: OfferingType
    miro_board_url: string | null
    created_at: string
}

export interface CohortMembership {
    id: string
    user_id: string
    cohort_id: string
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
                    role?: UserRole
                    company_id?: string | null
                    user_type?: UserType | null
                    onboarding_completed?: boolean
                    ai_readiness_score?: number
                    profile_data?: Record<string, unknown> | null
                    onboarding_data?: Record<string, unknown> | null
                    created_at?: string
                }
                Update: Partial<Omit<User, 'id' | 'created_at'>>
            }
            companies: {
                Row: Company
                Insert: {
                    name: string
                    industry?: string | null
                    enrollment_date?: string
                    cohort_id?: string | null
                    executive_user_id?: string | null
                    team_size?: number
                }
                Update: Partial<Omit<Company, 'id'>>
            }
            cohorts: {
                Row: Cohort
                Insert: Omit<Cohort, 'id' | 'created_at'>
                Update: Partial<Omit<Cohort, 'id'>>
            }
            cohort_memberships: {
                Row: CohortMembership
                Insert: {
                    user_id: string
                    cohort_id: string
                    created_at?: string
                }
                Update: Partial<Omit<CohortMembership, 'id' | 'created_at'>>
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
            notifications: {
                Row: Notification
                Insert: {
                    user_id: string
                    title: string
                    message?: string | null
                    type?: 'info' | 'success' | 'warning' | 'error'
                    read?: boolean
                    action_url?: string | null
                    created_at?: string
                }
                Update: Partial<Omit<Notification, 'id' | 'created_at'>>
            }
            leads: {
                Row: Lead
                Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Lead, 'id' | 'created_at'>>
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
            user_type: UserType
            cohort_status: CohortStatus
            offering_type: OfferingType
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
