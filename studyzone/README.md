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
> 💡 *A focused, production-grade learning operating system featuring structured study notes, spaced repetition flashcards, real-time synthesized audio soundscapes, interactive timetables, and context-aware AI study assistance.*

</div>

---

## 📖 Overview

**StudyZone** is a comprehensive, production-grade learning operating system engineered for students, developers, and self-directed learners. It integrates curriculum planning, Pomodoro focus cycles, structured study notes, mathematical spaced repetition (SuperMemo SM-2), weekly timetable synchronization, and AI study coaching into a unified, distraction-free interface.

Designed with an ultra-premium visual hierarchy, StudyZone features a clean **StudyZone Light (Daylight White)** default theme with subtle gradient meshes and elevated card surfaces, alongside 5 specialized Dark palettes, accessible via a **1-click Sun/Moon theme toggle** across all pages.

---

## 🔄 The 6-Stage Learning Workflow

StudyZone unifies the complete learning lifecycle into a cohesive experience without tool fragmentation:

```
PLAN ────► FOCUS ────► CAPTURE ────► TRACK ────► IMPROVE ────► REMEMBER
 (Tasks)   (Pomodoro)   (Notes)    (Analytics)    (AI Coach)   (SM-2 Flashcards)
```

1. **PLAN**: Organize subject areas, actionable tasks, assignment deadlines, and milestone plans.
2. **FOCUS**: Enter flow state with configurable Pomodoro timers and procedural synthesized Web Audio noise soundscapes.
3. **CAPTURE**: Take markdown study notes, summarize key takeaways, and log post-session reflections.
4. **TRACK**: Evaluate daily study consistency, 7-day study streaks, workload balance, and task completion.
5. **IMPROVE**: Receive personalized AI study coaching backed by real verified metrics.
6. **REMEMBER**: Retain knowledge long-term with SuperMemo SM-2 spaced repetition decks generated from your notes.

---

## 🌟 Key Capabilities

### 1. 📝 Study Notes & Knowledge Management (`/notes`)
- **Focused Markdown Editor**: Practical study formatting including Headings (H1/H2), Bold, Italic, Bullet Lists, Numbered Lists, Code Blocks, Blockquotes, and live preview rendering.
- **Subject-Linked Knowledge Base**: Link notes to specific subject areas with tag categorization and quick filtering.
- **Verified Save State Tracker**: Clear auto-save indicator (`Saving...`, `Saved [time]`, `Unsaved changes`, Error state) with local storage read-through cache fallback.
- **AI Note Assistance (Human-in-the-Loop)**:
  - **Summarize Note**: Generates concise bullet-point takeaways.
  - **Self-Test Questions**: Creates 4 active recall practice questions directly from note content.
  - **Explain Simply**: Simplifies difficult concepts using the Feynman technique.
  - **Improve Structure**: Formats disorganized notes into structured sections.
  - *All AI actions produce proposals requiring explicit user approval before applying.*
- **1-Click Flashcard Extraction**: Convert key concepts in any study note into a SuperMemo SM-2 flashcard deck with interactive card review before database insertion.

### 2. 📊 Smart Dashboard & "Best Next Action" Engine (`/dashboard`)
- **Algorithmic Best Next Action**: Evaluates pending deadlines, task urgency scores, and backlog age to recommend the single highest-leverage action item.
- **Dynamic Welcome & Learner Profiling**: Displays context-specific greetings adapted to learner category (`college`, `school`, `developer`, `exam_prep`, `lifelong`).
- **Live Stat Cards**: Real-time counters for active tasks, completion rate percentages, upcoming 7-day deadlines, and overall curriculum milestones.
- **Recent Notes & Fast Logger**: Quick access to recent study notes and 1-click focus session logging.

### 3. 🎨 Adaptive Theme System (Default Light + 5 Dark Palettes)
- ☀️ **StudyZone Light** *(Default)*: Clean, high-contrast daylight workspace with multi-layer surface elevation (`#f8fafc` canvas, `#ffffff` card surface, `#0f172a` deep slate typography, `#2563eb` electric blue accent).
- 🌙 **Midnight Slate**: Deep zinc with vivid cobalt blue accents (`#4f7cff`).
- 🌊 **Deep Ocean**: Marine abyss navy with ice cyan highlights (`#38bdf8`).
- 🌲 **Nordic Forest**: Pine evergreen with emerald highlights (`#10b981`).
- 🔮 **Obsidian Amethyst**: Royal obsidian with vibrant purple accents (`#a855f7`).
- ☕ **Warm Espresso**: Dark roasted cocoa with warm amber gold highlights (`#f59e0b`).
- **1-Click Theme Switcher**: Dedicated Sun/Moon toggle in the navigation header on both public and authenticated views, with local persistence via `localStorage`.

