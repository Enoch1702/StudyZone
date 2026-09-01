# StudyZone — Technical Architecture & Developer Interview Guide

This document is a comprehensive technical reference for engineers, reviewers, and interviewers. It details the complete architecture, data flows, security design, database relations, and component implementations of **StudyZone**.

---

## 🏛️ 1. Overall System Architecture

StudyZone is built as a modular single-page application (SPA) backed by serverless PostgreSQL:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Frontend Layer (Vite 6 SPA)                 │
│         Tailwind CSS v4 (Design System Tokens) + Motion (v12)          │
├────────────────────────────────────────────────────────────────────────┤
│                          Application State & Context                   │
│  ├─ AuthContext (User session & profile hydration)                     │
│  ├─ ThemeContext (7 Theme presets + persistence)                       │
│  ├─ AudioContext (Web Audio procedural soundscapes & persistent bar)   │
│  └─ SearchContext (Global Cmd+K command palette)                       │
├────────────────────────────────────────────────────────────────────────┤
│                          Service Layer (Client SDK)                    │
│  ├─ notesService.js            ├─ focusTimerService.js                 │
│  ├─ flashcardsService.js       ├─ smartNextActionService.js            │
│  ├─ tasksService.js            ├─ learningAnalyticsService.js          │
│  ├─ subjectsService.js         ├─ learningPlansService.js              │
│  └─ deadlinesService.js        └─ aiService.js                         │
├───────────────────────────────────┬────────────────────────────────────┤
│ Supabase Backend (PostgreSQL)     │ Serverless AI Edge Engine          │
│  ├─ Row Level Security (RLS)      │  ├─ Google Gemini 2.5 Flash API    │
│  ├─ JWT Token Verification        │  ├─ Strict JSON schema validation  │
│  └─ Real-time DB triggers         │  └─ Human-in-the-Loop review gate  │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Architectural Flow:
1. **User Interaction**: UI components trigger actions through isolated context hooks or direct service calls.
2. **Service Layer**: Pure asynchronous services encapsulate validation, query construction, and resilience caching (`localStorage` read-through/write-through).
3. **Database Client**: `@supabase/supabase-js` dispatches authenticated HTTP/WebSocket requests with the user's JWT token attached in the `Authorization` header.
4. **PostgreSQL RLS**: PostgreSQL evaluates user identity (`auth.uid() = user_id`) on every query before returning rows.

---

## 🔐 2. Authentication & Security Model

### A. Authentication Flow
```
User (Login/Signup) 
  ──► Supabase Auth (`supabase.auth.signInWithPassword`)
  ──► Issues JWT Access Token & Refresh Token
  ──► Stored in browser storage (managed by Supabase Client)
  ──► `onAuthStateChange` event fires
  ──► `AuthContext` hydrates `user` object and queries `public.profiles`
  ──► Protected routes (`ProtectedRoute.jsx`) check authentication status
```

### B. The Security Model: Anon Key vs. Service Role Key
- **Anon Key (`VITE_SUPABASE_ANON_KEY`)**:
  - Safe to expose in client code.
  - Acts as an API gateway identifier.
  - **Cannot bypass Row Level Security**. Every request made with the anon key is restricted to rows permitted by PostgreSQL RLS policies for `auth.uid()`.
- **Service Role Key**:
  - **Never bundled into the client**.
  - Bypasses RLS completely; only stored in secure server-side environments or edge functions.

### C. Row Level Security (RLS) Multi-Tenant Isolation
Every table in StudyZone has RLS enabled (`ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`).
Example policy:
```sql
CREATE POLICY "Users can manage own study notes"
  ON public.study_notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
Even if a malicious user attempts to query another user's UUID directly, PostgreSQL returns `0 rows`.

---

## 🤖 3. AI Architecture & Human-in-the-Loop Workflow

StudyZone enforces a strict **Human-in-the-Loop (HITL)** policy for all generative AI interactions:

```
User Prompt / Note Content / Topic
  ──► `sendMessage()` in `aiService.js`
  ──► Proxied through backend edge function / Google Gemini 2.5 Flash
  ──► AI responds with structured JSON proposals
  ──► React renders an interactive Approval & Review Modal
  ──► User inspects, edits, or deselects individual proposal items
  ──► ONLY upon explicit "Approve & Save" click are records written to Supabase
```

**Zero autonomous writes are permitted**. The AI cannot unilaterally delete, update, or create database records.

---

## 🗄️ 4. Relational Database Schema & Entities

```
┌─────────────────┐       1:1       ┌──────────────────┐
│   auth.users    │ ─────────────── │ public.profiles  │
└─────────────────┘                 └──────────────────┘
         │
         │ 1:N
         ├────────────────────────────────┬───────────────────────────────┐
         ▼                                ▼                               ▼
┌─────────────────┐              ┌──────────────────┐            ┌──────────────────┐
│ public.subjects │              │   public.tasks   │            │public.study_notes│
└─────────────────┘              └──────────────────┘            └──────────────────┘
         │ 1:N                            │                               │
         ├─────────────────┐              │ (optional FK)                 │
         ▼                 ▼              ▼                               │
┌─────────────────┐ ┌───────────────┐ ┌────────────────────┐              │
│public.deadlines │ │public.sessions│ │public.milestones   │              │
└─────────────────┘ └───────────────┘ └────────────────────┘              │
         │                                │                               │
         │ 1:N                            │ N:1                           │
         ▼                                ▼                               ▼
