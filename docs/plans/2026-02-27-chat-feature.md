# Chat Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a company-aware chat system with photo uploads, real-time messaging, and role-based channel access (Team Chat + Management Chat for masterclasses, single chat for sprints).

**Architecture:** Supabase Realtime for live messages. Storage bucket for photo attachments. `channel_type` column on `chat_messages` to distinguish team/management/sprint channels. Frontend rebuilt as modular components with company-grouped sidebar.

**Tech Stack:** React + TypeScript, Supabase (Postgres, Realtime, Storage), Framer Motion

---

## Task 1: Database Migration — Add `channel_type` and create storage bucket

**Files:**
- Create: `supabase/migrations/009_chat_channels.sql`

**Step 1: Apply migration via Supabase MCP**

Use `apply_migration` with project_id `gzzeywmbehzbassweudb`:

```sql
-- Add channel_type to chat_messages
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'team'
  CHECK (channel_type IN ('team', 'management', 'sprint'));

-- Create index for fast channel queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
  ON chat_messages (company_id, channel_type, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sprint
  ON chat_messages (cohort_id, channel_type, created_at);

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Storage policy: anyone can view (public bucket)
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-attachments');

-- Update RLS on chat_messages for channel_type awareness
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;

-- SELECT policy
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT TO authenticated
USING (
  -- Admin/owner can see everything
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
  OR
  -- Team chat: user belongs to the company
  (channel_type = 'team' AND company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id))
  OR
  -- Management chat: user belongs to company AND is management type
  (channel_type = 'management' AND company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id AND users.user_type = 'management'))
  OR
  -- Sprint chat: user is member of the cohort
  (channel_type = 'sprint' AND cohort_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_memberships.user_id = auth.uid() AND cohort_memberships.cohort_id = chat_messages.cohort_id))
);

-- INSERT policy
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Admin/owner can send anywhere
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('owner', 'admin'))
    OR
    -- Team chat: user belongs to company
    (channel_type = 'team' AND company_id IS NOT NULL AND
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id))
    OR
    -- Management chat: user belongs to company AND is management
    (channel_type = 'management' AND company_id IS NOT NULL AND
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.company_id = chat_messages.company_id AND users.user_type = 'management'))
    OR
    -- Sprint chat: user is member of cohort
    (channel_type = 'sprint' AND cohort_id IS NOT NULL AND
      EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_memberships.user_id = auth.uid() AND cohort_memberships.cohort_id = chat_messages.cohort_id))
  )
);
```

**Step 2: Save migration file locally**

Save the same SQL to `supabase/migrations/009_chat_channels.sql`.

**Step 3: Commit**

```bash
git add supabase/migrations/009_chat_channels.sql
git commit -m "feat(chat): add channel_type column and storage bucket"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/database.ts` (lines 188-205, ChatMessage interface)

**Step 1: Update ChatMessage interface**

Replace the existing `ChatMessage` interface:

```typescript
export type ChatChannelType = 'team' | 'management' | 'sprint'

export interface ChatMessage {
    id: string
    cohort_id: string | null
    company_id: string | null
    sender_id: string
    message: string
    message_type: 'text' | 'file' | 'system'
    file_url: string | null
    channel_type: ChatChannelType
    is_pinned: boolean
    created_at: string
    // Joined data
    sender?: User
}
```

Remove `ChatAttachment` interface (we use `file_url` + `message_type` instead).

Update the `chat_messages` table type in the `Database` interface to include `channel_type`.

**Step 2: Commit**

```bash
git add src/types/database.ts
git commit -m "feat(chat): update ChatMessage type with channel_type"
```

---

## Task 3: Create `useChatChannels` Hook

**Files:**
- Create: `src/hooks/useChatChannels.ts`

**Step 1: Implement the hook**

This hook fetches the channel list for the current user:
- If admin/owner: fetch all companies (with their cohort offering_type) + all sprint cohorts
- If participant: fetch their company + their sprint cohort memberships
- Returns channels grouped by company (team + management sub-channels) and sprint cohorts (single channel)
- Hides management channels from `user_type='team'` users

