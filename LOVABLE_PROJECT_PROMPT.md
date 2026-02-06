# 🚀 Lovable Project Prompt - Zkandar AI Masterclass Hub

**Copy this entire prompt into Lovable.dev to initialize the project**

---

## Project Overview

Build a **futuristic AI-themed learning management dashboard** for Zkandar AI's masterclass programs. This platform replaces Slack and consolidates client management, session delivery, assignments, real-time chat, and progress tracking into one unified interface.

### Core Purpose
- Architecture/design studios (companies) enroll with 5-50 employees
- Executives invite their teams → Participants complete onboarding surveys
- Admins manage sessions, upload materials, review assignments
- Real-time chat replaces Slack
- Automated progress tracking + certificate generation

---

## Tech Stack Requirements

### Must Use:
- **Frontend:** React 18+ with TypeScript
- **Styling:** Tailwind CSS with custom dark theme
- **Backend:** Supabase (PostgreSQL + Realtime + Auth + Storage)
- **Authentication:** Supabase Auth (email/password + magic links)
- **File Storage:** Supabase Storage (for PDFs, images)
- **Real-Time:** Supabase Realtime (for chat)

### UI Libraries:
- `@radix-ui/react-*` for accessible components (dropdowns, modals, tooltips)
- `lucide-react` for icons
- `recharts` for analytics charts
- `framer-motion` for animations
- `react-hook-form` + `zod` for forms
- `date-fns` for date formatting

---

## Database Schema (Supabase)

Create these tables with Row-Level Security (RLS) policies:

### 1. users (extends auth.users)
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'executive', 'participant')),
  company_id UUID REFERENCES companies(id),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  ai_readiness_score INTEGER DEFAULT 0,
  profile_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admins_view_all" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
```

### 2. companies
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  cohort_id UUID REFERENCES cohorts(id),
  executive_user_id UUID REFERENCES users(id),
  team_size INTEGER DEFAULT 0
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_view_own" ON companies FOR SELECT USING (
  id IN (SELECT company_id FROM users WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
```

### 3. cohorts
```sql
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  miro_board_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cohorts_view_enrolled" ON cohorts FOR SELECT USING (
  id IN (SELECT cohort_id FROM companies WHERE id IN (SELECT company_id FROM users WHERE id = auth.uid())) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
```

### 4. sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  zoom_recording_url TEXT,
  materials JSONB DEFAULT '[]', -- Array of {type, url, name}
  attendance JSONB DEFAULT '[]', -- Array of user_ids
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_view_cohort" ON sessions FOR SELECT USING (
  cohort_id IN (SELECT cohort_id FROM companies WHERE id IN (SELECT company_id FROM users WHERE id = auth.uid())) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
```

### 5. assignments
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  submission_format TEXT DEFAULT 'file' CHECK (submission_format IN ('file', 'link', 'text')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments_view_cohort" ON assignments FOR SELECT USING (
  session_id IN (
    SELECT id FROM sessions WHERE cohort_id IN (
      SELECT cohort_id FROM companies WHERE id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
  ) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
```

### 6. submissions
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content JSONB NOT NULL, -- {file_url, link, or text}
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  admin_feedback TEXT
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_view_own" ON submissions FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "submissions_insert_own" ON submissions FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 7. chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id),
  company_id UUID REFERENCES companies(id), -- Null = cohort-wide, set = company-private
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_view_cohort" ON chat_messages FOR SELECT USING (
  (company_id IS NULL AND cohort_id IN (SELECT cohort_id FROM companies WHERE id IN (SELECT company_id FROM users WHERE id = auth.uid()))) OR
  (company_id = (SELECT company_id FROM users WHERE id = auth.uid())) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "chat_insert_own" ON chat_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
```

### 8. surveys
```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('onboarding', 'mid_program', 'post_program')),
  questions JSONB NOT NULL, -- Array of {id, text, type, options}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. survey_responses
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- {question_id: answer}
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_responses_view_own" ON survey_responses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "survey_responses_insert_own" ON survey_responses FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 10. invitations
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

---

## UI Design System

