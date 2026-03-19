export type UserRole = 'owner' | 'admin' | 'executive' | 'participant'
export type UserType = 'management' | 'team'
export type CohortStatus = 'upcoming' | 'active' | 'completed'
export type OfferingType = 'sprint_workshop' | 'master_class'
export type SessionStatus = 'upcoming' | 'completed'
export type SubmissionStatus = 'pending' | 'reviewed'
export type SubmissionFormat = 'file' | 'link' | 'text' | 'any'
export type SurveyTrigger = 'onboarding' | 'mid_program' | 'post_program'
export type ChatChannelType = 'team' | 'management' | 'sprint'
export type ChatMessageType = 'text' | 'file' | 'system'
export type InvitationStatus = 'pending' | 'accepted' | 'expired'
export type ToolboxImportance = 'essential' | 'recommended' | 'optional'
export type ToolboxToolType = 'image_generation' | 'video_generation' | 'text_generation' | 'automation' | 'analytics' | 'other'

export type ToolboxSubscriptionType = 'free' | 'freemium' | 'paid' | 'enterprise'

export interface ToolboxItem {
    id: string
    title: string
    url: string
    vimeo_url: string | null
    description: string | null
    importance: ToolboxImportance
    category: string
    tool_type: ToolboxToolType
    subscription_type: ToolboxSubscriptionType
    order_index: number
    is_active: boolean
    created_at: string
    updated_at: string
}

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
    nationality: string | null
    age: number | null
    position: string | null
}

export interface Company {
    id: string
    name: string
    industry: string | null
    enrollment_date: string
    cohort_id: string | null
    executive_user_id: string | null
    team_size: number
    country: string | null
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
    priority?: 'ACTIVE' | 'COLD' | 'LAVA' | 'COMPLETED' | 'NOT INTERESTED' | null;
    discovery_call_date?: string | null;
    offering_type?: string | null;
    session_type?: string | null;

    // Financial
    payment_amount?: number | null;
    has_coupon?: boolean | null;
    coupon_percent?: number | null;
    coupon_code?: string | null;
    seats?: number | null;
    paid_deposit?: boolean | null;
    amount_paid?: number | null;
    date_of_payment?: string | null;
    is_payment_plan?: boolean | null;
    amount_paid_2?: number | null;
    date_of_payment_2?: string | null;
    balance?: number | null;
    balance_dop?: string | null;
    paid_full?: boolean | null;
    amount_paid_3?: number | null;
    date_of_payment_3?: string | null;

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

    // UI state
    is_highlighted?: boolean | null;
    custom_fields?: Record<string, any>;
}

export interface LeadColumnOption {
    label: string;
    color?: string;
}

export interface LeadColumn {
    id: string;
    key: string;
    label: string;
    type: string;
    is_custom: boolean;
    visible: boolean;
    order_index: number;
    options: LeadColumnOption[];
    created_at: string;
    updated_at: string;
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
    recording_url: string | null
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
    materials?: SessionMaterial[]
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
    score: number | null
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
    message_type: ChatMessageType
    file_url: string | null
    channel_type: ChatChannelType
    is_pinned: boolean
    created_at: string
    // Joined data
    sender?: User
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

export interface EventRequest {
    id: string
    full_name: string
    email: string
    company: string
    role_title: string
    event_type: string
    proposed_date: string
    venue: string
    audience_size: number
    event_description: string
    session_format: string
    duration: string
    has_moderator: boolean
    intro_handler: string | null
    has_qa: boolean
    has_catering: boolean
    available_tech: string[]
    parking_notes: string | null
    vip_notes: string | null
    marketing_flyer: string
    contact_name: string
    contact_phone: string
    other_notes: string | null
    status: 'pending' | 'approved' | 'declined' | 'done'
    admin_notes: string | null
    created_at: string
    // EPK fields
    epk_generated: boolean
    epk_slug: string | null
    epk_talk_title: string | null
    epk_bio: string | null
    epk_flyer_url: string | null
    epk_host_provides_flyer: boolean
    epk_headshot_url: string | null
    epk_speaker_name: string | null
    epk_speaker_title: string | null
    epk_company: string | null
    epk_instagram: string | null
}

export type ApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'

export interface JobApplication {
    id: string
    position_type: string
    full_name: string
    email: string
    phone: string
    linkedin_url: string | null
    instagram_url: string | null
    gender: string
    country: string
    timezone: string
    compensation_model?: string
    years_experience: string
    sold_info_products: string
    avg_deal_size: string
    crm_tools?: string[]
    expected_monthly_earnings: string | null
    best_close_story: string | null
    why_zkandar: string | null
    video_intro_url: string | null
    status: ApplicationStatus
    admin_notes: string | null
    reviewed_by: string | null
    created_at: string
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
                    nationality?: string | null
                    age?: number | null
                    position?: string | null
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
                    country?: string | null
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
            lead_columns: {
                Row: LeadColumn
                Insert: Omit<LeadColumn, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<LeadColumn, 'id' | 'created_at'>>
            }
            toolbox_items: {
                Row: ToolboxItem
                Insert: {
                    title: string
                    url: string
                    vimeo_url?: string | null
                    description?: string | null
                    importance?: ToolboxImportance
                    category?: string
                    tool_type?: ToolboxToolType
                    subscription_type?: ToolboxSubscriptionType
                    order_index?: number
                    is_active?: boolean
                }
                Update: Partial<Omit<ToolboxItem, 'id' | 'created_at'>>
            }
            event_requests: {
                Row: EventRequest
                Insert: Omit<EventRequest, 'id' | 'created_at'>
                Update: Partial<Omit<EventRequest, 'id' | 'created_at'>>
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
