# Masterclass Program Feature — Complete Design

## Problem

The masterclass program feature has the infrastructure (DB tables, admin pages, modals) but is **broken end-to-end**:

1. **RLS blocks all writes** — `cohorts`, `sessions`, `assignments` tables only have SELECT policies. Admins can't create, edit, or delete anything.
2. **Company Workspace is view-only** — The Program tab shows sessions but can't manage them. Admins must context-switch to the global Programs page.
3. **No participant experience** — Members have generic Sessions/Assignments pages but no unified program view with recordings, submissions, and progress tracking.

---

## Part 1: RLS Fix (Database)

Add INSERT, UPDATE, DELETE policies for admin/owner roles on these tables:

| Table | Policy | Who |
|-------|--------|-----|
| `cohorts` | Full CRUD | owner, admin |
| `sessions` | Full CRUD | owner, admin |
| `assignments` | Full CRUD | owner, admin |
| `submissions` | INSERT own | all authenticated users |
| `submissions` | UPDATE (feedback/score) | owner, admin |

> [!IMPORTANT]
> This is the **root cause** of the screenshot error. Must be fixed first.

---

## Part 2: Company Workspace — Full Program Management

### Current State
The Program tab in Company Workspace shows: program info card, session list (view only), Miro board link.

### New Design

The Program tab becomes a **mini program management dashboard** with these sub-sections:

#### 2a. Program Header (existing, enhanced)
- Program name, type, dates, status badge
- Miro board link
- **NEW**: "Change Program" button (to reassign a different cohort)
- **NEW**: "Unassign Program" option

#### 2b. Sessions Section
- Session cards (not just a list) showing: number, title, date, status
- **"Add Session" button** → opens SessionModal (already built)
- **Edit/Delete** on each session card
- **Recording URL field** — inline "Add Recording" button that expands an input
- **Materials** — show linked materials, ability to add/remove

#### 2c. Assignments Section
- List of assignments grouped by session
- **"Add Assignment" button** → opens AssignmentModal (already built)
- Edit/Delete on each assignment
- **Submission count badge** — shows "3/5 submitted" per assignment
- Click on assignment → opens **Submissions panel** (slide-over) showing:
  - Each member's submission status (submitted / pending)
  - Download link for submitted files
  - Admin feedback text area + score input
  - Save feedback button

#### 2d. Attendance Section (lightweight)
- Per-session attendance checkboxes for each company member
- Check/uncheck to mark who attended
- Uses existing `session_attendance` table

---

## Part 3: Participant "My Program" Page

### Route
`/my-program` — added to member sidebar nav, replaces the separate Sessions page for masterclass participants.

### Layout (single scrollable page)

#### 3a. Program Header
- Program name + status badge
- Progress ring: "3/5 sessions attended · 2/4 assignments submitted"
- Certificate status: "Complete 1 more session to earn your certificate"

#### 3b. Session Timeline
- Vertical timeline of all sessions (numbered)
- Each session card shows:
  - Title, date, status (upcoming / completed)
  - 🎥 "Watch Recording" button (if `recording_url` exists)
  - 📎 Materials list (clickable links)
  - ✅ Assignment attached (if any) with status

#### 3c. Assignments Widget
- Cards for each assignment:
  - Title, due date, session it belongs to
  - Status: "Not started" / "Submitted" / "Reviewed"
  - **"Submit" button** → opens submission modal (file upload, link, or text based on `submission_format`)
  - If reviewed: shows admin feedback + score

#### 3d. Miro Board Embed
- If program has `miro_board_url`, show an embedded Miro iframe

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/024_admin_rls_policies.sql` | RLS fix |
| `src/pages/MyProgramPage.tsx` | Participant program page |
| `src/components/admin/company/WorkspaceSessions.tsx` | Sessions management in workspace |
| `src/components/admin/company/WorkspaceAssignments.tsx` | Assignments management in workspace |
| `src/components/admin/company/WorkspaceAttendance.tsx` | Attendance tracking |
| `src/components/admin/company/SubmissionsPanel.tsx` | Slide-over for reviewing submissions |

### Modified Files
| File | Change |
|------|--------|
| `CompanyWorkspacePage.tsx` | Replace Program tab content with full management |
| `App.tsx` | Add `/my-program` route |
| `Sidebar.tsx` | Add "My Program" nav item for members |

---

## Verification Plan

### Automated
- `npx tsc --noEmit` — zero TS errors
- Supabase MCP: verify RLS policies applied

### Manual
- Admin: create program, add sessions, add recordings, create assignments, review submissions — all from Company Workspace
- Participant: view program timeline, watch recording, submit assignment, see feedback
