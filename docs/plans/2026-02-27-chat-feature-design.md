# Chat Feature — Design Document

## Goal
Replace the current generic chat with a structured, company-aware chat system that supports photo uploads and real-time messaging.

## Channel Structure

### Masterclass Companies (offering_type = 'master_class')
Each company enrolled in a masterclass gets **two auto-created channels**:

```
🏢 Reviespaces
   └── 💬 Team Chat       → everyone in the company
   └── 🔒 Management Chat → user_type='management' + admins/owners

🏢 Finasi
   └── 💬 Team Chat
   └── 🔒 Management Chat
```

### Sprint Workshop Cohorts (offering_type = 'sprint_workshop')
Each sprint workshop cohort gets **one flat chat** for all participants:

```
⚡ AI Integration Sprint
   └── 💬 Sprint Chat → all cohort members
```

### Removed
- ~~Cohort-wide general channels~~
- ~~Announcements channels~~
- ~~Any other channel types~~

---

## Access Rules

| Channel | Who Can See & Send |
|---|---|
| **Team Chat** | All users in that company + Zkandar admins/owners |
| **Management Chat** | Users with `user_type='management'` in that company + Zkandar admins/owners |
| **Sprint Chat** | All members of the sprint cohort + Zkandar admins/owners |

---

## Database Changes

### 1. Add `channel_type` column to `chat_messages`
```sql
ALTER TABLE chat_messages ADD COLUMN channel_type text NOT NULL DEFAULT 'team';
-- Values: 'team', 'management', 'sprint'
```

This replaces the current approach of using `cohort_id`/`company_id` nullability to determine channel context. Now channels are explicitly typed.

### 2. Create `chat-attachments` storage bucket
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);
```

With RLS policies so only authenticated users can upload, and files are publicly readable (for inline image display).

### 3. Update RLS policies on `chat_messages`
- **Team Chat**: User must belong to the company OR be admin/owner
- **Management Chat**: User must belong to the company AND be `user_type='management'`, OR be admin/owner
- **Sprint Chat**: User must be a member of the cohort OR be admin/owner

---

## Frontend Architecture

### Sidebar (Channel List)
- Fetch companies the user belongs to (or all companies if admin)
- For masterclass companies: render company name as header, Team Chat + Management Chat as sub-items
- For sprint cohorts: render cohort name with single Sprint Chat
- Hide Management Chat from users who aren't `management` type or admin

### Message Area
- Same as current: message list with real-time updates via Supabase Realtime
- Add photo/file upload via the existing paperclip icon (currently dead)
- Display inline image previews for uploaded photos

### Photo Upload Flow
1. User clicks paperclip → file picker opens (accept images)
2. Upload file to `chat-attachments` bucket in Supabase Storage
3. Get public URL
4. Insert `chat_messages` row with `message_type='file'`, `file_url` = public URL
5. Render inline image in the message bubble

---

## Key Components

| Component | Purpose |
|---|---|
| `ChatPage.tsx` | Full rewrite — new channel logic, upload support |
| `ChatSidebar.tsx` | New — company-grouped channel list with sub-items |
| `ChatMessageList.tsx` | New — scrollable message area with image rendering |
| `ChatInput.tsx` | New — text input + file upload + send button |
| `ChatMessageBubble.tsx` | New — individual message with image/text display |

---

## What Gets Removed
- All cohort-wide channel logic
- Announcements channel type
- The `ChannelType = 'cohort' | 'company' | 'announcements'` unions
- All `useMemo` channel-building logic based on cohorts
