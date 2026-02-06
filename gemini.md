# 🚀 Zkandar AI Masterclass Hub - Project Constitution

**Last Updated:** 2026-02-06  
**Status:** Blueprint Phase  
**Tech Stack:** React + Tailwind + Supabase + Lovable

---

## 🎯 North Star

**Replace Slack** and consolidate all masterclass operations into one unified dashboard that:
- Manages companies and individual participants
- Tracks progress, assignments, and AI tool adoption
- Enables real-time communication (chat replacement for Slack)
- Automates session delivery, reminders, and certificates
- Provides analytics on participant readiness and productivity gains

---

## 👥 User Roles & Permissions

### Owner
- Full system access
- Billing dashboard (revenue, payment history)
- All admin capabilities

### Admin
- Manage cohorts, sessions, participants
- Upload materials, paste Zoom links
- View analytics across all cohorts
- Moderate chat channels
- Review assignment submissions

### Executive (Company Admin)
- Invite team members from their company
- View company-wide progress dashboard
- Access all sessions/materials for their cohort
- Chat with Zkandar AI team and peers

### Participant (Team Member)
- Complete onboarding survey (AI readiness assessment)
- Access session materials, recordings, Miro boards
- Submit assignments
- Chat with cohort + instructors
- Track personal progress + earn certificate

---

## 📊 Data Schema

### Companies
```json
{
  "id": "uuid",
  "name": "string",
  "industry": "architecture | interior_design | landscape",
  "enrollment_date": "timestamp",
  "cohort_id": "uuid (FK)",
  "executive_user_id": "uuid (FK)",
  "billing_status": "paid | pending | installment",
  "team_size": "integer"
}
```

### Users
```json
{
  "id": "uuid",
  "email": "string (unique)",
  "full_name": "string",
  "role": "owner | admin | executive | participant",
  "company_id": "uuid (FK) | null",
  "onboarding_completed": "boolean",
  "ai_readiness_score": "integer (0-100)",
  "profile_data": "jsonb (survey responses)",
  "created_at": "timestamp"
}
```

### Cohorts
```json
{
  "id": "uuid",
  "name": "string (e.g., 'Jan 2026 Cohort')",
  "start_date": "date",
  "end_date": "date",
  "status": "upcoming | active | completed",
  "slack_channel_id": "string (deprecated)",
  "miro_board_url": "string"
}
```

### Sessions
```json
{
  "id": "uuid",
  "cohort_id": "uuid (FK)",
  "session_number": "integer (1-5)",
  "title": "string",
  "scheduled_date": "timestamp",
  "zoom_recording_url": "string",
  "materials": "jsonb array [{type, url, name}]",
  "attendance": "jsonb array [user_ids who attended]",
  "status": "scheduled | completed"
}
```

### Assignments
```json
{
  "id": "uuid",
  "session_id": "uuid (FK)",
  "title": "string",
  "description": "text",
  "due_date": "timestamp",
  "submission_format": "file_upload | link | text"
}
```

### Submissions
```json
{
  "id": "uuid",
  "assignment_id": "uuid (FK)",
  "user_id": "uuid (FK)",
  "content": "jsonb (file URLs, links, or text)",
  "submitted_at": "timestamp",
  "status": "pending | reviewed",
  "admin_feedback": "text | null"
}
```

### ChatMessages
```json
{
  "id": "uuid",
  "cohort_id": "uuid (FK)",
  "sender_id": "uuid (FK)",
  "message": "text",
  "attachments": "jsonb array | null",
  "timestamp": "timestamp",
  "is_pinned": "boolean"
}
```

### Surveys
```json
{
  "id": "uuid",
  "name": "string (e.g., 'Onboarding Survey', 'Mid-Program Check')",
  "trigger_type": "onboarding | mid_program | post_program",
  "questions": "jsonb array [{id, text, type, options}]",
  "is_active": "boolean"
}
```

### SurveyResponses
```json
{
  "id": "uuid",
  "survey_id": "uuid (FK)",
  "user_id": "uuid (FK)",
  "responses": "jsonb {question_id: answer}",
  "completed_at": "timestamp"
}
```

### ToolUsageTracking
```json
{
  "id": "uuid",
  "user_id": "uuid (FK)",
  "tool_name": "midjourney | craya | nanobanana | etc",
  "self_reported_usage": "never | rarely | weekly | daily",
  "productivity_gain": "integer (0-10 scale)",
  "last_updated": "timestamp"
}
```

---

## 🏗️ Key Features & Workflows

### 1. Executive Onboarding Flow
1. Executive creates account → auto-assigned to their company
2. Sees "Invite Team Members" screen
3. Sends email invites with unique signup links
4. Tracks pending invites in dashboard

### 2. Participant Onboarding Flow
1. Receives invite email → clicks link
2. Creates account → auto-linked to company + cohort
3. **Mandatory Onboarding Survey:**
   - Current role & responsibilities
   - AI tools currently used (if any)
   - Design software proficiency (Photoshop, SketchUp, etc.)
   - Goals for the masterclass
   - Self-rated AI confidence (1-10 scale)
