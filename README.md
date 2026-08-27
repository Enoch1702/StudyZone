# StudyZone — Intelligent Personal Learning System

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fstudy--zone--v1.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://study-zone-v1.vercel.app)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite%206-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br />

> 🌐 **Live Production Application**: **[https://study-zone-v1.vercel.app](https://study-zone-v1.vercel.app)**  
> 💡 *A modern, full-stack intelligent learning operating system featuring spaced repetition flashcards, real-time synthesized audio soundscapes, interactive timetables, and context-aware AI coaching.*

</div>

---

## 📖 Overview

**StudyZone** is a comprehensive, production-grade learning operating system engineered for students, developers, and self-directed learners. It integrates curriculum planning, Pomodoro focus cycles, mathematical spaced repetition (SuperMemo SM-2), weekly timetable synchronization, and AI study coaching into a unified, distraction-free interface.

Designed with an ultra-premium visual hierarchy, StudyZone features a clean **StudyZone Light (Daylight White)** default theme with subtle gradient meshes and elevated card surfaces, alongside 5 specialized Dark palettes, accessible via a **1-click Sun/Moon theme toggle** across all pages.

---

## 🌟 Key Capabilities

### 1. 📊 Smart Dashboard & "Best Next Action" Engine (`/dashboard`)
- **Algorithmic Best Next Action**: Evaluates pending deadlines, task urgency scores, and backlog age to recommend the single highest-leverage action item.
- **Dynamic Welcome & Learner Profiling**: Displays context-specific greetings adapted to learner category (`college`, `school`, `developer`, `exam_prep`, `lifelong`).
- **Live Stat Cards**: Real-time counters for active tasks, completion rate percentages, upcoming 7-day deadlines, and overall curriculum milestones.
- **Fast Session Logger**: Log focus blocks with linked subject tags, tasks, and reflections.

### 2. 🎨 Adaptive Theme System (Default Light + 5 Dark Palettes)
- ☀️ **StudyZone Light** *(Default)*: Clean, high-contrast daylight workspace with multi-layer surface elevation (`#f8fafc` canvas, `#ffffff` card surface, `#0f172a` deep slate typography, `#2563eb` electric blue accent).
- 🌙 **Midnight Slate**: Deep zinc with vivid cobalt blue accents (`#4f7cff`).
- 🌊 **Deep Ocean**: Marine abyss navy with ice cyan highlights (`#38bdf8`).
- 🌲 **Nordic Forest**: Pine evergreen with emerald highlights (`#10b981`).
- 🔮 **Obsidian Amethyst**: Royal obsidian with vibrant purple accents (`#a855f7`).
- ☕ **Warm Espresso**: Dark roasted cocoa with warm amber gold highlights (`#f59e0b`).
- **1-Click Theme Switcher**: Dedicated Sun/Moon toggle in the navigation header on both public and authenticated views, with local persistence via `localStorage`.

### 3. ⏱ Distraction-Free Focus Mode & Synthesized Soundscapes (`/focus`)
- **Configurable Interval Presets**: Classic Pomodoro (25m/5m), Deep Work (50m/10m), Extended Focus (90m/20m), Quick Focus (15m/5m), and Custom Intervals.
- **Pure Web Audio Ambient Engine**: 10 procedural soundscapes generated in real-time with zero external audio assets, zero streaming bandwidth, and zero network latency:
  - 🌧 **Gentle Rain**: Filtered pink noise with 1.4kHz lowpass sheen.
  - 🌊 **Ocean Waves**: Rhythmic 0.12Hz LFO modulated rolling surf swells.
  - 🍃 **Forest Wind**: Resonant sweeping bandpass (400Hz center, Q=2.5) with gentle breeze LFO.
  - 🔥 **Warm Campfire**: Sub-rumble with randomized amplitude crackle impulses.
  - ✨ **528Hz Clarity**: Pure transformation tone with sub-octave drone.
  - 🔊 **432Hz Harmonic**: Triple-harmonic calm focus drone.
  - 🟤 **Brown Noise**: Deep Brownian rumble for ADHD & coding flow.
  - 🌸 **Pink Noise**: Balanced 1/f soothing frequency.
  - ⚪ **White Noise**: Full-spectrum acoustic masking frequency.
  - 🔇 **Mute**: Silent countdown timer.
- **App-Wide Persistent Audio Bar**: Background soundscape continues seamlessly when navigating between pages via a root `<AudioProvider>`.
- **Automatic Session & Task Completion**: Completed study blocks automatically log study minutes to PostgreSQL and offer a 1-click prompt to mark linked tasks as completed.
- **Screen WakeLock API**: Keeps the display active during deep study sessions.

### 4. 🧠 Spaced Repetition Flashcards with SuperMemo SM-2 (`/flashcards`)
- **Mathematical SM-2 Algorithm**: Calculates exact repetition intervals ($I$), consecutive correct recall counts ($n$), and easiness factors ($EF \ge 1.3$) based on user recall ratings ($q \in [0..5]$).
- **Interactive 3D Card Viewer**: Smooth 3D flip animation with keyboard navigation (`Space` to flip, keys `1`–`4` for rating).
- **AI Deck Generator**: Generate structured flashcard decks from any topic, textbook excerpt, or lecture notes using Gemini AI, with an interactive review and approval modal before saving.
- **Deck Organization**: Filter by subject, track mastery percentages, and view upcoming review counts.

### 5. 📅 Unified Study Calendar & Timetable (`/calendar`)
- **6-Week $\times$ 7-Day Timetable Grid**: Aggregates assignments, exam deadlines, scheduled tasks, and past study session history.
- **Future Date & Month Scheduling**: Add tasks or deadlines to any date in the future with automatic month navigation.
- **Timezone-Safe Date Processing**: Formatted with local `toLocalDateKey` to eliminate UTC boundary shifts.
- **Interactive Day Inspector**: Side drawer detailing daily schedule with 1-click **"Start Focus"** launchers.

### 6. 🤖 Contextual AI Study Assistant & Planner (`/ai-assistant`)
- **Multi-Thread Chat History**: Manage, rename, and search past study conversations stored in PostgreSQL.
- **Context-Aware Coaching**: Dynamically analyzes the learner's 7-day study consistency, pending deadlines, and neglected subjects.
- **Human-in-the-Loop Action Proposals**: AI generates structured proposals (tasks, revision schedules, learning plans). **Zero autonomous writes are permitted**—every proposal requires explicit user confirmation before database insertion.

### 7. 🧭 Structured Learning Plans & Roadmaps (`/plans`)
- **Milestone Decomposition**: Organize long-term targets into sequential milestones and granular tasks.
- **Deterministic Progress Tracking**: Progress automatically recalculates as linked tasks are completed.

### 8. 📈 Learning Analytics & Habit Tracking (`/analytics`)
- **7-Day Consistency Tracker**: Visual daily study streak counter with consecutive day tracking.
- **Subject Time Distribution**: Breakdown of study investment across enrolled subjects.
- **Workload Forecasting**: Daily load bar distribution over the upcoming 7 days to prevent burnout.

### 9. 🔍 Global Search & Complete Data Portability
- **Command Palette (`Cmd + K` / `Ctrl + K`)**: Instant search and navigation across Subjects, Tasks, Deadlines, Plans, and Decks.
- **Full JSON Backup**: 1-click export of complete user workspace data.
- **CSV Exports**: Formatted and quote-escaped exports for Tasks, Study Sessions, and Flashcards.

---

## 🏗 Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 + Vite Frontend                 │
│  (Tailwind CSS v4 · Motion · Lucide Icons · Web Audio API)  │
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

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) with semantic CSS variables |
| **Animation Engine** | [Motion](https://motion.dev/) (Framer Motion) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL with RLS) |
| **Authentication** | Supabase Auth (JWT session management with persistent storage) |
| **AI Processing** | Google Gemini 2.5 Flash via secure Supabase Edge Functions |
| **Audio Synthesis** | HTML5 Web Audio API (real-time procedural oscillators and noise filters) |

---

## 🔒 Security & Privacy Model

- **Strict Row Level Security (RLS)**: Enforced across all PostgreSQL tables. Every query is scoped with `USING (auth.uid() = user_id)`.
- **Client Anon Key Isolation**: The frontend bundle exposes only the public publishable anon key.
- **Zero API Key Leakage**: Google Gemini API keys are securely stored within Supabase Edge Function secrets.
- **Approval-First AI Mutations**: AI proposals cannot directly mutate user data without user review and confirmation.
- **Session Privacy Guarantee**: Audio synthesis nodes and local caches are immediately destroyed upon sign-out.

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0 or higher)
- A [Supabase](https://supabase.com/) project

### 1. Clone the Repository
```bash
git clone https://github.com/Enoch1702/StudyZone.git
cd StudyZone/studyzone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `studyzone/` directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Production Deployment (Vercel)

### Recommended Setup (Vercel Dashboard)
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
5. Click **Deploy**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