┌─────────────────┐              ┌────────────────────┐          ┌──────────────────┐
│public.flashcards│              │public.learn_plans  │          │Flashcard Decks   │
└─────────────────┘              └────────────────────┘          └──────────────────┘
```

### Key Tables & Responsibilities:
1. **`profiles`**: Extended user metadata (learner type, primary goal, display name, avatar, `onboarding_completed`).
2. **`subjects`**: User's curriculum topics (name, color, description).
3. **`tasks`**: Action items (title, priority `low|medium|high|urgent`, status `pending|in-progress|completed`, due date, subject FK, milestone FK).
4. **`deadlines`**: High-stakes target dates (exams, assignments, project submissions).
5. **`study_sessions`**: Focus duration records (duration minutes, started_at, subject FK, task FK).
6. **`study_notes`**: Markdown notes (title, content, summary, tags array, pinned status, subject FK).
7. **`flashcard_decks` & `flashcards`**: Spaced repetition items (front, back, `repetition_count`, `interval_days`, `easiness_factor`, `next_review_at`).
8. **`learning_plans` & `learning_milestones`**: Hierarchical roadmap goals with progress recalculation.

---

## 💡 5. Feature Deep Dives & Interview Reference

### A. Focus Mode & Pure Web Audio Synthesis
- **Problem Solved**: Distraction and ambient noise during deep study blocks.
- **Why Web Audio API over MP3 audio files?**
  1. **Zero Bandwidth**: Sounds are generated mathematically via procedural algorithms in real-time. Zero streaming cost.
  2. **Zero Latency**: Audio starts instantaneously on user click.
  3. **Customization**: Sounds (Rain, Ocean Waves, Campfire, 528Hz Drone, Brownian Noise) use biquad filters and LFO oscillators parameterized in memory.
  4. **Persistent Playback**: The global `AudioContext` resides in a root `<AudioProvider>`, allowing users to navigate between dashboard, notes, and calendar while sound continues seamlessly.

### B. Mathematical Spaced Repetition (SuperMemo SM-2)
- **Problem Solved**: The Ebbinghaus forgetting curve.
- **Algorithm Implementation (`flashcardsService.js`)**:
  - Quality score ($q \in [0..5]$): `Again` (1), `Hard` (3), `Good` (4), `Easy` (5).
  - Easiness Factor update: $EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$, with $EF \ge 1.3$.
  - Interval calculation:
    - $n = 1 \implies I = 1\text{ day}$
    - $n = 2 \implies I = 6\text{ days}$
    - $n > 2 \implies I = I_{n-1} \times EF$
  - User Experience: Complex math notation is hidden behind intuitive labels (`Again`, `Hard`, `Good`, `Easy`) while exact intervals update in PostgreSQL.

### C. Best Next Action Engine (`smartNextActionService.js`)
- **Problem Solved**: Decision fatigue when opening the app.
- **Deterministic Priority Hierarchy**:
  1. Overdue High/Urgent Priority Tasks $\implies$ Immediate critical backlog.
  2. Deadlines Due Today $\implies$ Final revision and submission.
  3. Tasks Due Today $\implies$ Daily scheduled focus.
  4. Neglected Subject Areas (no study session in $\ge 7$ days).
  5. Active Learning Plan Milestone Tasks $\implies$ Roadmap momentum.
  6. Next queue item fallback.
  7. If empty $\implies$ Actionable "Get Started" onboarding card.

### D. Study Notes & Knowledge Workflow (`/notes`)
- **Problem Solved**: Disorganized learning notes and lack of review.
- **Architecture**:
  - Markdown editor with live preview toggle.
  - Multi-tier resilience: In-memory state $\to$ debounced auto-save to Supabase $\to$ local storage fallback cache.
  - Note-to-Flashcards pipeline: Extracts key concepts from notes and populates SM-2 decks with 1 click.

---

## 🎯 6. Developer Interview Q&A Quick Sheet

| Interview Question | Concise Technical Answer |
| :--- | :--- |
| **How is multi-tenancy handled?** | Multi-tenancy is enforced at the database level using PostgreSQL Row Level Security (RLS). Every table includes a `user_id` foreign key matching `auth.uid()`. Even if an API request attempts to access another user's ID, the query returns 0 rows. |
| **How does AI prevent hallucinated data corruption?** | All AI operations use strict JSON output schemas and a Human-in-the-Loop review modal. The frontend presents proposed items for user inspection before calling Supabase write endpoints. |
| **Why use Web Audio synthesis for background noise?** | Web Audio procedural generation creates infinite non-looping audio (Brownian noise, binaural drones, rain) directly on the client CPU, requiring 0kb of audio streaming and zero network requests. |
| **How is date/time consistency preserved across timezones?** | All timestamps are stored in UTC in PostgreSQL (`TIMESTAMPTZ`). For calendar grouping and daily streak calculations, local dates are normalized using a custom `toLocalDateKey` utility to eliminate UTC boundary shift bugs. |
| **How does the theme engine work?** | Built using CSS variable tokens in Tailwind CSS v4. Theme classes applied to `<html>` dynamically switch background meshes, surface elevations, and accent palettes with `localStorage` persistence. |