```typescript
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export interface ChatChannel {
    id: string           // e.g. "team:company-uuid" or "management:company-uuid" or "sprint:cohort-uuid"
    name: string         // e.g. "Team Chat" or "Management Chat" or "Sprint Chat"
    type: 'team' | 'management' | 'sprint'
    companyId?: string
    cohortId?: string
    parentName: string   // Company or cohort name for grouping
}

export interface ChannelGroup {
    parentId: string
    parentName: string
    channels: ChatChannel[]
}

export function useChatChannels() {
    const { user, loading: authLoading } = useAuth()
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [loading, setLoading] = useState(true)

    const isAdmin = user?.role === 'admin' || user?.role === 'owner'

    useEffect(() => {
        if (authLoading || !user) {
            setGroups([])
            setLoading(false)
            return
        }

        const fetch = async () => {
            setLoading(true)
            const result: ChannelGroup[] = []

            // 1. Fetch masterclass companies
            let companiesQuery = supabase
                .from('companies')
                .select('id, name, cohort_id, cohorts!companies_cohort_id_fkey(offering_type)')

            if (!isAdmin) {
                companiesQuery = companiesQuery.eq('id', user.company_id!)
            }

            const { data: companies } = await companiesQuery

            if (companies) {
                for (const co of companies as any[]) {
                    const offeringType = co.cohorts?.offering_type
                    if (offeringType !== 'master_class') continue

                    const channels: ChatChannel[] = [
                        {
                            id: `team:${co.id}`,
                            name: 'Team Chat',
                            type: 'team',
                            companyId: co.id,
                            parentName: co.name,
                        },
                    ]

                    // Only show management chat to management users or admins
                    if (isAdmin || user.user_type === 'management') {
                        channels.push({
                            id: `management:${co.id}`,
                            name: 'Management Chat',
                            type: 'management',
                            companyId: co.id,
                            parentName: co.name,
                        })
                    }

                    result.push({
                        parentId: co.id,
                        parentName: co.name,
                        channels,
                    })
                }
            }

            // 2. Fetch sprint workshop cohorts
            let sprintQuery = supabase
                .from('cohorts')
                .select('id, name')
                .eq('offering_type', 'sprint_workshop')
                .in('status', ['upcoming', 'active'])

            if (!isAdmin) {
                // Only cohorts the user is a member of
                const { data: memberships } = await supabase
                    .from('cohort_memberships')
                    .select('cohort_id')
                    .eq('user_id', user.id)

                const memberCohortIds = (memberships ?? []).map((m: any) => m.cohort_id)
                if (memberCohortIds.length > 0) {
                    sprintQuery = sprintQuery.in('id', memberCohortIds)
                } else {
                    sprintQuery = sprintQuery.in('id', ['__none__'])
                }
            }

            const { data: sprints } = await sprintQuery

            if (sprints) {
                for (const sp of sprints as any[]) {
                    result.push({
                        parentId: sp.id,
                        parentName: sp.name,
                        channels: [{
                            id: `sprint:${sp.id}`,
                            name: 'Sprint Chat',
                            type: 'sprint',
                            cohortId: sp.id,
                            parentName: sp.name,
                        }],
                    })
                }
            }

            setGroups(result)
            setLoading(false)
        }

        fetch()
    }, [authLoading, user?.id, user?.company_id, user?.user_type, isAdmin])

    const allChannels = useMemo(() => groups.flatMap(g => g.channels), [groups])

    return { groups, allChannels, loading }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useChatChannels.ts
git commit -m "feat(chat): add useChatChannels hook"
```

---

## Task 4: Create `ChatSidebar` Component

**Files:**
- Create: `src/components/chat/ChatSidebar.tsx`

**Step 1: Implement sidebar with grouped channels**

Shows company names as collapsible section headers with Team/Management sub-items. Sprint cohorts show as a single item. Uses Zkandar design system (black bg, lime accents, rounded corners).

Key details:
- Lock icon (🔒) next to Management Chat
- Users icon (👥) next to Team Chat
- Lightning icon (⚡) next to Sprint Chat
- Selected state uses `bg-lime/10 text-lime`
- Unselected uses `hover:bg-white/5 text-gray-400`

**Step 2: Commit**

```bash
git add src/components/chat/ChatSidebar.tsx
git commit -m "feat(chat): add ChatSidebar component"
```

---

## Task 5: Create `ChatInput` Component with Photo Upload

**Files:**
- Create: `src/components/chat/ChatInput.tsx`

