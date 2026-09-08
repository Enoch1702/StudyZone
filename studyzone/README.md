# StudyZone — Personal Learning Workspace & Operating System

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fstudy--zone--v1.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://study-zone-v1.vercel.app)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite%206-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Synthesized-FF6F00?style=for-the-badge&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br />

> 🌐 **Live Production Application**: **[https://study-zone-v1.vercel.app](https://study-zone-v1.vercel.app)**  
> 📖 **Developer & Technical Guide**: **[../DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)**  
> 💡 *A focused, production-grade learning workspace engineered around human cognition: distraction-free single-column study notes, SuperMemo SM-2 spaced repetition, real-time procedural audio soundscapes, unified calendar and deadlines, and privacy-preserving AI tutoring.*

</div>

---

## 📖 Overview

**StudyZone** is an intuitive personal learning workspace designed for students, developers, and self-directed learners. It eliminates cognitive friction by organizing the complete study cycle into clear, dedicated surfaces without feature overlap or forced artificial sequences.

Built with modern web standards (React 19, Vite 6, Tailwind CSS v4, Supabase PostgreSQL, and Google Gemini Flash), StudyZone delivers a crisp visual hierarchy, accessible keyboard navigation, and a 1-click theme engine featuring radiant **StudyZone Light** alongside 5 dark palettes.

---

## 🔄 The Core Learning Model

StudyZone organizes learning into six interconnected stages:

```
ORGANIZE ────► FOCUS ────► CAPTURE ────► UNDERSTAND ────► PRACTICE ────► REVIEW
(Subjects/Tasks) (Focus Mode) (Study Notes)  (AI Tutor)   (SM-2 Decks)  (Insights)
```

- **Flexible Entry Points**: Students are never forced into a rigid linear order. You can jump straight into a 25-minute focus session without creating a task, write notes before organizing subjects, generate flashcards directly from a concept, or ask the AI Tutor without creating a learning plan.
- **One-Page, One-Primary-Purpose Rule**: Every route answers exactly one primary question:
  - **Dashboard** (`/dashboard`): *What should I do now?*
  - **Subjects** (`/subjects`): *What am I learning?*
  - **Tasks** (`/tasks`): *What do I need to complete?*
  - **Calendar & Deadlines** (`/calendar`): *When do I need to do it?*
  - **Focus Mode** (`/focus`): *Help me concentrate.*
  - **Study Notes** (`/notes`): *What knowledge do I want to capture?*
  - **AI Study Tutor** (`/ai-assistant`): *Help me understand this.*
  - **Flashcards** (`/flashcards`): *Help me remember this.*
  - **Learning Plans** (`/plans`): *How do I reach a larger goal?*
  - **Learning Insights** (`/analytics`): *How am I progressing?*
  - **Settings** (`/settings`): *How do I configure my workspace?*

---

## 🌟 Key Capabilities & Architecture

### 1. 🎯 Action-Oriented Dashboard (`/dashboard`)
- **What should I do now?**: Serves strictly as a daily cockpit to direct action rather than retrospective analytics.
- **Smart Next Action (Rule-Based)**: Deterministic, transparent heuristic with a clear *"Why this?"* explanation badge. Evaluates overdue tasks, tasks due today, high-priority backlog, neglected subjects, and recent activity without fake AI claims.
- **Getting Started Guide**: Dismissible 5-step onboarding card for new learners.
- **Today's Focus**: Actionable tasks due or scheduled today with 1-click completion.
- **Quick Focus**: 1-click launcher for an instant 25:00 focus timer.
- **Recent Notes**: Direct links to resume recent study notes.
- **Weekly Summary Strip**: Compact 1-line overview linking to dedicated Learning Insights.

### 2. 📝 Single-Column Distraction-Free Study Notes (`/notes`)
- **Single-Canvas Editor**: Replaces confusing split views with a focused writing canvas featuring clean `[ Edit ]` and `[ Preview ]` tabs.
- **Markdown Formatting Toolbar**: Headings (H1/H2), Bold, Italic, Bullet Lists, Numbered Lists, Code Blocks, Blockquotes, and horizontal dividers.
- **Draft Protection**: Debounced auto-save to Supabase PostgreSQL paired with local storage draft backup (`studyzone_note_draft_<id>`) and clear status indicators (`Saved`, `Saving...`, `Offline — saved locally`).
- **Non-Destructive Contextual AI**: Summarize Note, Explain Simply (Feynman technique), Quiz Me (3 active recall questions), and Improve Structure. All AI actions present interactive proposal modals with `[ Apply Changes ]`, `[ Copy ]`, and `[ Cancel ]`.
- **Direct AI Tutor Integration**: 1-click *"Ask AI Study Tutor about this Note"* button attaches the current note directly into the conversational tutor.

### 3. ⏱ Instant 1-Click Focus Mode & Procedural Soundscapes (`/focus`)
- **Immediate Start**: 25:00 timer starts with 1 click without requiring prior subject or task assignment (`subject_id = NULL`).
- **Guaranteed Single Log**: `sessionLoggedRef` ensures focus sessions are recorded exactly once upon completion without duplicate database writes on page refresh.
- **Pure Web Audio Ambient Soundscapes**: 10 real-time procedural synthesizers (Rain, Ocean Waves, Forest Wind, Campfire, 528Hz Drone, 432Hz Harmonic, Brown Noise, Pink Noise, White Noise, Mute) generated directly on client CPU with zero external audio streaming or latency.
- **Post-Session Reflection**: Completion modal offers optional subject linking and reflection notes.

### 4. 🧠 Automatic-First Spaced Repetition Flashcards (`/flashcards`)
- **Primary AI Generation**: Prominent `✨ Generate Flashcards` action creates active-recall cards from any topic or note in seconds.
- **Strict Validation & Deduplication**: JSON schema validation ensures single-concept cards, active-recall formatting, and question deduplication before presentation.
- **Interactive Review & Card Editing**: Students can inspect checkboxes, edit questions or answers inline, and regenerate before committing to Supabase.
- **SuperMemo SM-2 Algorithm**: Pure SM-2 scheduling ($I$, $n$, $EF \ge 1.3$) behind student-friendly ratings: `Again (<1d)`, `Hard (1d)`, `Good (3-6d)`, `Easy (>6d)`.

### 5. 🤖 Privacy-Preserving AI Study Tutor (`/ai-assistant`)
- **Strict Privacy Model**: `Explicit Context In → AI Processing → Response Out`. Zero silent querying or dumping of private student notes, tasks, or sessions.
- **Context Attachment**: Visual chip `[ 📄 Note: Title ✕ ]` allows attaching specific study notes (bounded at ~6,000 characters to prevent context truncation).
- **Academic Persona**: Expert tutor explaining concepts via analogies, step-by-step breakdowns, and code snippets, paired with quick follow-ups (*Explain Simpler*, *Give Example*, *Quiz Me*).

### 6. 🗂 Subjects as Knowledge Containers & Learning Plans as Roadmaps
- **Subjects (`/subjects`)**: Central knowledge containers aggregating linked notes count, active tasks count, flashcard decks count, and total focus minutes logged.
- **Safe Non-Destructive Deletion**: PostgreSQL foreign keys use `ON DELETE SET NULL`. Deleting a subject preserves all notes, tasks, flashcards, and study sessions as unassigned items.
- **Learning Plans (`/plans`)**: Optional chronological roadmaps for larger long-term goals (e.g. *"Master React"*, *"Prepare for Finals"*) with an integrated milestone list builder in the creation modal.

### 7. 📅 Unified Study Calendar & Deadlines (`/calendar`)
- **Cohesive Timetable**: Tabbed interface featuring `[ Calendar Grid ]` (monthly event cells and day inspector) and `[ Upcoming Deadlines ]` (filterable list with urgency countdown badges).
- **URL Preservation**: `/deadlines` routes directly into the Calendar's Deadlines view with zero broken links.
- **Global Search**: Command palette (`Ctrl + K` / `⌘K`) scopes across notes, subjects, tasks, flashcard decks, and learning plans.

### 8. 📊 Truthful Learning Analytics (`/analytics`)
- **Data Provenance**: Clearly displays *"📊 Your Data — Calculated strictly from database records"*.
- **Baseline Building Guard**: Accounts with `< 3` sessions display a warm *"🌱 Building Your Learning Baseline"* state rather than fabricated productivity scores or misleading zeroed charts.
- **AI Coach Separation**: Explicitly demarcates user-requested AI study coaching proposals from verified historical records.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, Motion (v12), Lucide React |
| **Backend & DB** | Supabase PostgreSQL, Row Level Security (RLS), Supabase Edge Functions (Deno) |
| **AI Intelligence**| Google Gemini 2.5 Flash API via secure Edge Function proxy |
| **Audio Engine** | Web Audio API (Synthesized BiquadFilters, GainNodes, LFOs) |
| **Local Storage** | Reserved strictly for unsaved draft recovery, theme, and UI preferences |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase Project with active schema migrations

### Installation
```bash
# Clone the repository
git clone https://github.com/Enoch1702/StudyZone.git
cd StudyZone/studyzone

# Install dependencies
npm install

# Configure environment variables (.env)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start local development server
npm run dev
```

### Verification & Quality Assurance
```bash
# Run ESLint (0 errors, 0 warnings enforced)
npm run lint

# Build production bundle
npm run build
```

---

## 📄 License

MIT License — Created with care for learners worldwide.
