# 🚀 Quick Start Guide - Zkandar AI Masterclass Hub

**Your step-by-step roadmap to launch**

---

## Phase 0: Setup (You Are Here ✅)

### What We've Completed:
- ✅ Discovery & requirements gathering
- ✅ Data architecture (`gemini.md`)
- ✅ Task plan with 10 phases (`task_plan.md`)
- ✅ Research & findings (`findings.md`)
- ✅ Lovable project prompt (`LOVABLE_PROJECT_PROMPT.md`)
- ✅ Visual wireframes (`WIREFRAMES.md`)

### What's Next:
Go to Lovable.dev and paste the full contents of `LOVABLE_PROJECT_PROMPT.md` to generate the initial codebase.

---

## Step 1: Initialize Project in Lovable (15 mins)

### 1.1 Create Lovable Account
1. Go to https://lovable.dev
2. Sign up with email
3. Create new project: "Zkandar AI Masterclass Hub"

### 1.2 Paste the Prompt
1. Open `LOVABLE_PROJECT_PROMPT.md` (in this directory)
2. Copy **entire contents** (Cmd+A / Ctrl+A)
3. Paste into Lovable's chat interface
4. Type: "Build this project using the specifications above"
5. Wait 5-10 mins for code generation

### 1.3 Review Generated Code
Lovable will create:
- React components (dashboard, chat, sessions, etc.)
- Routing with role-based protection
- Supabase integration setup
- Basic styling (Tailwind)

**Note:** Lovable may not generate 100% complete code. We'll iterate!

---

## Step 2: Set Up Supabase Backend (30 mins)

### 2.1 Create Supabase Project
1. Go to https://supabase.com
2. Create account → "New Project"
3. Name: "zkandar-masterclass"
4. Choose region (closest to UAE)
5. Set strong database password (save it!)

### 2.2 Deploy Database Schema
1. In Supabase dashboard → SQL Editor
2. Copy the SQL schema from `LOVABLE_PROJECT_PROMPT.md` (section: Database Schema)
3. Paste into SQL Editor → Run
4. Verify tables created (should see 10 tables in Table Editor)

### 2.3 Configure Row-Level Security (RLS)
**Critical for data privacy!**

For each table, enable RLS:
```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

Then add policies (examples provided in prompt). Key rules:
- Participants can only see their own company's data
- Admins/Owners see everything
- Chat messages filtered by cohort + company

### 2.4 Create Storage Buckets
1. Supabase → Storage → "New Bucket"
2. Create 3 buckets:
   - `materials` (public)
   - `submissions` (private)
   - `avatars` (public)

### 2.5 Get API Keys
1. Supabase → Settings → API
2. Copy:
   - Project URL (e.g., `https://xyz.supabase.co`)
   - Anon Key (public, safe for client-side)
3. Add to Lovable environment variables (`.env.local`):
   ```
   VITE_SUPABASE_URL=https://xyz.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

---

## Step 3: Test Core Functionality (1 hour)

### 3.1 Authentication Flow
**Test Signup:**
1. Run app locally (Lovable provides live preview)
2. Navigate to signup page
3. Create account: `test@zkandar.ai` / password: `Test1234!`
4. Verify email sent (check Supabase Auth → Users)

**Test Login:**
1. Login with test account
2. Verify redirect to correct dashboard (based on role)

**Test Role-Based Access:**
1. Create 3 test accounts:
   - `admin@zkandar.ai` (role: admin)
   - `exec@design-studio.com` (role: executive)
   - `designer@design-studio.com` (role: participant)
2. Try accessing admin routes as participant → should be blocked

### 3.2 Database Seeding
Create test data manually in Supabase:

**Company:**
```sql
INSERT INTO companies (name, industry, executive_user_id)
VALUES ('DesignStudio Inc.', 'Interior Design', [exec_user_id]);
```

**Cohort:**
```sql
INSERT INTO cohorts (name, start_date, end_date, status)
VALUES ('Jan 2026 Cohort', '2026-01-08', '2026-02-12', 'active');
```

**Session:**
```sql
INSERT INTO sessions (cohort_id, session_number, title, scheduled_date, zoom_recording_url)
VALUES ([cohort_id], 1, 'AI Fundamentals', '2026-01-10 14:00:00', 'https://zoom.us/rec/xyz');
```

### 3.3 Test Real-Time Chat
1. Open app in 2 browser windows (or use Incognito)
2. Login as 2 different participants
3. Navigate to Chat → send message in one window
4. Verify message appears instantly in other window (no refresh)

If messages don't appear live:
- Check Supabase Realtime is enabled (Project Settings → API)
- Verify RLS policies allow reading `chat_messages`

---

## Step 4: Customize UI (2-3 hours)

### 4.1 Apply Futuristic Theme
Lovable may generate basic styling. Enhance it:

**Update Tailwind Config:**
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#4A90FF',
      secondary: '#6B46C1',
      'accent-cyan': '#00D9FF',
      'accent-magenta': '#FF0080',
      'bg-dark': '#0A0E27',
    },
    backgroundImage: {
      'gradient-main': 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
    },
  },
}
```

