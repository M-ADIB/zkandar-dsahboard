# 🔍 Zkandar AI Masterclass Hub - Findings & Research

**Last Updated:** 2026-02-06

---

## 🎯 Business Context Discoveries

### Zkandar AI's Current Pain Points
1. **Tool Fragmentation:** Using Slack, Zoom, Miro, Google Drive, Attio = context switching hell
2. **Slack Limitation:** Not designed for cohort-based learning (poor material organization)
3. **Manual Work:** Admins manually tracking attendance, assignments, progress
4. **No Analytics:** Can't measure AI readiness growth or tool adoption post-program
5. **Certificate Process:** Likely manual (checking criteria, generating PDFs)

### Why This Dashboard Matters
- **Competitive Edge:** Design studios are skeptical of AI → need proof of results
- **Retention:** Strong analytics = case studies = easier sales for next cohorts
- **Scalability:** Currently limited by manual admin work (can't scale beyond 3-4 cohorts/year)

---

## 🧠 Key User Insights

### Executive (Company Admin) Needs
- Wants to see ROI: "Are my designers actually using AI after this program?"
- Needs visibility into team engagement (who's active, who's falling behind)
- Likely busy → won't engage deeply with platform (delegation to team)

### Participant (Designer) Needs
- **Fear:** "Will AI replace me?" → onboarding survey must reframe this
- **Overwhelm:** Learning 5+ new tools (Midjourney, Craya, etc.) in 5 weeks
- **Social Proof:** Wants to see peers' work (peer gallery feature)
- **Convenience:** Hates switching between Slack, Drive, Miro → unified hub is key

### Admin (Zkandar AI Team) Needs
- **Time Savings:** Automate repetitive tasks (reminders, material distribution)
- **Visibility:** Who's at risk of dropping out? (attendance, assignment flags)
- **Storytelling:** Need data to show "80% of participants now use AI weekly"

---

## 🔧 Technical Research

### Lovable.dev (GPT Engineer) Capabilities
- **Frontend:** React + Tailwind (perfect for futuristic UI)
- **Backend:** Supabase (PostgreSQL + Realtime + Auth + Storage)
- **Limitations:**
  - No built-in video streaming (use iframe embeds for Zoom)
  - File uploads capped at ~10MB via Supabase storage (fine for PDFs)
  - Realtime chat can handle ~100 concurrent users per channel (sufficient)

### Supabase Row-Level Security (RLS) Strategy
Critical for role-based access. Example policies:

```sql
-- Participants can only see their own company's data
CREATE POLICY "participants_view_own_company" ON users
  FOR SELECT USING (
    auth.uid() = id OR company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Admins can see everything
CREATE POLICY "admins_view_all" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

### Chat Architecture Decision
**Option A:** Supabase Realtime (Chosen)
- Pros: Built-in, no extra infra, 50ms latency
- Cons: Not ideal for 1000+ concurrent users (not a concern here)

**Option B:** Stream/PubNub
- Pros: Enterprise-grade, 10ms latency
- Cons: $99/mo, overkill for cohorts of 20-50 people

**Decision:** Use Supabase Realtime → if scale becomes issue (100+ cohorts), migrate to Stream.

---

## 📚 Integration Research

### Attio CRM API
- **Endpoint:** `GET /v2/objects/companies`
- **Auth:** Bearer token (API key from Attio dashboard)
- **Use Case:** When executive signs up, fetch company name/industry from Attio
- **Rate Limit:** 100 req/min (safe for our use case)

**Sample Response:**
```json
{
  "data": {
    "id": "comp_123",
    "values": {
      "name": "DesignStudio Inc.",
      "industry": "Interior Design"
    }
  }
}
```

### Google Drive Embed Strategy
**Two approaches:**

1. **Admin pastes shared link** → embed in iframe:
   ```html
   <iframe src="https://drive.google.com/file/d/FILE_ID/preview" />
   ```
   - Pro: No API key needed, instant setup
   - Con: Must set Drive folder to "Anyone with link can view"

2. **Upload to Supabase Storage** → serve directly:
   ```js
   const { data } = await supabase.storage
     .from('materials')
     .upload('session-1/guide.pdf', file)
   ```
   - Pro: Full control, no external dependencies
   - Con: Costs scale with storage (but negligible for PDFs)

**Decision:** Hybrid approach (admin chooses). Default to Drive links for large files (videos), Supabase for PDFs <10MB.

### Zoom Recording Access
**Manual Paste (MVP):**
- Admin copies link from Zoom → pastes in dashboard
- Pros: No API setup, works immediately
- Cons: Manual work (but only 5 sessions per cohort)

**Zoom API (Future):**
```bash
GET /meetings/{meetingId}/recordings
Authorization: Bearer {JWT_TOKEN}
```
- Pros: Auto-fetch after session ends
- Cons: Requires Zoom OAuth app approval (~1 week setup)

**Decision:** Manual paste for MVP → automate post-launch.

---

## 🎨 UI/UX Design Inspirations

### Reference Dashboards Analyzed:

**1. Dark Navy + Purple Gradient (Image 1 - Sales Dashboard)**
- Hero element: 3D animated orb (AI assistant visual)
- Glassmorphism cards with subtle shadows
- Bar charts with rounded corners + gradient fills
- Metric cards: Icon + number + label (clean hierarchy)

**2. Clean Productivity Dashboard (Images 2-3 - Equa App)**
- Minimalist sidebar (icons only, labels on hover)
- Progress visualizations: Donut charts, bar graphs, activity heatmaps
- Color coding: Purple (primary action), Orange (accent)
- Time tracker widget (prominent, visual timer)

**3. Personal AI Assistant (Image 4 - Alva)**
- Conversational interface (chat-first design)
- Card-based suggestions ("Daily Recap", "Quick Reminder")
- Soft blur backgrounds (focus on content)
- Voice input button (could adapt for chat)

### Design System Components Needed:

**Reusable Elements:**
- MetricCard: Icon + big number + label + trend indicator
- ProgressBar: Animated, with glow effect on completion
- SessionCard: Thumbnail + title + date + status badge
- ChatBubble: User avatar + message + timestamp
- NotificationBadge: Small red dot with count
- ModalOverlay: Blur background + centered card (surveys, confirmations)

**Color Palette (Finalized):**
```css
:root {
  --primary: #4A90FF; /* Electric Blue */
  --secondary: #6B46C1; /* Deep Purple */
  --accent-cyan: #00D9FF;
  --accent-magenta: #FF0080;
  --bg-dark: #0A0E27; /* Navy */
  --bg-card: rgba(255, 255, 255, 0.05); /* Glassmorphism */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
}
```

---

## 🚨 Potential Technical Risks

### 1. Real-Time Chat Performance
- **Risk:** 50 users typing simultaneously = lag
- **Mitigation:** Implement message throttling (1 msg/sec per user), lazy load old messages

### 2. File Upload Size
- **Risk:** Participants upload 50MB videos as assignments
- **Mitigation:** Hard limit at 10MB, force link submissions for large files

### 3. Zoom Iframe Embeds
- **Risk:** Zoom may block iframe embedding (X-Frame-Options)
- **Mitigation:** Use Zoom's "Share" link (not direct recording URL), or fallback to "Open in new tab" button

### 4. Survey Completion Drop-Off
- **Risk:** Participants skip onboarding survey (too long)
- **Mitigation:** Make it 5 questions max, use progress indicator, block dashboard access until complete

### 5. Cross-Company Data Leakage
- **Risk:** Participant sees another company's chat messages due to RLS bug
- **Mitigation:** Extensive testing of Supabase policies, add `company_id` checks in every query

---

## 📊 Competitive Analysis (Alternatives Considered)

### Why Not Use Existing LMS Platforms?

**Kajabi / Teachable / Thinkific:**
- ❌ Too generic (not designed for cohort-based workshops)
- ❌ No real-time chat
- ❌ Expensive ($149+/mo)
- ✅ Good for evergreen courses (not Zkandar's model)

**Slack + Notion + Google Sheets (Current Setup):**
- ❌ Fragmented (5 tools = 5 logins)
- ❌ No progress tracking
- ❌ Manual data entry hell
- ✅ Familiar to users (migration friction)

**Custom Dashboard (This Project):**
- ✅ Unified experience
- ✅ Tailored to masterclass workflow
- ✅ Data ownership (analytics, surveys)
- ❌ Upfront dev time (but pays off after 2 cohorts)

**Decision:** Custom dashboard is the only way to achieve the vision.

---

## 🔄 Open Questions (To Resolve)

1. **Certificate Design:** Who designs the PDF template? (Zkandar's brand team or generic?)
2. **Miro Board Sharing:** Should Miro boards be embedded (iframe) or just linked?
3. **Participant Limit per Cohort:** Is there a max? (Affects DB indexing strategy)
4. **Mobile Usage:** What % of users will access via mobile? (Should we optimize for mobile-first?)
5. **Data Retention:** How long to keep completed cohort data? (GDPR considerations)

---

## 💡 Feature Ideas (Post-MVP)

### Quick Wins:
- **AI Chatbot:** Claude-powered assistant for common questions ("How do I submit an assignment?")
- **Leaderboard:** Gamify engagement (most active in chat, first to submit assignments)
- **Portfolio Gallery:** Showcase best participant work publicly (with permission)

### Advanced:
- **Live Collaboration:** Participants can co-edit Miro boards directly in dashboard (Miro SDK)
- **AI Feedback:** Auto-suggest improvements on assignment submissions (image analysis)
- **Mobile App:** React Native version for on-the-go access

---

**End of Findings. This document will be updated as discoveries are made.**
