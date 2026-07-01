# 📋 Zkandar AI Masterclass Hub - Task Plan

**Project Start:** 2026-02-06  
**Target MVP:** 3-4 weeks  
**Status:** Phase 0 - Blueprint ✅

---

## 🎯 Project Phases

### Phase 0: Blueprint (CURRENT) ✅
- [x] Discovery questions completed
- [x] Data schema defined in gemini.md
- [x] User flows mapped
- [x] UI/UX guidelines established
- [x] Role permissions documented
- [x] Lovable project initialization
- [ ] Supabase schema deployed

---

### Phase 1: Foundation (Week 1)

#### 1.1 Database Setup
- [ ] Create Supabase project
- [ ] Deploy database schema (tables, RLS policies)
- [ ] Set up authentication (email + magic links)
- [ ] Create role-based access policies
- [ ] Test data seeding (1 company, 5 users, 1 cohort)

#### 1.2 Core Authentication
- [x] Login/signup flow
- [x] Role detection (owner/admin/executive/participant)
- [x] Route protection by role
- [ ] Session persistence

#### 1.3 Basic UI Shell
- [x] Sidebar navigation (role-aware)
- [x] Top navbar (user profile, notifications bell)
- [x] Responsive layout (desktop-first, mobile-friendly)
- [x] Dark theme + futuristic styling

**Deliverable:** Users can sign up, log in, and see role-specific empty dashboards

---

### Phase 2: Onboarding & User Management (Week 1-2)

#### 2.1 Executive Flow
- [ ] Company creation/selection (integrate Attio API)
- [ ] Invite team members screen
- [ ] Email invite system (with unique signup tokens)
- [ ] Track pending invites

#### 2.2 Participant Onboarding
- [ ] Survey builder (admin can create surveys)
- [ ] Onboarding survey form (multi-step)
- [ ] AI readiness score calculation
- [ ] Profile completion → unlock dashboard

#### 2.3 User Management (Admin)
- [ ] View all companies + participants
- [ ] Edit user roles
- [ ] Deactivate users
- [ ] Resend invites

**Deliverable:** Executives can invite teams, participants complete onboarding surveys

---

### Phase 3: Session & Materials Management (Week 2)

#### 3.1 Cohort Creation (Admin)
- [ ] Create cohort form (name, dates, companies)
- [ ] Assign participants to cohorts
- [ ] Cohort detail page

#### 3.2 Session Management
- [ ] Create session (linked to cohort)
- [ ] Paste Zoom recording URL
- [ ] Upload materials (files or Google Drive links)
- [ ] Mark attendance manually
- [ ] Session detail page (participant view)

#### 3.3 Materials Library
- [ ] Grid/list view of all sessions
- [ ] Download PDFs
- [ ] Embedded video player for Zoom recordings
- [ ] Embedded Miro boards (iframe)

**Deliverable:** Admins can create sessions, participants can access materials

---

### Phase 4: Assignments & Submissions (Week 2-3)

#### 4.1 Assignment Creation (Admin)
- [ ] Create assignment form (title, description, due date)
- [ ] Link to session
- [ ] Submission format selector (file/link/text)

#### 4.2 Submission Workflow (Participant)
- [ ] View assignments dashboard (pending/completed)
- [ ] Upload files or paste links
- [ ] Submit assignment
- [ ] View admin feedback

#### 4.3 Review System (Admin)
- [ ] View all submissions
- [ ] Filter by cohort/session/user
- [ ] Leave feedback
- [ ] Mark as reviewed

**Deliverable:** Full assignment submission + review cycle

---

### Phase 5: Real-Time Chat (Week 3) 🔥 Critical Feature

#### 5.1 Chat Infrastructure
- [ ] Supabase Realtime setup for ChatMessages table
- [ ] Create cohort-wide channels (auto-generated)
- [ ] Create company-private channels
- [ ] Direct message threads

#### 5.2 Chat UI
- [ ] Channel list sidebar
- [ ] Message thread (WhatsApp-style bubbles)
- [ ] Send message (text + file attachments)
- [ ] Online status indicators
- [ ] Unread message badges

#### 5.3 Chat Features
- [ ] Pin important messages
- [ ] Search message history
- [ ] @mention notifications (optional)
- [ ] File preview (images, PDFs)

**Deliverable:** Participants can chat in real-time, replacing Slack

---

### Phase 6: Progress Tracking & Analytics (Week 3-4)

#### 6.1 Participant Progress
- [ ] Progress dashboard (sessions attended, assignments completed)
- [ ] Progress bar toward certificate
- [ ] Upcoming deadlines widget
- [ ] Personal analytics (time spent, AI readiness growth)