**Add Glassmorphism Classes:**
```css
/* globals.css */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glow-button {
  box-shadow: 0 0 20px rgba(74, 144, 255, 0.5);
}
```

### 4.2 Add Animations
Install Framer Motion:
```bash
npm install framer-motion
```

Example usage:
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Card content */}
</motion.div>
```

### 4.3 Polish Components
- Add loading skeletons (use `react-loading-skeleton`)
- Implement toast notifications (use `react-hot-toast`)
- Add empty states (friendly illustrations)
- Ensure mobile responsiveness (test on iPhone/Android)

---

## Step 5: Implement Priority Features (Week 1-2)

### Priority 1: Onboarding Survey ⭐⭐⭐
**Why:** Blocks dashboard access, collects critical data

**Implementation:**
1. Create `OnboardingSurvey.tsx` component
2. Define survey questions in Supabase:
   ```sql
   INSERT INTO surveys (name, trigger_type, questions) VALUES (
     'Onboarding Survey',
     'onboarding',
     '[
       {"id": 1, "text": "What is your current role?", "type": "radio", "options": ["Junior Designer", "Senior Designer", "Director"]},
       {"id": 2, "text": "Rate your AI confidence (1-10)", "type": "scale"}
     ]'
   );
   ```
3. On signup, redirect to survey modal (blocking)
4. Calculate AI readiness score (average of scale questions)
5. Update user profile → unlock dashboard

**Test:** New user cannot access dashboard until survey completed

### Priority 2: Session Materials Upload ⭐⭐⭐
**Why:** Admins need to distribute content immediately

**Implementation:**
1. Create `SessionDetail.tsx` admin view
2. Add forms:
   - Paste Zoom recording URL
   - Upload PDFs (Supabase Storage)
   - Paste Google Drive links
3. Store in `sessions.materials` JSON field:
   ```json
   [
     {"type": "video", "url": "https://zoom.us/rec/xyz", "name": "Session 1 Recording"},
     {"type": "pdf", "url": "https://xyz.supabase.co/storage/v1/...", "name": "Prompt E-Book"},
     {"type": "link", "url": "https://drive.google.com/...", "name": "Reference Images"}
   ]
   ```
4. Participant view: Display materials as downloadable list

**Test:** Admin uploads materials → participant sees them instantly

### Priority 3: Real-Time Chat ⭐⭐⭐
**Why:** Replaces Slack (core value prop)

**Implementation:**
1. Create `ChatInterface.tsx` with 3-column layout
2. Set up Supabase Realtime subscription:
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
3. Add message input with file upload
4. Handle attachments (upload to Supabase Storage)

**Test:** 2 users chatting in real-time, files attach correctly

---

## Step 6: Automation Setup (Week 2-3)

### 6.1 Email Notifications
Use Supabase Edge Functions:

**Create Function:**
```bash
supabase functions new send-session-reminder
```

**Function Code (`index.ts`):**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // Get sessions scheduled 24h from now
  const tomorrow = new Date(Date.now() + 24*60*60*1000)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, cohorts(companies(users(*)))')
    .eq('scheduled_date', tomorrow.toISOString())
  
  // Send email to each participant
  for (const session of sessions) {
    // Use SendGrid/Resend API here
  }
  
  return new Response('Reminders sent!')
})
```

**Schedule with Cron:**
```bash
supabase functions schedule send-session-reminder "0 10 * * *" # Daily at 10AM
```