### Zkandar AI Brand Colors (MUST USE)
```css
:root {
  /* Backgrounds */
  --bg-primary: #000000; /* Pure Black */
  --bg-elevated: #0A0A0A;
  --bg-card: #111111;
  
  /* Brand Colors */
  --lime: #D0FF71; /* Primary - CTAs, highlights */
  --lime-hsl: 75, 100%, 72%;
  --green: #5A9F2E; /* Secondary - gradients, depth */
  --green-hsl: 91, 55%, 40%;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-muted: #666666;
  
  /* UI */
  --border: hsl(0, 0%, 15%);
  --selection: rgba(208, 255, 113, 0.3);
  --glow: rgba(208, 255, 113, 0.15);
  
  /* Border Radius */
  --radius: 1.5rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
}
```

### Typography (MUST USE)
**Import Required Fonts:**
```css
@font-face {
  font-family: 'Base Neue Trial';
  src: url('/fonts/BaseNeueTrial-Black.woff2') format('woff2');
  font-weight: 900;
  font-display: swap;
}

@font-face {
  font-family: 'FK Grotesk Neue Trial';
  src: url('/fonts/FKGroteskNeueTrial-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

**Font Usage:**
- **Headings:** `font-family: 'Base Neue Trial', sans-serif`
  - Weights: Black (900), Bold (700)
  - Letter-spacing: 0.01em (normal), 0.05em (uppercase)
- **Body:** `font-family: 'FK Grotesk Neue Trial', system-ui, sans-serif`
  - Weights: Regular (400), Medium (500), Bold (700)
  - Letter-spacing: 0.01em

**Typography Scale:**
```css
/* Hero */
.hero-text { 
  font-size: clamp(2rem, 6vw, 4.5rem);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1;
}

/* Display */
.display { font-size: 4.5rem; line-height: 1; }

