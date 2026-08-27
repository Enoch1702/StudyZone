# StudyZone — Intelligent Personal Learning System

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fstudy--zone--wheat.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://study-zone-wheat.vercel.app)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite%206-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br />

> 🌐 **Live Production Application**: **[https://study-zone-wheat.vercel.app](https://study-zone-wheat.vercel.app)**  

</div>

---

## 📖 Overview

**StudyZone** is a full-stack, dark-first intelligent learning platform built to help students, developers, and self-directed learners organize coursework, master difficult subjects through spaced repetition, track daily study momentum, and receive contextual AI coaching backed by verified study metrics.

The application follows a standard product flow:
1. **Public Showcase (`/`)**: Discover StudyZone's methodology, explore features, interactive product previews, soundscapes, and color themes.
2. **Authentication (`/login` & `/signup`)**: Secure email authentication and session management powered by Supabase Auth.
3. **Personal Workspace (`/dashboard`)**: Distraction-free, dark-first learning operating system.

---

## 🌟 Core Feature Matrix

### 1. 🏠 Public Landing Experience (`/`)
- **5-Step Learning Methodology**: Visual representation of the `PLAN → FOCUS → TRACK → IMPROVE → REMEMBER` cycle.
- **Interactive Feature Matrix**: Deep-dive showcase detailing course hierarchy, AI coaching, calendar integration, and spaced repetition.
- **Interactive Product Tour**: Switch between live previews of Dashboard, Focus Mode, Timetable, Flashcards, and Analytics.
- **Privacy & Engineering Guarantee**: Clear explanation of client-side RLS isolation, server-side AI keys, and Web Audio synthesis.
- **SEO & Crawl Security**: `robots.txt` automatically protects private workspace routes (`/dashboard`, `/tasks`, `/settings`, etc.) while allowing public indexation of `/`.

### 2. 📊 Smart Dashboard & Best Next Action Engine (`/dashboard`)
- **Best Next Action Recommendation**: Algorithmic evaluation of pending tasks, urgency scores, and deadlines to highlight the highest-leverage task.
- **Real-Time Workload Metrics**: Total tasks, completion rates, 7-day workload horizon, and active learning plan progress.
- **Integrated Study Logger**: Rapidly record focus blocks with subject tags, linked tasks, and notes.

### 3. 🎨 5 Curated Dark-First Color Themes
- **Midnight Slate** *(Default)*: Classic zinc with vivid electric blue accent (`#4f7cff`).
- **Deep Ocean**: Marine abyss navy with ice cyan accent (`#38bdf8`).
- **Nordic Forest**: Pine forest evergreen with emerald accent (`#10b981`).
- **Obsidian Amethyst**: Deep violet with royal purple accent (`#a855f7`).
- **Warm Espresso**: Dark cocoa with warm amber gold accent (`#f59e0b`).
- *Persistent via `localStorage` and managed dynamically via CSS custom property tokens.*

### 4. ⏱ Focus Mode & Global Persistent Audio (`/focus`)
- **Structured Focus Presets**: Classic Pomodoro (25m/5m), Deep Work (50m/10m), Extended Focus (90m/20m), Quick Focus (15m/5m), and Custom interval modes.
- **App-Wide Persistent Soundscapes**: Audio playback continues seamlessly in the background across all pages (`/dashboard`, `/tasks`, `/calendar`, etc.) via a root `<AudioProvider>`.
- **Global Audio Floating Bar**: Inline volume control, play/pause toggle, and drawer soundscape picker accessible from any page.
- **1-Click Focus Task Completion**: When completing a focus block linked to a specific task, the modal offers an instant 1-click action to mark that task as completed in Supabase.
- **10 Pure Synthesized Web Audio Soundscapes** (Zero audio downloads or streaming latency):
  - 🌧 **Gentle Rain**: Filtered pink noise with 1.4kHz lowpass sheen.
  - 🌊 **Ocean Waves**: Rhythmic 0.12Hz LFO modulated rolling surf swells.
  - 🍃 **Forest Wind**: Resonant sweeping bandpass (400Hz center, Q=2.5) with gentle breeze LFO.
  - 🔥 **Warm Campfire**: Deep sub-rumble with randomized amplitude crackle impulses.
  - ✨ **528Hz Clarity**: Pure 528Hz transformation tone with sub-octave drone.
  - 🔊 **432Hz Harmonic**: Triple-harmonic calm focus drone.
  - 🟤 **Brown Noise**: Deep Brownian rumble for ADHD & coding flow.
  - 🌸 **Pink Noise**: Balanced 1/f soothing frequency.
  - ⚪ **White Noise**: Full-spectrum masking frequency.
  - 🔇 **Mute**: Pure silent timer.
- **Screen WakeLock API & Fullscreen Mode**: Keeps display awake during active study intervals.

### 5. 🧠 Spaced Repetition Flashcards & SuperMemo SM-2 (`/flashcards`)
- **SuperMemo SM-2 Algorithm**: Mathematical implementation calculating response quality ($q \in [0..5]$), consecutive repetitions ($n$), updated intervals ($I$), and variable Easiness Factor ($EF \ge 1.3$).
- **3D Active Recall Deck View**: Flip cards with keyboard navigation (`Space`, `1-4` ratings: *Again*, *Hard*, *Good*, *Easy*).
- **AI Deck Generator (Proposal & Approval Flow)**: Prompts Gemini AI for question/answer pairs from any topic or lecture notes; presents an interactive review modal before persisting to Supabase.
- **Resilient Cache Fallback**: Supabase is the primary source of truth; LocalStorage functions as a read-through cache without conflicting client IDs.

### 6. 📅 Interactive Learning Calendar & Timetable (`/calendar`)
- **6-Week $\times$ 7-Day Month Grid**: Unified timetable aggregating deadlines, scheduled tasks, and focus sessions.
- **Future Date & Month Scheduling**: Schedule tasks and deadlines for specific dates in any future month with instant month auto-synchronization.
- **Timezone-Safe Date Handling**: Uses unified local `toLocalDateKey` formatting to prevent UTC date-boundary shifts.
- **Interactive Day Inspector**: Side drawer opening on date selection with item breakdowns and a 1-click **"Focus"** launcher.

### 7. 🤖 Contextual AI Study Assistant & Chat History (`/ai-assistant`)
- **Multi-Thread Chat History**: Scoped `ai_conversations` and `ai_messages` tables with cascade deletion.
- **Context-Aware Coaching**: Injects 7-day study analytics, task completion rates, and upcoming workload.
- **Action Proposal Approval System**: AI proposes structured tasks, deadlines, and learning plans. **Zero autonomous writes are permitted**—mutations require explicit user review and approval before execution.

### 8. 🧭 Structured Learning Plans & Milestone Hierarchy (`/plans`)
- **Milestone Roadmaps**: Break major subjects or semester goals into progressive milestones.
- **Deterministic Progress Tracking**: Progress automatically recalculates based on completed linked tasks and milestones.

### 9. 📈 Learning Insights & Analytics (`/analytics`)
- **7-Day Consistency Tracker**: Daily active day checkmarks and study streak tracking.
- **Learning Area Balance**: Distribution of time spent across different subjects.
- **Upcoming Workload Horizon**: Daily load bar distribution over the next 7 days.

### 10. 🔍 Global Command Palette & Complete Data Portability
- **Command Palette (`Cmd + K` / `Ctrl + K`)**: Instant search and navigation across Subjects, Tasks, Deadlines, Plans, and Decks.
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
│                  Hardened Service Layer                     │
│  (Dual-Casing Normalization: camelCase & snake_case Safe)   │
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
- **Logout Silence Guarantee**: Audio generators and user sessions are instantly severed upon logout or navigation to unauthenticated routes.

---

## 🛠 Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth (JWT & Session persistence)
- **AI Engine**: Google Gemini 2.5 Flash via Supabase Edge Functions
- **Sound Generation**: Web Audio API (Generative pink/brown noise, resonant biquad filters, harmonic drone oscillators)

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
Create `.env` in `studyzone/`:
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

## 📦 Production Deployment (Vercel)

### Option A: Deploying from Repository Root (Recommended)
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New &rarr; Project** and import `StudyZone`.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `studyzone`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the **Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
5. Click **Deploy**. Vercel will build the project and output your live production URL.

### Option B: Deploying with Root `vercel.json`
If deploying with root directory set to `./`, the included root `vercel.json` automatically triggers `cd studyzone && npm run build` and serves `studyzone/dist` with full SPA rewrite support.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
