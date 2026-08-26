# StudyZone — Intelligent Study & Learning Management Platform

StudyZone is a full-stack, dark-first intelligent learning platform built to help students, developers, and self-directed learners organize coursework, master difficult subjects through spaced repetition, track daily study momentum, and receive AI coaching backed by real study metrics.

---

## 🌟 Core Feature Matrix

### 1. 📊 Smart Dashboard & Best Next Action Engine
- **Next Action Recommendation**: Evaluates pending tasks, upcoming deadlines, and streak status to surface the single highest-leverage task.
- **Real-Time Workload Metrics**: Live metrics for total tasks, completion rates, 7-day workload horizon, and active learning plan progress.
- **Integrated Study Logger**: Rapidly record focus blocks with subject tags, task links, and notes.

### 2. ⏱ Focus Mode & Pomodoro Productivity Suite
- **5 Structured Focus Presets**: Classic Pomodoro (25m/5m), Deep Work (50m/10m), Extended Focus (90m/20m), Quick Focus (15m/5m), and Custom interval modes.
- **100% Synthesized Web Audio Soundscape**: Zero external audio downloads or streaming risks:
  - **Brown Noise**: Deep Brownian rumble for ADHD & coding flow.
  - **Pink Noise**: Balanced 1/f soothing frequency.
  - **White Noise**: Crisp frequency masking background distractions.
  - **432Hz Harmonic Sine Drone**: Triple-harmonic calm focus tone.
  - **Tibetan Singing Bowl Chime**: Synthesized bell that rings on interval transitions.
- **Screen WakeLock API & Fullscreen Mode**: Prevents screen sleep during active focus sessions.

### 3. 📅 Interactive Learning Calendar & Timetable
- **6-Week $\times$ 7-Day Month Grid**: Unified timetable aggregating deadlines, scheduled tasks, and focus sessions.
- **Timezone-Safe Date Handling**: Uses local calendar date components to prevent UTC date-boundary shifts.
- **Interactive Day Inspector**: Side drawer opening on date selection with item breakdowns and a 1-click **"Focus"** launcher.

### 4. 🧠 Active Recall Flashcards & SuperMemo SM-2 Spaced Repetition
- **SuperMemo SM-2 Algorithm**: Pure implementation calculating quality response scores ($q \in [0..5]$), consecutive repetitions ($n$), updated intervals ($I$), and variable Easiness Factor ($EF \ge 1.3$).
- **3D Active Recall Deck View**: Flip cards with keyboard navigation (`Space`, `1-4` ratings: *Again*, *Hard*, *Good*, *Easy*).
- **AI Deck Generator (Proposal & Approval Flow)**: Prompts Gemini AI for question/answer pairs from any topic or lecture notes; presents an interactive review modal before persisting to Supabase.
- **Resilient Cache Fallback**: Supabase is the single primary source of truth; LocalStorage functions as a read-through cache without conflicting client IDs.

### 5. 🤖 AI Study Assistant, Conversational History & Action Proposals
- **Multi-Thread Chat History**: Scoped `ai_conversations` and `ai_messages` tables with cascade deletion.
- **Context-Aware Coaching**: Injects 7-day study analytics, task completion rates, and upcoming workload.
- **Action Proposal Approval System**: AI proposes structured tasks, deadlines, and learning plans. **Zero autonomous writes are permitted**—mutations require explicit user review and approval before execution.

### 6. 🧭 Structured Learning Plans & Milestone Hierarchy
- **Milestone Roadmaps**: Break major subjects or semester goals into progressive milestones.
- **Deterministic Progress Tracking**: Progress automatically recalculates based on completed linked tasks and milestones.

### 7. 📈 Learning Insights & Analytics
- **7-Day Consistency Tracker**: Daily active day checkmarks and study streak tracking.
- **Learning Area Balance**: Distribution of time spent across different subjects.
- **Upcoming Workload Horizon**: Daily load bar distribution over the next 7 days.

### 8. 🔔 In-App Notification System
- **Deterministic Notification Engine**: Generates in-app alerts for overdue tasks, deadlines due within 48 hours, and evening streak risks.
- **Deduplication Safeguards**: Metadata deduplication keys prevent repeated alert spam.
- **Persistent Preferences**: User toggles in Settings persist directly to Supabase `profiles`.

### 9. 🔍 Global Command & Search Palette (`Cmd + K` / `Ctrl + K`)
- Instant search across Subjects, Tasks, Deadlines, Learning Plans, Milestones, Flashcard Decks, and Calendar.

### 10. 📦 Data Portability & Complete Backup
- **Full JSON Backup**: 1-click export of all user tables (including complete AI chat history).
- **CSV Spreadsheet Exports**: Formatted and quote-escaped exports for Tasks, Study Sessions, and Flashcards.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│   (Tailwind CSS v4 · Motion · Lucide Icons · Web Audio API) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│   (auth · tasks · deadlines · flashcards · sessions · AI)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│    Supabase PostgreSQL       │ │   Supabase Edge Function   │
│ ┌──────────────────────────┐ │ │ ┌────────────────────────┐ │
│ │ Row-Level Security (RLS) │ │ │ │ Gemini 2.5 Flash API   │ │
│ │ (auth.uid() = user_id)   │ │ │ │ (Server-side API key)  │ │
│ └──────────────────────────┘ │ │ └────────────────────────┘ │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 🔒 Security & Data Isolation Model

- **Row Level Security (RLS)**: Enforced across all PostgreSQL tables. Every query is filtered with `USING (auth.uid() = user_id)`.
- **Frontend Anon Key Only**: The client bundle contains only the public publishable/anon Supabase key.
- **Server-Side AI Secrets**: Gemini API keys exist exclusively in Supabase Edge Function secrets.
- **Zero Autonomous Writes**: The AI engine can only suggest action proposals; no database writes occur without explicit user confirmation.

---

## 🛠 Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth (JWT & Session persistence)
- **AI Engine**: Google Gemini API via Supabase Edge Functions
- **Sound Generation**: Web Audio API (Brownian, Pink, White noise oscillators & harmonic biquad filters)

---

## 🚀 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A free [Supabase](https://supabase.com/) account

### Step 1: Clone Repository
```bash
git clone https://github.com/Enoch1702/StudyZone.git
cd StudyZone/studyzone
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📦 Production Build & Deployment

### Build for Production
```bash
npm run build
```
The optimized bundle will be created in `dist/` with automated code splitting for vendor libraries and routes.

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Set the Root Directory to `studyzone` (if deploying from the subfolder) or leave default.
4. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. The included `vercel.json` will automatically handle SPA client-side routing.

---

## 📄 License
This project is licensed under the MIT License.
