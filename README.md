# Zkandar AI Masterclass Hub

A futuristic AI-themed learning management dashboard for Zkandar AI's masterclass programs. This platform replaces Slack and consolidates client management, session delivery, assignments, real-time chat, and progress tracking into one unified interface.

## Features

- 🎨 **Dark-themed UI** with Zkandar AI brand colors (lime #D0FF71, green #5A9F2E)
- 👥 **Role-based access** - Owner, Admin, Executive, Participant
- 📚 **Session management** - Video recordings, materials, attendance tracking
- ✅ **Assignment system** - File/link/text submissions with feedback
- 💬 **Real-time chat** - Cohort-wide and company-private channels
- 📊 **Analytics dashboard** - Progress tracking with Recharts visualizations
- 🎯 **AI Readiness Score** - Calculated from onboarding survey
- 📱 **Fully responsive** - Mobile-first design with collapsible sidebars

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + Custom dark theme
- **Backend:** Supabase (PostgreSQL + Realtime + Auth + Storage)
- **UI Components:** Radix UI, Framer Motion, Lucide icons
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/M-ADIB/zkandar-dsahboard.git
   cd zkandar-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### Database Setup

Run the SQL migrations in your Supabase project. See `LOVABLE_PROJECT_PROMPT.md` for the complete schema.

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard widgets
│   ├── layout/         # AppShell, Sidebar, Navbar
│   ├── onboarding/     # Onboarding survey
│   └── shared/         # Reusable components
├── context/            # React context providers
├── lib/                # Supabase client, utilities
├── pages/              # Route pages
└── types/              # TypeScript definitions
```

## License

Private - Zkandar AI