### 6.2 In-App Notifications
Create `notifications` table:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT, -- 'chat_message', 'feedback', etc.
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Trigger on events (e.g., new chat message):
```sql
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message)
  SELECT id, 'chat_message', 'New message', NEW.message
  FROM users WHERE cohort_id = NEW.cohort_id AND id != NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_message_notification
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();
```

---

## Step 7: Testing & QA (Week 3-4)

### 7.1 User Flow Testing
**Checklist:**
- [ ] Executive signs up → invites 5 team members
- [ ] Team members receive invite emails with unique links
- [ ] Participant completes onboarding survey → dashboard unlocks
- [ ] Admin creates session → uploads materials
- [ ] Participant submits assignment → admin reviews + leaves feedback
- [ ] Real-time chat works across 10+ concurrent users
- [ ] Progress tracking updates automatically
- [ ] Certificate unlocks when criteria met

### 7.2 Security Testing
**Critical checks:**
- [ ] Participant cannot access admin routes (test with direct URL)
- [ ] Participant cannot see other companies' data (check SQL queries)
- [ ] File uploads reject files >10MB
- [ ] Passwords hashed (Supabase Auth handles this)
- [ ] RLS policies prevent unauthorized reads/writes

### 7.3 Performance Testing
- [ ] Chat loads 100 messages in <2 seconds
- [ ] Dashboard metrics render in <1 second
- [ ] File uploads complete in <5 seconds (for 5MB file)
- [ ] Mobile responsive (test on iPhone 12, Pixel 5)

---

## Step 8: Deployment (Week 4)

### 8.1 Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Connect Vercel to repo
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy → test live URL

### 8.2 Custom Domain (Optional)
1. Buy domain: `dashboard.zkandar.ai`
2. Add to Vercel: Settings → Domains
3. Update DNS records (Vercel provides instructions)

### 8.3 SSL Certificate
- Vercel auto-provisions SSL (no action needed)

### 8.4 Post-Launch Monitoring
- Set up error tracking (Sentry)
- Monitor Supabase usage (Database → Statistics)
- Track user analytics (PostHog or Google Analytics)

---

## Common Issues & Solutions

### Issue 1: Chat Messages Not Appearing Live
**Cause:** Supabase Realtime not enabled
**Solution:** 
1. Supabase → Database → Replication
2. Enable Realtime for `chat_messages` table

### Issue 2: RLS Blocking Legitimate Queries
**Cause:** Policy too restrictive
**Solution:**
1. Test queries in SQL Editor as different users:
   ```sql
   SET LOCAL "request.jwt.claim.sub" = '[user_id]';
   SELECT * FROM chat_messages;
   ```
2. Debug which policy is failing
3. Adjust policy logic

### Issue 3: File Upload Fails
**Cause:** Storage bucket not public or wrong permissions
**Solution:**
1. Supabase → Storage → Bucket Settings
2. Enable "Public" for `materials` bucket
3. Add RLS policy:
   ```sql
   CREATE POLICY "authenticated_upload" ON storage.objects
   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials');
   ```

### Issue 4: Onboarding Survey Not Blocking Dashboard
**Cause:** Route protection not implemented
**Solution:**
```typescript
// In ProtectedRoute.tsx
if (!user.onboarding_completed) {
  return <Navigate to="/onboarding" />;
}
```

---

## Maintenance & Updates

### Weekly Tasks:
- Review Supabase logs for errors
- Check user feedback (in-app surveys)
- Monitor chat for spam/abuse
- Backup database (Supabase auto-backups daily)

### Monthly Tasks:
- Update dependencies (`npm update`)
- Review analytics (user engagement, completion rates)
- Add new features based on feedback

---

## Support & Resources

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- Lovable Docs: https://docs.lovable.dev
- React Docs: https://react.dev

**Community:**
- Supabase Discord: https://discord.supabase.com
- Lovable Discord: https://discord.gg/lovable

**Need Help?**
- Review `findings.md` for technical risks & solutions
- Check `gemini.md` for architectural decisions
- Refer to `WIREFRAMES.md` for UI guidance

---

## Next Immediate Actions:

1. ✅ Review all documentation files created
2. 🟡 Go to Lovable.dev → paste `LOVABLE_PROJECT_PROMPT.md`
3. 🟡 Create Supabase project → deploy schema
4. 🟡 Test authentication flow
5. 🟡 Start building priority features (onboarding, sessions, chat)

**You're ready to build! 🚀**