/* Micro Labels */
.micro { 
  font-size: 0.6875rem; 
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
```

### Design Principles
1. **Dark-First:** Pure black backgrounds (#000000) with subtle 3% noise texture overlay
2. **Lime Accents:** Use lime (#D0FF71) sparingly for CTAs, highlights, and key UI moments
3. **Depth Through Layering:** Elevated surfaces (#0A0A0A), cards (#111111), gradients (lime to green)
4. **Asymmetric Layouts:** Intentional non-centered compositions that create visual tension
5. **Simplicity Over Animation:** Subtle animations that enhance, never distract
6. **Generous Whitespace:** Premium aesthetic through breathing room
7. **Mobile-First Responsive:** Scale typography and layouts from mobile up

---

## Component Structure

### Layout Components

#### 1. AppShell (`/components/layout/AppShell.tsx`)
- Responsive layout with sidebar + main content
- Conditionally render based on user role
- Props: `children`, `userRole`

#### 2. Sidebar (`/components/layout/Sidebar.tsx`)
- Fixed left sidebar (256px width on desktop, drawer on mobile)
- Navigation items based on role:
  - **Owner/Admin:** Dashboard, Cohorts, Sessions, Assignments, Chat, Analytics, Settings
  - **Executive:** Dashboard, Sessions, Chat, Team
  - **Participant:** Dashboard, Sessions, Assignments, Chat, Profile
- Active state highlighting (primary blue glow)

#### 3. Navbar (`/components/layout/Navbar.tsx`)
- Top bar: Search, Notifications bell (badge counter), User profile dropdown
- Logout button in dropdown

### Dashboard Components

#### 4. OwnerDashboard (`/pages/OwnerDashboard.tsx`)
- Hero: Welcome banner + quick stats (Total Cohorts, Active Participants, Completion Rate)
- Grid of metric cards:
  - Revenue (if billing enabled)
  - Average AI Readiness Score
  - Recent Activity Feed
- Action buttons: "Create Cohort", "Invite Company"

#### 5. ParticipantDashboard (`/pages/ParticipantDashboard.tsx`)
- Welcome message: "Hey [Name], here's your progress"
- Session Timeline (vertical, with checkmarks for completed)
- Upcoming Assignments (due date highlighted)
- Progress Donut Chart (sessions + assignments completed)
- Chat Preview (recent messages)

#### 6. MetricsCard (`/components/dashboard/MetricsCard.tsx`)
- Props: `icon`, `label`, `value`, `trend` (optional)
- Glassmorphic card with icon, big number, and trend indicator

### Session Components

#### 7. SessionCard (`/components/sessions/SessionCard.tsx`)
- Displays: Thumbnail, title, date, status badge, "View Materials" button
- Click → opens SessionDetail modal

#### 8. SessionDetail (`/components/sessions/SessionDetail.tsx`)
- Embedded Zoom recording (iframe or video player)
- Materials list (PDFs, Google Drive links)
- Attendance roster (avatars)
- Assignment section (if linked)

#### 9. MaterialsList (`/components/sessions/MaterialsList.tsx`)
- Grid of downloadable materials
- Icons based on file type (PDF, video, link)

### Assignment Components

#### 10. AssignmentCard (`/components/assignments/AssignmentCard.tsx`)
- Title, due date, submission status
- "Submit" button (if not submitted)
- "View Feedback" button (if reviewed)

#### 11. SubmissionForm (`/components/assignments/SubmissionForm.tsx`)
- Conditional inputs based on `submission_format`:
  - File: Drag-and-drop uploader (Supabase Storage)
  - Link: Text input
  - Text: Textarea
- Submit button with loading state

### Chat Components

#### 12. ChatInterface (`/components/chat/ChatInterface.tsx`)
- 3-column layout:
  - Left: Channel list (cohort, company, DMs)
  - Center: Message thread
  - Right: Participant list (online status)
- Use Supabase Realtime subscription for live updates

#### 13. MessageBubble (`/components/chat/MessageBubble.tsx`)
- User avatar + message text + timestamp
- Attachment preview (images inline, files as download links)
- Own messages aligned right (blue), others left (gray)

#### 14. MessageInput (`/components/chat/MessageInput.tsx`)
- Textarea with auto-resize
- Attachment button (file picker)
- Send button (icon)

### Onboarding Components

#### 15. OnboardingSurvey (`/components/onboarding/OnboardingSurvey.tsx`)
- Multi-step form (5 questions)
- Progress indicator (step 1/5)
- Question types: Text, Radio, Checkbox, Scale (1-10)
- Calculate AI readiness score on submit
- Block dashboard access until completed

#### 16. InviteTeam (`/components/onboarding/InviteTeam.tsx`)
- For executives: Email input + "Send Invite" button
- Shows list of pending invites (with "Resend" option)
- Generates unique token per invite

### Analytics Components

#### 17. AnalyticsDashboard (`/pages/AnalyticsDashboard.tsx`)
- Cohort selector dropdown
- Charts:
  - Completion rate (bar chart)
  - AI readiness score trend (line chart)
  - Tool adoption (pie chart from survey data)
  - Engagement heatmap (chat activity by day)

#### 18. ProgressBar (`/components/shared/ProgressBar.tsx`)
- Animated progress bar with glow effect
- Props: `current`, `total`, `label`

---

## Key User Flows (Step-by-Step)

### Flow 1: Executive Invites Team
1. Executive signs up → creates account (role = 'executive')
2. Lands on "Invite Your Team" screen
3. Enters team member emails (one per line or CSV upload)
4. System generates unique invite tokens → sends emails
5. Executive sees pending invites list in dashboard

### Flow 2: Participant Onboarding
1. Team member clicks invite link → lands on signup page (pre-filled email)
2. Creates password → account created (role = 'participant')
3. Redirected to Onboarding Survey (blocking modal)
4. Completes 5 questions → AI readiness score calculated
5. Unlocks dashboard access

### Flow 3: Admin Creates Session
1. Admin navigates to "Sessions" → clicks "Create Session"
2. Form: Cohort selector, session number, title, date, Zoom link
3. After session, admin edits session → pastes recording URL, uploads PDFs
4. Clicks "Notify Participants" → system sends email

### Flow 4: Participant Submits Assignment
1. Participant navigates to "Assignments" → sees pending assignments
2. Clicks assignment → opens submission form
3. Uploads file or pastes link → clicks "Submit"
4. Sees "Submitted" badge → admin receives notification

### Flow 5: Real-Time Chat
1. Participant navigates to "Chat" → sees cohort channel
2. Types message → clicks send
3. Message appears instantly (Supabase Realtime)
4. Other participants see message without refresh

---

## Automation & Notifications

### Email Triggers (Use Supabase Edge Functions)
1. **Session Reminder:** 24h before → send email with Zoom link
2. **Materials Posted:** When admin uploads → notify participants
3. **Assignment Due Soon:** 48h before → reminder email
4. **Feedback Received:** When admin leaves feedback → notify participant
5. **Certificate Earned:** When criteria met → congratulations email

### In-App Notifications
- Notification bell in navbar (badge counter)
- Dropdown shows recent notifications:
  - "New message in #cohort-jan-2026"
  - "Admin left feedback on your submission"
  - "Session 4 materials now available"
- Mark as read on click

---

## Authentication Flow

### Signup
- Email + password
- If invited, token validates → auto-links to company + cohort
- Role assigned (executive if first from company, else participant)

### Login
- Email + password OR magic link
- Redirect based on role:
  - Owner/Admin → OwnerDashboard
  - Executive → ExecutiveDashboard
  - Participant → ParticipantDashboard (or OnboardingSurvey if not completed)

### Role-Based Route Protection
Use custom hook: `useRequireAuth(allowedRoles: string[])`
- If user role not in allowedRoles → redirect to unauthorized page

---

## File Upload Strategy

### Supabase Storage Buckets
1. **materials:** Session materials (PDFs, images)
2. **submissions:** Assignment uploads
3. **avatars:** User profile pictures

### Upload Flow (Example)
```typescript
const { data, error } = await supabase.storage
  .from('submissions')
  .upload(`${userId}/${assignmentId}/${file.name}`, file, {
    cacheControl: '3600',
    upsert: false
  });

if (data) {
  const publicUrl = supabase.storage.from('submissions').getPublicUrl(data.path).data.publicUrl;
  // Save publicUrl to submissions table
}
```

---

## Real-Time Chat Implementation

### Supabase Realtime Setup
```typescript
const channel = supabase
  .channel(`cohort:${cohortId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `cohort_id=eq.${cohortId}`
  }, (payload) => {
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
```

### Sending Messages
```typescript
const sendMessage = async (text: string) => {
  await supabase.from('chat_messages').insert({
    cohort_id: currentCohortId,
    sender_id: userId,
    message: text
  });
};
```

---

## Progress Tracking Logic

### Calculate Participant Progress
```typescript
const calculateProgress = (userId: string) => {
  // Sessions attended
  const sessionsAttended = await supabase
    .from('sessions')
    .select('attendance')
    .contains('attendance', [userId]);
  
  // Assignments completed
  const submissionsCount = await supabase
    .from('submissions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  // Total possible
  const totalSessions = 5;
  const totalAssignments = 4;
  
  return {
    sessionsAttended: sessionsAttended.length,
    totalSessions,
    assignmentsCompleted: submissionsCount.count,
    totalAssignments,
    overallProgress: ((sessionsAttended.length / totalSessions) + (submissionsCount.count / totalAssignments)) / 2 * 100
  };
};
```

### Certificate Eligibility
```typescript
const isEligibleForCertificate = (progress: Progress, surveys: SurveyResponses) => {
  return (
    progress.sessionsAttended >= 4 && // 80% attendance
    progress.assignmentsCompleted >= 3 && // 75% assignments
    surveys.post_program_completed === true
  );
};
```

---

## Mobile Responsiveness

- **Desktop (>1024px):** Full sidebar + 3-column chat layout
- **Tablet (768px-1024px):** Collapsible sidebar + 2-column chat
- **Mobile (<768px):** Bottom nav bar + drawer sidebar + 1-column chat

Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`

---

## Accessibility

- All interactive elements keyboard-navigable
- ARIA labels on icon-only buttons
- Color contrast ratio ≥4.5:1 (use white text on dark backgrounds)
- Focus states visible (blue outline)

---

## Performance Optimizations

1. **Lazy Loading:** Use React.lazy() for non-critical routes
2. **Virtualization:** Use `react-window` for long chat message lists
3. **Image Optimization:** Compress uploads before sending to Supabase
4. **Debounced Search:** Delay search queries by 300ms
5. **Optimistic UI:** Show chat messages immediately (before DB confirmation)

---

## Error Handling

- Toast notifications for errors (use `react-hot-toast`)
- Fallback UI for failed uploads (retry button)
- Empty states for no data (friendly illustrations)

---

## Deployment Checklist

- [ ] Supabase project created (with database schema deployed)
- [ ] Environment variables set (Supabase URL + Anon Key)
- [ ] RLS policies tested
- [ ] Email templates configured (Supabase Auth)
- [ ] Storage buckets created
- [ ] Edge Functions deployed (for automation)
- [ ] Domain connected (custom domain)
- [ ] SSL certificate enabled

---

## Next Steps After Lovable Generates Code

1. Test authentication flow (signup → login → role-based redirect)
2. Seed database with test data (1 cohort, 5 participants)
3. Test real-time chat (open 2 browser windows, send messages)
4. Test file upload (assignment submission)
5. Verify RLS policies (participant cannot see other companies' data)

---

**Copy the above prompt into Lovable.dev and let it generate the initial codebase. Then we'll iterate and refine!**