**Step 1: Implement input with file upload**

Features:
- Text input with Enter-to-send (Shift+Enter for newline)
- Paperclip button opens hidden `<input type="file" accept="image/*">` 
- On file select: upload to `chat-attachments` bucket, get public URL
- Show upload preview and progress indicator
- Send button inserts `chat_messages` row:
  - For text: `message_type='text'`, `message` = text content
  - For image: `message_type='file'`, `file_url` = public URL, `message` = filename
- Pass `channel_type`, `company_id`, `cohort_id` as props

**Step 2: Commit**

```bash
git add src/components/chat/ChatInput.tsx
git commit -m "feat(chat): add ChatInput with photo upload"
```

---

## Task 6: Create `ChatMessageBubble` Component

**Files:**
- Create: `src/components/chat/ChatMessageBubble.tsx`

**Step 1: Implement message bubble**

- Text messages: same bubble style as current (own=lime bg, admin=lime border, other=white/5 bg)
- Image messages: render `<img>` inline with max-width, rounded corners, click to open full-size
- Show sender initial avatar, name, timestamp
- Pin icon for pinned messages

**Step 2: Commit**

```bash
git add src/components/chat/ChatMessageBubble.tsx
git commit -m "feat(chat): add ChatMessageBubble component"
```

---

## Task 7: Create `ChatMessageList` Component

**Files:**
- Create: `src/components/chat/ChatMessageList.tsx`

**Step 1: Implement scrollable message list**

- Fetches messages from `chat_messages` filtered by channel
- Supabase Realtime subscription for live updates
- Auto-scroll to bottom on new messages
- Loading/empty/error states
- Uses `ChatMessageBubble` for each message

Query logic:
- `team` channel: `WHERE company_id = X AND channel_type = 'team'`
- `management` channel: `WHERE company_id = X AND channel_type = 'management'`
- `sprint` channel: `WHERE cohort_id = X AND channel_type = 'sprint'`

**Step 2: Commit**

```bash
git add src/components/chat/ChatMessageList.tsx
git commit -m "feat(chat): add ChatMessageList component"
```

---

## Task 8: Rewrite `ChatPage.tsx`

**Files:**
- Modify: `src/pages/ChatPage.tsx` (full rewrite, 560 lines → ~80 lines)

**Step 1: Rewrite to compose new components**

```typescript
import { useState } from 'react'
import { useChatChannels, ChatChannel } from '@/hooks/useChatChannels'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ChatInput } from '@/components/chat/ChatInput'

export function ChatPage() {
    const { groups, allChannels, loading } = useChatChannels()
    const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null)

    // Auto-select first channel
    if (!selectedChannel && allChannels.length > 0) {
        setSelectedChannel(allChannels[0])
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border bg-bg-card animate-fade-in">
            <ChatSidebar
                groups={groups}
                loading={loading}
                selectedChannelId={selectedChannel?.id ?? ''}
                onSelectChannel={setSelectedChannel}
            />
            <div className="flex-1 flex flex-col">
                {selectedChannel ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border">
                            <h3 className="font-semibold">{selectedChannel.parentName}</h3>
                            <p className="text-xs text-gray-500">{selectedChannel.name}</p>
                        </div>
                        <ChatMessageList channel={selectedChannel} />
                        <ChatInput channel={selectedChannel} />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        {loading ? 'Loading channels...' : 'No channels available'}
                    </div>
                )}
            </div>
        </div>
    )
}
```

**Step 2: Commit**

```bash
git add src/pages/ChatPage.tsx
git commit -m "feat(chat): rewrite ChatPage with modular components"
```

---

## Task 9: Verify & Push

**Step 1: Build check**

```bash
npm run build
```

Expected: `✓ built in X.Xxs`, zero errors.

**Step 2: Launch and test in browser**

```bash
npm run dev
```

Test checklist:
- [ ] Login as admin → see all companies with Team + Management sub-channels
- [ ] Login as team user → see only Team Chat (no Management Chat)
- [ ] Login as management user → see both Team + Management chats
- [ ] Send a text message → appears in real-time
- [ ] Upload a photo → image renders inline in the conversation
- [ ] Sprint cohort users → see single Sprint Chat

**Step 3: Push to GitHub**

```bash
git push origin main
```
