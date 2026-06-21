export type UserRole = 'owner' | 'admin' | 'executive' | 'participant'
export type UserType = 'management' | 'team' | 'sprint_member' | 'webinar_member'
export type CohortStatus = 'upcoming' | 'active' | 'completed'
export type OfferingType = 'sprint_workshop' | 'master_class' | 'webinar'
export type SessionStatus = 'scheduled' | 'completed'
export type SubmissionStatus = 'pending' | 'reviewed' | 'in_review' | 'approved' | 'resubmit'
export type SubmissionFormat = 'file' | 'link' | 'text' | 'any'
export type SurveyTrigger = 'onboarding' | 'mid_program' | 'post_program'
export type ChatChannelType = 'team' | 'management' | 'sprint'
export type ChatMessageType = 'text' | 'file' | 'system'
export type InvitationStatus = 'pending' | 'accepted' | 'expired'
export type ToolboxImportance = 'essential' | 'recommended' | 'optional'
export type ToolboxToolType = 'image_generation' | 'video_generation' | 'text_generation' | 'automation' | 'analytics' | 'other'

export interface SurveyAnswers {
  [key: string]: string | string[] | number | Record<string, number>
}
export type ToolboxSubscriptionType = 'free' | 'freemium' | 'paid' | 'enterprise'

export interface ToolboxMedia {
    id: string
    type: 'video' | 'image'
    url: string
    title?: string
}

export interface ToolboxItem {
    id: string
    title: string
    url: string
    logo_url: string | null
    vimeo_url: string | null
    description: string | null
    media?: ToolboxMedia[] | null
    importance: ToolboxImportance
    category: string
    tool_type: ToolboxToolType
    tool_types: string[]
    visible_to: string[]
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
    avatar_url: string | null
    onboarding_completed: boolean
    welcome_video_watched: boolean
    ai_readiness_score: number | null
    profile_data: Record<string, unknown> | null
    onboarding_data: Record<string, unknown> | null
    created_at: string
    nationality: string | null
    age: number | null
    position: string | null
}

export interface PlatformSetting {
    id: string
    key: string
    value: string
    label: string | null
    category: string
    updated_at: string
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
    zoom_link: string | null
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
    lock_override?: 'default' | 'unlocked' | 'locked'
}

export interface Submission {
    id: string
    assignment_id: string
    user_id: string
    file_url: string | null
    notes: string | null
    prompt_text: string | null
    submitted_at: string
    status: SubmissionStatus
    feedback: string | null
    score: number | null
}

export interface ChatMessage {
    id: string
    room_id: string
    sender_id: string
    body: string | null
    message_type: string
    file_url: string | null
    file_name: string | null
    file_type: string | null
    file_size: number | null
    voice_duration: number | null
    parent_id: string | null
    reactions: Record<string, any> | null
    forwarded_from: string | null
    is_edited: boolean
    edited_at: string | null
    metadata: Record<string, any> | null
    created_at: string
    // Joined data
    sender?: User
}

export interface ChatRoom {
    id: string
    name: string | null
    type: string
    cohort_id: string | null
    company_id: string | null
    created_by: string | null
    created_at: string
    updated_at: string
    // Frontend-joined fields
    members?: ChatRoomMember[]
    messages?: ChatMessage[]
}

export interface ChatRoomMember {
    id: string
    room_id: string
    user_id: string
    role: string
    joined_at: string
    // Frontend-joined fields
    user?: User
}

export interface ChatReadReceipt {
    id: string
    room_id: string
    user_id: string
    last_read_at: string
}

export interface ChatPinnedMessage {
    id: string
    room_id: string
    message_id: string
    pinned_by: string
    pinned_at: string
    // Frontend-joined fields
    message?: ChatMessage
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
    role: string
    company_id: string | null
    cohort_id: string | null
    invited_by: string | null
    status: string
    created_at: string
}

export interface WebinarLead {
    id: string
    created_at: string
    updated_at: string
    full_name: string
    email: string
    phone: string | null
    source: string | null
    status: string | null
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    stripe_session_id: string | null
    payment_status: string | null
    amount_paid: number | null
    metadata: Record<string, any> | null
}