### 4. ⏱ Distraction-Free Focus Mode & Synthesized Soundscapes (`/focus`)
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
- **Automatic Session & Task Completion**: Completed study blocks automatically log study minutes to PostgreSQL and offer a 1-click prompt to mark linked tasks as completed or write a reflection note.
- **Screen WakeLock API**: Keeps the display active during deep study sessions.

### 5. 🧠 Spaced Repetition Flashcards with SuperMemo SM-2 (`/flashcards`)
- **Mathematical SM-2 Algorithm**: Calculates exact repetition intervals ($I$), consecutive correct recall counts ($n$), and easiness factors ($EF \ge 1.3$) based on user recall ratings ($q \in [0..5]$).
- **Interactive 3D Card Viewer**: Smooth 3D flip animation with keyboard navigation (`Space` to flip, keys `1`–`4` for rating).
- **AI Deck Generator**: Generate structured flashcard decks from any topic or note using Gemini AI, with an interactive review and approval modal before saving.
- **1-Click Starter Deck**: Built-in verified sample deck covering active recall, cognitive load, and CS fundamentals for immediate practice.

### 6. 📅 Unified Study Calendar & Timetable (`/calendar`)
- **6-Week $\times$ 7-Day Timetable Grid**: Aggregates assignments, exam deadlines, scheduled tasks, and past study session history.
- **Future Date & Month Scheduling**: Add tasks or deadlines to any date in the future with automatic month navigation.
- **Timezone-Safe Date Processing**: Formatted with local `toLocalDateKey` to eliminate UTC boundary shifts.
- **Interactive Day Inspector**: Side drawer detailing daily schedule with 1-click **"Start Focus"** launchers.

### 7. 🤖 Contextual AI Study Assistant & Planner (`/ai-assistant`)
- **Multi-Thread Chat History**: Manage, rename, and search past study conversations stored in PostgreSQL.
- **Context-Aware Coaching**: Dynamically analyzes the learner's 7-day study consistency, pending deadlines, and neglected subjects.
- **Human-in-the-Loop Action Proposals**: AI generates structured proposals (tasks, revision schedules, learning plans). **Zero autonomous writes are permitted**—every proposal requires explicit user confirmation before database insertion.

### 8. 🧭 Structured Learning Plans & Roadmaps (`/plans`)
- **Milestone Decomposition**: Organize long-term targets into sequential milestones and granular tasks.
- **Deterministic Progress Tracking**: Progress automatically recalculates as linked tasks are completed.

### 9. 📈 Learning Analytics & Habit Tracking (`/analytics`)
- **7-Day Consistency Tracker**: Visual daily study streak counter with consecutive day tracking.
- **Subject Time Distribution**: Breakdown of study investment across enrolled subjects.
- **Workload Forecasting**: Daily load bar distribution over the upcoming 7 days to prevent burnout.

### 10. 🔍 Global Search & Complete Data Portability
- **Command Palette (`Cmd + K` / `Ctrl + K`)**: Instant search and navigation across Study Notes, Subjects, Tasks, Deadlines, Plans, and Decks.
- **Full JSON Backup**: 1-click export of complete user workspace data including `study_notes`.
- **CSV Exports**: Formatted and quote-escaped exports for Notes, Tasks, Study Sessions, and Flashcards.

---

## 🏗 Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   React 19 + Vite 6 Single Page App         │
│                 Tailwind CSS v4 (Design System Tokens)      │
├──────────────────────────────┬──────────────────────────────┤
│ Frontend Features            │ Backend & AI Services        │
│ ├─ Study Notes (Markdown)    │ ├─ Supabase Auth & RLS       │
│ ├─ Spaced Repetition (SM-2)  │ ├─ PostgreSQL Storage        │
│ ├─ Web Audio Sound Generator │ ├─ Google Gemini 2.5 Flash   │
│ ├─ Timetable Calendar Engine │ ├─ Realtime DB Subscriptions │
│ └─ Learning Analytics Engine │ └─ Data Export (JSON / CSV)  │
└──────────────────────────────┴──────────────────────────────┘
```

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Motion (v12), Lucide React.
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security on all tables).
- **AI Engine**: Google Gemini API via serverless backend function with strict prompt engineering and human-in-the-loop approval.
- **Audio Synthesis**: Web Audio API (oscillators, white/pink/brown noise procedural buffers, biquad filters).
- **Deployment**: Vercel CI/CD pipeline connected to GitHub `main` branch.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ and npm
- Supabase Project URL & Anon Key
- Google Gemini API Key

### Installation

```bash
# Clone repository
git clone https://github.com/Enoch1702/StudyZone.git
cd StudyZone/studyzone

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and GEMINI_API_KEY

# Run local development server
npm run dev
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
