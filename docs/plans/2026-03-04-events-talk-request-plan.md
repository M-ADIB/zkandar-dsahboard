# Events Talk Request Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete speaker booking system where external coordinators can submit talk requests via a public 2-stage form, and admins can review/approve/decline them, which automatically fires branded emails via Resend.

**Architecture:** 
1. `event_requests` table in Supabase.
2. Public `/events-apply` route (no login).
3. Protected admin `/events` route with table & detail drawer.
4. Supabase Edge Function (`send-event-email`) that receives webhook/RPC calls on status change to fire Resend emails.

**Tech Stack:** React, Tailwind CSS, Supabase DB, Supabase Edge Functions (Deno), Resend API.

---

### Task 1: Database Migration & Types

**Files:**
- Create: `supabase/migrations/026_create_event_requests.sql`
- Modify: `src/types/database.ts`

**Step 1: Write migration**
Create the `event_requests` table with all fields from the design doc, plus a trigger or simple RPC function if necessary, or we can just call the Edge Function from the client on status update.
Let's keep it simple: insert/update rows normally. Wait, the Edge Function can just be called via `supabase.functions.invoke('send-event-email', { body: { id, status } })` from the Admin UI.
Write the standard SQL migration.

**Step 2: Update types**
Manually add the `EventRequest` interface to `src/types/database.ts` matching the new table schema.

**Step 3: Apply & Commit**
Run `supabase db push` or apply migration.

---

### Task 2: Supabase Edge Function (Email Sender)

**Files:**
- Create: `supabase/functions/send-event-email/index.ts`

**Step 1: Scold Deno Function**
Write the Deno edge function using `@supabase/supabase-js` and the `resend` REST API.
It should receive `eventId` and `newStatus` ('approved' or 'declined').
Fetch the event details from the DB.
Construct the HTML email matching the exact branding requested (black bg #0B0B0B, lime #D0FF71 CTA, etc).
Send via `https://api.resend.com/emails` with Authorization: Bearer RESEND_API_KEY.

**Step 2: Deploy & Commit**
Run `supabase functions deploy send-event-email --no-verify-jwt`.
Set the secret: `supabase secrets set RESEND_API_KEY=your_key`.

---

### Task 3: Public Form (`/events-apply`)

**Files:**
- Create: `src/pages/public/EventsApplyPage.tsx`
- Modify: `src/App.tsx`

**Step 1: Create the form component**
Implement the two-step form using React state.
Step 1: Basics (Name, Email, Company, Role, Event Type, Date, Venue, Audience Size, Description).
Step 2: Logistics (Format, Duration, Moderator, Q&A, Tech checkboxes, VIP notes, Marketing, Contact Point).
On submit, `supabase.from('event_requests').insert(...)`.
Show generic Success message.

**Step 2: Add route**
Add public route `<Route path="/events-apply" element={<EventsApplyPage />} />` in `App.tsx` (outside the `ProtectedRoutes` wrapper if applicable, or just a normal route).

---

### Task 4: Admin Dashboard (`/events`)

**Files:**
- Create: `src/pages/admin/EventsPage.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`

**Step 1: Create Data Table**
Fetch from `event_requests`.
Display Name, Company, Event Type, Date, Status badges.

**Step 2: Add Sidebar & Route**
Add `/events` to `Sidebar.tsx` and `App.tsx` (protected).

---

### Task 5: Admin Details & Status Workflow

**Files:**
- Modify: `src/pages/admin/EventsPage.tsx`
- Create: `src/components/admin/events/EventDetailDrawer.tsx`

**Step 1: Create Slide-in Drawer**
When clicking a row, open a panel showing all submitted data.
Add an internal `admin_notes` textarea + save button.

**Step 2: Implement Status Dropdown**
Add a Select for status (Pending, Approved, Declined, Done).
On change to Approved/Declined:
1. Update DB row status
2. Call `supabase.functions.invoke('send-event-email', { body: { eventId: id, status: newStatus } })`
3. Show success toast.