export interface WebinarPurchase {
    id: string
    user_id: string | null
    lead_id: string | null
    stripe_customer_id: string | null
    stripe_session_id: string | null
    stripe_payment_intent_id: string | null
    status: string | null
    amount_total: number | null
    currency: string | null
    customer_name: string | null
    customer_email: string | null
    products: string[] | null
    metadata: Record<string, any> | null
    completed_at: string | null
    created_at: string
    updated_at: string
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

export interface AssessmentSubmission {
    id: string
    created_at: string
    name: string
    email: string
    answers: Record<string, string>
    readiness_score: number
    path_result: 'sprint' | 'masterclass'
    context: string | null
    team_size: string | null
}

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

// ── Email Block types ─────────────────────────────────────────────────────────
export type EmailBlockType = 'heading' | 'paragraph' | 'bullet_list' | 'image' | 'divider' | 'spacer' | 'button'

export interface EmailBlockBase {
    id: string
    type: EmailBlockType
}

export interface EmailHeadingBlock extends EmailBlockBase {
    type: 'heading'
    text: string
}

export interface EmailParagraphBlock extends EmailBlockBase {
    type: 'paragraph'
    text: string // may contain <strong>, <em>, <a> tags
}

export interface EmailBulletListBlock extends EmailBlockBase {
    type: 'bullet_list'
    items: string[]
}

export interface EmailImageBlock extends EmailBlockBase {
    type: 'image'
    url: string
    alt?: string
}

export interface EmailDividerBlock extends EmailBlockBase {
    type: 'divider'
}

export interface EmailSpacerBlock extends EmailBlockBase {
    type: 'spacer'
    height: number // px
}

export interface EmailButtonBlock extends EmailBlockBase {
    type: 'button'
    label: string
    url: string
}

export type EmailBlock =
    | EmailHeadingBlock
    | EmailParagraphBlock
    | EmailBulletListBlock
    | EmailImageBlock
    | EmailDividerBlock
    | EmailSpacerBlock
    | EmailButtonBlock

// ── Email Feature interfaces ──────────────────────────────────────────────────
export interface EmailTemplate {
    id: string
    name: string
    subject: string
    headline: string | null
    body: string
    blocks: EmailBlock[]
    cta_text: string | null
    cta_url: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export type EmailCampaignStatus = 'sent' | 'scheduled' | 'cancelled'

export interface EmailCampaign {
    id: string
    subject: string
    headline: string | null
    body: string
    html_preview: string | null
    audience: string
    recipient_count: number
    sent_at: string | null
    scheduled_for: string | null
    status: EmailCampaignStatus
    created_by: string | null
    created_at: string
}

export type EmailRecipientStatus = 'queued' | 'sent' | 'failed' | 'skipped'

export interface EmailCampaignRecipient {
    id: string
    campaign_id: string
    email: string
    name: string | null
    status: EmailRecipientStatus
    created_at: string
}

export type EmailQueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'skipped'

export interface EmailQueueItem {
    id: string
    campaign_id: string | null
    recipient_email: string
    recipient_name: string | null
    subject: string
    html_body: string
    status: EmailQueueStatus
    attempts: number
    send_after: string | null
    created_at: string
    updated_at: string
}

// Database type for Supabase client
export interface RawDatabase {
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
                    welcome_video_watched?: boolean
                    ai_readiness_score?: number | null
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
                Row: {
                    id: string
                    room_id: string
                    sender_id: string
                    body: string | null
                    message_type: string
                    file_url: string | null
                    file_name: string | null
                    file_type: string | null
                    file_size: number | null
                    voice_duration: number | null
                    parent_id: string | null
                    reactions: Record<string, any> | null
                    forwarded_from: string | null
                    is_edited: boolean
                    edited_at: string | null
                    metadata: Record<string, any> | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    room_id: string
                    sender_id: string
                    body?: string | null
                    message_type?: string
                    file_url?: string | null
                    file_name?: string | null
                    file_type?: string | null
                    file_size?: number | null
                    voice_duration?: number | null
                    parent_id?: string | null
                    reactions?: Record<string, any> | null
                    forwarded_from?: string | null
                    is_edited?: boolean
                    edited_at?: string | null
                    metadata?: Record<string, any> | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string
                    sender_id?: string
                    body?: string | null
                    message_type?: string
                    file_url?: string | null
                    file_name?: string | null
                    file_type?: string | null
                    file_size?: number | null
                    voice_duration?: number | null
                    parent_id?: string | null
                    reactions?: Record<string, any> | null
                    forwarded_from?: string | null
                    is_edited?: boolean
                    edited_at?: string | null
                    metadata?: Record<string, any> | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_messages_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "chat_rooms"
                        referencedColumns: ["id"]
                    }
                ]
            }
            chat_rooms: {
                Row: {
                    id: string
                    name: string | null
                    type: string
                    cohort_id: string | null
                    company_id: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name?: string | null
                    type: string
                    cohort_id?: string | null
                    company_id?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string | null
                    type?: string
                    cohort_id?: string | null
                    company_id?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_rooms_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            chat_room_members: {
                Row: {
                    id: string
                    room_id: string
                    user_id: string
                    role: string
                    joined_at: string
                }
                Insert: {
                    id?: string
                    room_id: string
                    user_id: string
                    role?: string
                    joined_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string
                    user_id?: string
                    role?: string
                    joined_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_room_members_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "chat_rooms"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_room_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            chat_read_receipts: {
                Row: {
                    id: string
                    room_id: string
                    user_id: string
                    last_read_at: string
                }
                Insert: {
                    id?: string
                    room_id: string
                    user_id: string
                    last_read_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string
                    user_id?: string
                    last_read_at?: string
                }
            }
            chat_pinned_messages: {
                Row: {
                    id: string
                    room_id: string
                    message_id: string
                    pinned_by: string
                    pinned_at: string
                }
                Insert: {
                    id?: string
                    room_id: string
                    message_id: string
                    pinned_by: string
                    pinned_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string
                    message_id?: string
                    pinned_by?: string
                    pinned_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_pinned_messages_message_id_fkey"
                        columns: ["message_id"]
                        isOneToOne: false
                        referencedRelation: "chat_messages"
                        referencedColumns: ["id"]
                    }
                ]
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
                Insert: Omit<Invitation, 'id' | 'created_at'> & {
                    id?: string
                    created_at?: string
                }
                Update: Partial<Omit<Invitation, 'id' | 'created_at'>>
            }
            webinar_leads: {
                Row: WebinarLead
                Insert: Omit<WebinarLead, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Omit<WebinarLead, 'id' | 'created_at' | 'updated_at'>>
            }
            webinar_purchases: {
                Row: WebinarPurchase
                Insert: Omit<WebinarPurchase, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Omit<WebinarPurchase, 'id' | 'created_at' | 'updated_at'>>
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
            email_templates: {
                Row: EmailTemplate
                Insert: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<EmailTemplate, 'id' | 'created_at'>>
            }
            email_campaigns: {
                Row: EmailCampaign
                Insert: Omit<EmailCampaign, 'id' | 'created_at'>
                Update: Partial<Omit<EmailCampaign, 'id' | 'created_at'>>
            }
            email_campaign_recipients: {
                Row: EmailCampaignRecipient
                Insert: Omit<EmailCampaignRecipient, 'id' | 'created_at'>
                Update: Partial<Omit<EmailCampaignRecipient, 'id'>>
            }
            email_queue: {
                Row: EmailQueueItem
                Insert: Omit<EmailQueueItem, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<EmailQueueItem, 'id' | 'created_at'>>
            }
            assessment_submissions: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    email: string
                    answers: Record<string, any>
                    readiness_score: number
                    path_result: string
                    context: string | null
                    team_size: string | null
                    phone: string | null
                    first_name: string | null
                    last_name: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    email: string
                    answers: Record<string, any>
                    readiness_score: number
                    path_result: string
                    context?: string | null
                    team_size?: string | null
                    phone?: string | null
                    first_name?: string | null
                    last_name?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    email?: string
                    answers?: Record<string, any>
                    readiness_score?: number
                    path_result?: string
                    context?: string | null
                    team_size?: string | null
                    phone?: string | null
                    first_name?: string | null
                    last_name?: string | null
                }
            }
            events: {
                Row: {
                    id: string
                    title: string
                    venue: string | null
                    description: string | null
                    event_date: string | null
                    status: string | null
                    image_url: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    venue?: string | null
                    description?: string | null
                    event_date?: string | null
                    status?: string | null
                    image_url?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    venue?: string | null
                    description?: string | null
                    event_date?: string | null
                    status?: string | null
                    image_url?: string | null
                    created_at?: string | null
                }
            }
            platform_settings: {
                Row: {
                    id: string
                    key: string
                    value: string
                    label: string | null
                    category: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    key: string
                    value: string
                    label?: string | null
                    category?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    key?: string
                    value?: string
                    label?: string | null
                    category?: string | null
                    updated_at?: string | null
                }
            }
            costs: {
                Row: {
                    id: string
                    item_name: string
                    category: string
                    invoice_date: string | null
                    total_amount: number
                    payment_date: string | null
                    notes: string | null
                    credential_email: string | null
                    credential_password: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    item_name: string
                    category: string
                    invoice_date?: string | null
                    total_amount: number
                    payment_date?: string | null
                    notes?: string | null
                    credential_email?: string | null
                    credential_password?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    item_name?: string
                    category?: string
                    invoice_date?: string | null
                    total_amount?: number
                    payment_date?: string | null
                    notes?: string | null
                    credential_email?: string | null
                    credential_password?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            job_applications: {
                Row: JobApplication
                Insert: Omit<JobApplication, 'id' | 'created_at'> & {
                    id?: string
                    created_at?: string
                }
                Update: Partial<JobApplication>
            }
            session_attendance: {
                Row: {
                    id: string
                    session_id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    user_id?: string
                    created_at?: string
                }
            }

            management_submissions: {
                Row: {
                    id: string
                    created_at: string
                    user_email: string
                    full_name: string | null
                    company_name: string | null
                    company_id: string | null
                    q1_role: string | null
                    q2_studio_focus: string | null
                    q3_ai_adoption_status: string | null
                    q4_visibility: number | null
                    q5_opportunities: string[] | null
                    q6_risks: string[] | null
                    q7_alignment_confidence: number | null
                    q8_guidance_level: string | null
                    q9_success_factor: string | null
                    q10_team_readiness: number | null
                    q11_impact_speed: number | null
                    q11_impact_quality: number | null
                    q11_impact_efficiency: number | null
                    q11_impact_client_satisfaction: number | null
                    q11_impact_competitive_advantage: number | null
                    q12_objectives: string[] | null
                    q13_success_definition: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_email: string
                    full_name?: string | null
                    company_name?: string | null
                    company_id?: string | null
                    q1_role?: string | null
                    q2_studio_focus?: string | null
                    q3_ai_adoption_status?: string | null
                    q4_visibility?: number | null
                    q5_opportunities?: string[] | null
                    q6_risks?: string[] | null
                    q7_alignment_confidence?: number | null
                    q8_guidance_level?: string | null
                    q9_success_factor?: string | null
                    q10_team_readiness?: number | null
                    q11_impact_speed?: number | null
                    q11_impact_quality?: number | null
                    q11_impact_efficiency?: number | null
                    q11_impact_client_satisfaction?: number | null
                    q11_impact_competitive_advantage?: number | null
                    q12_objectives?: string[] | null
                    q13_success_definition?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_email?: string
                    full_name?: string | null
                    company_name?: string | null
                    company_id?: string | null
                    q1_role?: string | null
                    q2_studio_focus?: string | null
                    q3_ai_adoption_status?: string | null
                    q4_visibility?: number | null
                    q5_opportunities?: string[] | null
                    q6_risks?: string[] | null
                    q7_alignment_confidence?: number | null
                    q8_guidance_level?: string | null
                    q9_success_factor?: string | null
                    q10_team_readiness?: number | null
                    q11_impact_speed?: number | null
                    q11_impact_quality?: number | null
                    q11_impact_efficiency?: number | null
                    q11_impact_client_satisfaction?: number | null
                    q11_impact_competitive_advantage?: number | null
                    q12_objectives?: string[] | null
                    q13_success_definition?: string | null
                }
            }
            team_submissions: {
                Row: {
                    id: string
                    created_at: string
                    user_email: string
                    full_name: string | null
                    company_name: string | null
                    company_id: string | null
                    q1_role: string | null
                    q1_role_other: string | null
                    q2_experience_years: string | null
                    q3_ai_usage: string | null
                    q4_ai_tools: string[] | null
                    q5_confidence_ai_workflow: number | null
                    q6_skill_level_ai_tools: number | null
                    q7_difficulty_areas: string[] | null
                    q8_outputs_meet_standards_confidence: number | null
                    q9_concerns: string[] | null
                    q10_help_most: string | null
                    q11_readiness: number | null
                    q12_top_goals: string[] | null
                    q13_success_definition: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_email: string
                    full_name?: string | null
                    company_name?: string | null
                    company_id?: string | null
                    q1_role?: string | null
                    q1_role_other?: string | null
                    q2_experience_years?: string | null
                    q3_ai_usage?: string | null
                    q4_ai_tools?: string[] | null
                    q5_confidence_ai_workflow?: number | null
                    q6_skill_level_ai_tools?: number | null
                    q7_difficulty_areas?: string[] | null
                    q8_outputs_meet_standards_confidence?: number | null
                    q9_concerns?: string[] | null
                    q10_help_most?: string | null
                    q11_readiness?: number | null
                    q12_top_goals?: string[] | null
                    q13_success_definition?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_email?: string
                    full_name?: string | null
                    company_name?: string | null
                    company_id?: string | null
                    q1_role?: string | null
                    q1_role_other?: string | null
                    q2_experience_years?: string | null
                    q3_ai_usage?: string | null
                    q4_ai_tools?: string[] | null
                    q5_confidence_ai_workflow?: number | null
                    q6_skill_level_ai_tools?: number | null
                    q7_difficulty_areas?: string[] | null
                    q8_outputs_meet_standards_confidence?: number | null
                    q9_concerns?: string[] | null
                    q10_help_most?: string | null
                    q11_readiness?: number | null
                    q12_top_goals?: string[] | null
                    q13_success_definition?: string | null
                }
            }
            post_completion_survey_responses: {
                Row: {
                    id: string
                    survey_type: string
                    respondent_name: string | null
                    respondent_email: string | null
                    company_name: string | null
                    company_id: string | null
                    answers: Record<string, any>
                    submitted_at: string
                }
                Insert: {
                    id?: string
                    survey_type: string
                    respondent_name?: string | null
                    respondent_email?: string | null
                    company_name?: string | null
                    company_id?: string | null
                    answers?: Record<string, any>
                    submitted_at?: string
                }
                Update: {
                    id?: string
                    survey_type?: string
                    respondent_name?: string | null
                    respondent_email?: string | null
                    company_name?: string | null
                    company_id?: string | null
                    answers?: Record<string, any>
                    submitted_at?: string
                }
            }
            masterclass_proposals: {
                Row: {
                    id: string
                    slug: string
                    prepared_for: string
                    company_name: string
                    prepared_by: string
                    total_investment: number
                    agreement_pdf_url: string | null
                    duration: string
                    delivery_format: string
                    team_capacity: string
                    session_style: string
                    recommended_audience: string[] | null
                    modules: any
                    whats_included: string[] | null
                    expected_outcomes: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    prepared_for: string
                    company_name: string
                    prepared_by?: string
                    total_investment?: number
                    agreement_pdf_url?: string | null
                    duration?: string
                    delivery_format?: string
                    team_capacity?: string
                    session_style?: string
                    recommended_audience?: string[] | null
                    modules?: any
                    whats_included?: string[] | null
                    expected_outcomes?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    prepared_for?: string
                    company_name?: string
                    prepared_by?: string
                    total_investment?: number
                    agreement_pdf_url?: string | null
                    duration?: string
                    delivery_format?: string
                    team_capacity?: string
                    session_style?: string
                    recommended_audience?: string[] | null
                    modules?: any
                    whats_included?: string[] | null
                    expected_outcomes?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            delete_chat_room: {
                Args: {
                    p_room_id: string
                }
                Returns: unknown
            }
            get_unread_counts: {
                Args: {
                    p_user_id: string
                }
                Returns: {
                    room_id: string
                    unread_count: number
                }[]
            }
            get_public_signup_options: {
                Args: Record<string, never>
                Returns: {
                    companies: { id: string; name: string }[]
                    sprintWorkshops: { id: string; name: string }[]
                }
            }
            handle_sprint_workshop_signup: {
                Args: {
                    user_uuid: string
                }
                Returns: unknown
            }
            check_user_email_exists: {
                Args: {
                    email_to_check: string
                }
                Returns: boolean
            }
            save_webinar_lead: {
                Args: {
                    p_name: string
                    p_email: string
                    p_phone?: string | null
                    p_utm_source?: string | null
                    p_utm_medium?: string | null
                    p_utm_campaign?: string | null
                }
                Returns: unknown
            }
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

type Simplify<T> = { [K in keyof T]: T[K] };

type MapTable<T extends { Row: any; Insert: any; Update: any }> = {
    Row: Simplify<T['Row']>;
    Insert: Simplify<T['Insert']>;
    Update: Simplify<T['Update']>;
    Relationships: T extends { Relationships: infer R } ? R : any[];
};

export type Database = {
    public: {
        Tables: {
            [K in keyof RawDatabase['public']['Tables']]: MapTable<RawDatabase['public']['Tables'][K]>;
        };
        Views: RawDatabase['public']['Views'];
        Functions: RawDatabase['public']['Functions'];
        Enums: RawDatabase['public']['Enums'];
        CompositeTypes: RawDatabase['public']['CompositeTypes'];
    };
};