4. Survey generates **AI Readiness Score** (stored in profile)
5. Unlocks dashboard access

### 3. Session Management (Admin/Owner)
1. Create session → set date, title, Zoom link (placeholder)
2. 24h before session → auto-send reminder emails to cohort
3. After session:
   - Admin pastes Zoom recording URL
   - Uploads materials (PDFs) or links (Google Drive folder)
   - System notifies participants: "Session 2 materials now available"
4. Attendance marked manually or via Zoom API integration (future)

### 4. Assignment Workflow
1. Admin creates assignment linked to a session
2. Sets due date + submission format (file/link/text)
3. Participants submit via dashboard
4. Admin reviews → leaves feedback
5. Late submissions flagged in analytics

### 5. Real-Time Chat (Slack Replacement)
- **Cohort-Wide Channel:** All participants + instructors
- **Company Channels:** Private space for each company's team
- **Direct Messages:** 1-on-1 between participants/admins
- Features:
  - File attachments (images, PDFs)
  - Pin important messages
  - Searchable history
  - @mentions (optional)

### 6. Progress Tracking & Analytics

**For Admins:**
- Cohort completion rate (%)
- Assignment submission rates
- AI readiness score distribution (pre → post)
- Tool adoption metrics (from surveys)
- Engagement heatmap (chat activity, material downloads)

**For Participants:**
- Personal dashboard showing:
  - Sessions attended: 3/5
  - Assignments completed: 2/4
  - Progress bar toward certificate
  - Upcoming deadlines

### 7. Tool Adoption Surveys (Mid & Post-Program)
- **Mid-Program (Week 3):**
  - "Which tools have you tried since Week 1?"
  - "How often are you using Midjourney in your work?"
  - Rate difficulty (1-5)
  
- **Post-Program (Week 6):**
  - "Estimate productivity increase (0-100%)"
  - "Which tool became your favorite?"
  - "Are you using AI in client pitches now?" (Yes/No)

### 8. Certificate Generation
**Criteria to unlock certificate:**
- Attended 4/5 sessions (80% minimum)
- Submitted 3/4 assignments
- Completed post-program survey

**Certificate includes:**
- Participant name
- Company name
- Cohort dates
- Zkandar AI signature + logo
- Unique verification code

---

## 🤖 Automation Rules (The "Autopilot" Logic)

### Email Triggers
| Event | Timing | Recipients | Content |
|-------|--------|------------|---------|
| Cohort starts | Day 0 | All participants | Welcome email + dashboard link |
| Session reminder | 24h before | Cohort | Zoom link + prep materials |
| New materials posted | Immediately | Cohort | "Session 3 recording is now available" |
| Assignment due soon | 48h before deadline | Incomplete submissions | Reminder with submission link |
| Assignment overdue | Day after deadline | Admin only | Alert: "5 participants haven't submitted" |
| Certificate earned | Upon completion | Participant | Congratulations email + download link |

### In-Dashboard Notifications
- New chat message (badge counter)
- Admin feedback on submission (popup)
- Upcoming session in 2 hours (banner)
- Survey required to unlock next session (blocking modal)

---

## 🎨 UI/UX Guidelines (Zkandar AI Branding)

### Design System - Official Zkandar AI Brand