#### 6.2 Admin Analytics
- [ ] Cohort overview dashboard
- [ ] Completion rates (sessions, assignments)
- [ ] AI readiness score trends (pre → post)
- [ ] Tool adoption metrics (from surveys)
- [ ] Engagement heatmap (chat activity)

#### 6.3 Tool Usage Surveys
- [ ] Mid-program survey (Week 3)
- [ ] Post-program survey (Week 6)
- [ ] Self-reported tool usage tracking
- [ ] Productivity gain metrics

**Deliverable:** Admins see full analytics, participants track personal progress

---

### Phase 7: Automation & Notifications (Week 4)

#### 7.1 Email Notifications
- [ ] Session reminder (24h before)
- [ ] New materials available
- [ ] Assignment due soon (48h)
- [ ] Assignment overdue (admin alert)
- [ ] Certificate earned

#### 7.2 In-App Notifications
- [ ] Notification center (bell icon)
- [ ] Toast messages (new chat, feedback received)
- [ ] Banner alerts (upcoming session in 2h)

#### 7.3 Scheduled Jobs
- [ ] Daily: Check for upcoming sessions → send reminders
- [ ] Daily: Flag overdue assignments
- [ ] Weekly: Generate engagement reports

**Deliverable:** Users receive timely notifications, reducing manual follow-ups

---

### Phase 8: Certificates & Completion (Week 4)

#### 8.1 Certificate Logic
- [ ] Check completion criteria (4/5 sessions, 3/4 assignments, post-survey)
- [ ] Auto-unlock certificate
- [ ] Generate PDF certificate (with company logo, signature)
- [ ] Unique verification code

#### 8.2 Certificate UI
- [ ] Certificate preview in dashboard
- [ ] Download button
- [ ] Share on LinkedIn (optional)

**Deliverable:** Participants receive certificates upon completion

---

### Phase 9: Billing Dashboard (Owner-Only) (Week 4+)

#### 9.1 Revenue Tracking
- [ ] Total revenue dashboard
- [ ] Payment history (per company)
- [ ] Outstanding invoices (if installment)

#### 9.2 Financial Reports
- [ ] Export CSV (companies, payments, dates)
- [ ] Monthly revenue chart

**Deliverable:** Owner can track billing (deprioritized for MVP)

---

### Phase 10: Polish & Testing (Week 4)

#### 10.1 UI Refinements
- [ ] Animation polish (progress bars, transitions)
- [ ] Loading states (skeletons, spinners)
- [ ] Error handling (friendly messages)
- [ ] Responsive mobile tweaks

#### 10.2 Testing
- [ ] End-to-end user flow tests (executive → participant → admin)
- [ ] Role permission tests (cannot access unauthorized routes)
- [ ] Chat stress test (100 messages, multiple users)
- [ ] File upload limits (max 10MB)

#### 10.3 Documentation
- [ ] Admin user guide (PDF)
- [ ] Participant quick start (video tutorial)
- [ ] API documentation (if needed)

**Deliverable:** Production-ready dashboard

---

## 🚀 MVP Feature Priority (Launch Checklist)

**Must-Have (P0):**
- [x] Authentication (login/signup)
- [x] Onboarding survey
- [ ] Session materials upload
- [ ] Real-time chat
- [ ] Assignment submission
- [ ] Progress tracking

**Should-Have (P1):**
- [ ] Email notifications
- [ ] Certificate generation
- [ ] Admin analytics
- [ ] Tool usage surveys

**Nice-to-Have (P2):**
- [ ] Billing dashboard
- [ ] Zoom API integration (auto-fetch recordings)
- [ ] Miro board activity tracking
- [ ] @mentions in chat

---

## ⏱️ Time Estimates

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 0. Blueprint | 1 day | None |
| 1. Foundation | 3 days | Supabase setup |
| 2. Onboarding | 4 days | Phase 1 |
| 3. Sessions | 3 days | Phase 2 |
| 4. Assignments | 4 days | Phase 3 |
| 5. Chat | 5 days | Phase 1 (Realtime) |
| 6. Analytics | 4 days | Phases 3-4 |
| 7. Automation | 3 days | Phase 6 |
| 8. Certificates | 2 days | Phase 6 |
| 9. Billing | 2 days | Phase 1 |
| 10. Polish | 3 days | All phases |

**Total:** ~4 weeks (overlapping phases)

---

## 🔄 Next Steps (Immediate Actions)

1. ✅ Review and approve `gemini.md` constitution
2. 🟡 Set up Lovable project
3. 🟡 Create Supabase project + deploy schema
4. 🟡 Start Phase 1: Foundation (authentication + UI shell)

---

**Notes:**
- Phases 3-5 can overlap (sessions, assignments, chat are independent)
- Chat (Phase 5) is critical to replace Slack → prioritize heavily
- Billing (Phase 9) can be pushed post-MVP if needed

