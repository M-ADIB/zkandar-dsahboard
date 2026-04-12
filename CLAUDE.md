# Zkandar Dashboard — Claude Instructions

## Platform Settings First

**Before hardcoding any configurable value in the codebase, ask: "Should this live in Platform Settings?"**

If a feature has values an admin might want to change without a code deployment (counts, URLs, templates, text, thresholds), it belongs in the `platform_settings` table and should be editable in `/admin/settings`.

Examples of things that must go in Platform Settings, not hardcoded:
- Number of sessions auto-created per sprint workshop
- Assignment templates (title, instructions, format, due days)
- Welcome video URLs
- Email template content
- Certificate thresholds or scoring weights
- Any limit, count, or default that a non-technical admin might reasonably want to adjust

When proposing a new feature that has these characteristics, remind the user to consider whether it should be configurable via Platform Settings.

---

## Stack

- React + TypeScript + Vite
- Supabase (Postgres DB + auth + storage + edge functions)
- Tailwind CSS + Radix UI primitives
- Framer Motion animations, Lucide React icons, react-hot-toast

---

## Key Architecture

### Program Types
- `offering_type: 'master_class' | 'sprint_workshop'` on `cohorts` table
- `user_type: 'team' | 'management' | 'sprint_member'` on `users` table
- Sprint Workshop members (`sprint_member`) have a restricted nav and dashboard — no Chat, My Program, My Performance, no AI Readiness Score

### Sprint Workshop auto-creation
When a Sprint Workshop is created via ProgramModal:
1. Sessions are auto-created from `platform_settings.sprint_session_count` (default: 3)
2. Assignments are auto-created from `platform_settings.sprint_assignment_templates` (JSON array)
3. Session 2+ dates are explicitly picked by the admin (not computed)

### Platform Settings keys
- `welcome_video_team` — Vimeo URL for team + sprint members
- `welcome_video_management` — Vimeo URL for management users
- `sprint_session_count` — number of sessions per sprint (int, default: 3)
- `sprint_assignment_templates` — JSON array of assignment templates

### Auth
- `AuthProvider` owns all auth state; single `onAuthStateChange` subscription
- `ProtectedRoute` — gates on loading; redirects unauthenticated users
- `MemberRoute` — nested inside ProtectedRoute; redirects admins to /admin, sprint_member to /dashboard for blocked paths

### Admin Preview
All user_type-sensitive rendering uses:
```ts
const effectiveUserType = (canPreview && isPreviewing && previewUser)
    ? previewUser.user_type
    : user?.user_type ?? null
```
Apply this pattern in AppShell, MemberRoute, ParticipantDashboard, and any new component that branches on user_type.

### Supabase
- Never throws — always returns `{ data, error }`. Always destructure and check error.
- RLS policies are active. Silent 0-row updates usually mean an RLS policy is blocking.
- DB stores ISO timestamps; `<input type="date">` needs `.slice(0, 10)`.

---

## Code Conventions

- No window.confirm() for admin actions — use inline confirmation UI with Confirm/Cancel buttons
- Sprint-specific logic is always gated on `offering_type === 'sprint_workshop'` or `user_type === 'sprint_member'`, never on hardcoded counts
- Supabase calls inside components use the `useSupabase()` hook; top-level pages can use the direct `supabase` import
- Date helpers: `parseDate(str)`, `addDays(str, n)`, `fmtDate(date)` — use these, don't re-implement