#### Color Palette (MUST USE)
- **Background:**
  - Primary: Pure Black (#000000)
  - Elevated: #0A0A0A
  - Card: #111111
  
- **Brand Colors:**
  - **Lime (Primary):** #D0FF71 / hsl(75, 100%, 72%) - CTAs, highlights, badges
  - **Green (Secondary):** #5A9F2E / hsl(91, 55%, 40%) - Gradients, depth, hover states
  
- **Text:**
  - Foreground: White (#FFFFFF)
  - Muted: #666666 / hsl(0, 0%, 40%)
  
- **UI Elements:**
  - Border: hsl(0, 0%, 15%)
  - Selection: Lime at 30% opacity

#### Typography (MUST USE)
- **Headings (h1-h6):** 
  - Font: "Base Neue Trial"
  - Weights: Black (900), Bold (700), Expanded (500)
  - Letter-spacing: 0.01em (headings), 0.05em (uppercase)
  - Hero: clamp(2rem, 6vw, 4.5rem), uppercase, tight tracking
  
- **Body Text & UI:**
  - Font: "FK Grotesk Neue Trial"
  - Weights: Regular (400), Medium (500), Bold (700), Black (900)
  - Letter-spacing: 0.01em (body), 0.02em (nav/buttons)
  
- **Scale:**
  - Hero: clamp(2rem, 6vw, 4.5rem)
  - Display: 4.5rem (72px), line-height 1
  - Micro labels: 0.6875rem (11px), uppercase, letter-spacing 0.2em

#### Border Radius
- Default: 1.5rem (24px)
- XL: 1.5rem
- 2XL: 2rem (32px)

#### Effects & Textures
- **Noise Overlay:** SVG fractal noise at 3% opacity, fixed full-screen
- **Gradient Orb:** Radial gradient (lime to green to transparent), blur(80px), animated float
- **Glow Effects:** rgba(208, 255, 113, 0.15) for atmospheric effects
- **Selection Highlight:** Lime at 30% opacity

#### Design Principles
- Dark-first: Pure black backgrounds with subtle noise texture
- Asymmetric layouts: Intentional non-centered, tension-creating compositions
- Simplicity over animation: Animations enhance, never distract
- Mobile-first responsive: Scale typography and layouts from mobile up
- Premium aesthetic: Custom-built feel, generous whitespace, depth through layering

#### Components
- Cards with subtle noise texture overlay
- Animated progress bars with lime glow
- Floating action buttons with lime accent
- Gradient backgrounds (lime to green)

### Key Screens

**Owner/Admin Dashboard:**
- Hero section: Active cohorts carousel
- Metrics cards: Total participants, completion rate, avg. AI readiness score
- Recent activity feed (chat, submissions, new signups)
- Quick actions: Create session, invite company, view analytics

**Participant Dashboard:**
- Welcome banner: "Hey [Name], here's your weekly overview"
- Session timeline (vertical, with checkmarks for completed)
- Assignments widget (due soon highlighted)
- Progress donut chart (sessions + assignments)
- Chat preview (recent messages)

**Session Detail Page:**
- Embedded Zoom recording (iframe or video player)
- Material cards (downloadable PDFs, Miro board links)
- Attendance roster (avatars)
- Assignment section (if linked)

**Chat Interface:**
- Left sidebar: Channel list (cohort, company, DMs)
- Center: Message thread (WhatsApp-style bubbles)
- Right sidebar: Participant list (online status dots)

---

## 🔌 External Integrations

### Attio CRM (Read-Only)
- **Purpose:** Sync company data when executive signs up
- **API Endpoints:**
  - `GET /companies` → Fetch company details
  - `GET /contacts` → Match email to existing records
- **Flow:** When executive creates account, lookup company in Attio → auto-populate name/industry

### Google Drive (Hybrid Approach)
- **Option 1 (Recommended):** Admins paste Google Drive folder links → embedded in dashboard
- **Option 2:** Direct upload to Supabase storage → fallback for PDFs <10MB

### Miro Boards
- **Integration:** Embed Miro board URLs as iframes in session pages
- **Future:** Track board opens via Miro API (optional analytics)

### Zoom API (Phase 2)
- **Purpose:** Auto-fetch recording URLs after sessions end
- **Endpoint:** `GET /meetings/{meetingId}/recordings`
- **Note:** Manual paste is Phase 1 MVP

---

## 🚨 Critical "Do NOT" Rules

1. **Never auto-delete user data** (chat, submissions, profiles) without admin confirmation
2. **Never expose company data** to participants from other companies (strict isolation)
3. **Never send notifications** for chat messages after 10 PM user local time (respect boundaries)
4. **Never allow certificate download** before completion criteria met (no exceptions)
5. **Never display billing data** to anyone except Owner role

---

## 📂 File Structure (Lovable Project)

```
/src
├── components/
│   ├── dashboard/
│   │   ├── OwnerDashboard.tsx
│   │   ├── ParticipantDashboard.tsx
│   │   ├── MetricsCard.tsx
│   │   └── ProgressChart.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChannelList.tsx
│   ├── sessions/
│   │   ├── SessionCard.tsx
│   │   ├── MaterialsList.tsx
│   │   └── AttendanceTracker.tsx
│   ├── assignments/
│   │   ├── AssignmentForm.tsx
│   │   ├── SubmissionUpload.tsx
│   │   └── FeedbackPanel.tsx
│   ├── onboarding/
│   │   ├── SurveyForm.tsx
│   │   ├── InviteTeam.tsx
│   │   └── WelcomeScreen.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── NotificationBell.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Sessions.tsx
│   ├── Assignments.tsx
│   ├── Chat.tsx
│   ├── Analytics.tsx
│   └── Profile.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── useSupabase.ts
├── lib/
│   ├── supabase.ts
│   ├── attio.ts
│   └── email.ts
└── styles/
    └── globals.css (Tailwind + custom animations)
```

---

## 🧪 Testing Checklist (Before Launch)

- [ ] Executive can invite 5 team members → all receive unique links
- [ ] Participant completes onboarding survey → AI readiness score calculated
- [ ] Admin uploads session materials → participants receive email notification
- [ ] Chat messages persist across page refreshes
- [ ] Assignment submission with file upload works
- [ ] Certificate generates only when criteria met
- [ ] Role permissions enforced (participant cannot access admin routes)
- [ ] Google Drive links embed correctly
- [ ] Responsive design on mobile (primary use case?)

---

## 🔄 Maintenance Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-06 | Initial constitution | Project kickoff |

---

**End of Constitution. All code must comply with this document.**
