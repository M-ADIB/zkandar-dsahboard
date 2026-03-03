# Events Talk Request — Design Document

**Date:** 2026-03-04  
**Status:** Approved  
**Feature:** Speaker booking form for Khaled's external talks/speaking engagements

---

## Overview

Companies and event coordinators who want to book Khaled Iskandar for a talk, keynote, or
panel fill out a public two-stage form at `app.zkandar.com/events-apply`. Submissions land
in a new **Events** tab inside the admin dashboard. Adib reviews each one and changes the
status — which automatically fires the right email via Resend.

This feature is **entirely separate from the masterclass system**.

---

## Public Form — `/events-apply`

Unauthenticated, accessible by anyone with the link. No login required.

### Step 1 — The Basics

| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | ✅ |
| Email | Email | ✅ |
| Company / Organization | Text | ✅ |
| Your Role / Title | Text | ✅ |
| Event Type | Dropdown: Corporate Keynote, Panel Discussion, Conference Session, Community Event, Product Launch, Other | ✅ |
| Proposed Date / Month | Free text (e.g. "Second week of April 2026") | ✅ |
| Venue / Location | Text (venue name + city) | ✅ |
| Expected Audience Size | Number | ✅ |
| Brief description of the event | Textarea | ✅ |

On submit → form transitions to Step 2 in-place (no page reload). Progress indicator shows "Step 1 of 2 complete".

### Step 2 — Logistics Detail

| Field | Type | Required |
|-------|------|----------|
| Session format | Dropdown: Solo presentation, Panel, Workshop, Fireside chat | ✅ |
| Duration needed | Dropdown: 30 min, 45 min, 60 min, 90 min, Half-day | ✅ |
| Will there be a moderator / host? | Toggle: Yes / No | ✅ |
| Q&A session? | Toggle: Yes / No | ✅ |
| Available tech | Checkboxes: Large screen, Mic (lapel/handheld), High-speed WiFi, Backup laptop | ✅ |
| Any VIP guests or special considerations? | Textarea | ❌ |
| Will your team create a marketing flyer? | Radio: Yes / No / We'd like Zkandar's help | ✅ |
| Day-of point of contact name | Text | ✅ |
| Day-of point of contact phone | Text | ✅ |
| Anything else we should know? | Textarea | ❌ |

On final submit → thank-you confirmation screen. New row inserted into `event_requests` table with status `pending`.

---

## Database — `event_requests` Table

```sql
CREATE TABLE event_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Step 1
  full_name       text NOT NULL,
  email           text NOT NULL,
  company         text NOT NULL,
  role_title      text NOT NULL,
  event_type      text NOT NULL,
  proposed_date   text NOT NULL,
  venue           text NOT NULL,
  audience_size   integer,
  event_description text,
  -- Step 2
  session_format  text,
  duration        text,
  has_moderator   boolean,
  has_qa          boolean,
  available_tech  text[],
  vip_notes       text,
  marketing_flyer text,
  contact_name    text,
  contact_phone   text,
  other_notes     text,
  -- Admin
  status          text NOT NULL DEFAULT 'pending',  -- pending | approved | declined | done
  admin_notes     text,
  created_at      timestamptz DEFAULT now()
);
```

Status values: `pending`, `approved`, `declined`, `done`

---

## Admin Dashboard — Events Tab

New tab in the admin sidebar navigation.

**Table view columns:**
- Name + Company (primary)
- Event Type (badge)
- Proposed Date
- Audience Size
- Status (pill: amber=pending, lime=approved, red=declined, gray=done)
- Submitted (relative time)

**Click a row → slide-in detail drawer:**
- All Step 1 + Step 2 answers displayed in a clean read-only layout
- Internal admin notes (textarea, private)
- Status dropdown — changing to `approved` or `declined` triggers automated email
- No manual "send email" button — it's automatic on status change

---

## Automated Emails via Resend

**Sending domain:** `events@app.zkandar.com`  
**Method:** Supabase Edge Function (`send-event-email`) triggered from the dashboard when status changes

### Approval Email
- **Subject:** `You're confirmed — Zkandar AI Talk 🎉`
- **Body:** Personalised greeting, confirmation, EPK button linking to `ops.zkandar.com/epk`, note that Adib will be in touch for logistics shortly
- Style: matches dashboard branding (black #0B0B0B bg, lime #D0FF71 CTA, logo at top)

### Decline Email
- **Subject:** `Thank you for reaching out — Zkandar AI`
- **Body:** Warm, professional decline, reference to capacity/timing, open door for future engagement
- Same brand styling

---

## Architecture

```
Browser (public)
  └── /events-apply  →  EventApplyPage (no auth)
                          ├── Step 1 form
                          └── Step 2 form → POST to Supabase (event_requests)

Browser (admin, authenticated)
  └── /events  →  EventsPage
                   └── EventDetailDrawer
                          └── status change → calls Edge Function

Supabase Edge Function: send-event-email
  ├── Input: { event_request_id, new_status }
  ├── Fetches event_request row
  └── Calls Resend API → sends approval or decline email
```

---

## Email Brand Spec

- Background: `#0B0B0B`
- Card: `#111111`, border `#1F2937`
- CTA Button: `#D0FF71` (lime), text `#0B0B0B`
- Body text: `#D1D5DB`
- Muted text: `#9CA3AF`
- Logo: hosted at `app.zkandar.com/logo.png`
- Font stack: Arial, sans-serif (email-safe fallback for Base Neue Trial)
