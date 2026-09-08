# StudyZone — Technical Architecture & Developer Interview Guide

This document is a comprehensive technical reference for engineers, reviewers, and interviewers. It details the complete architecture, data flows, security design, database relations, component implementations, and UX refactoring decisions of **StudyZone**.

---

## 🏛️ 1. Overall System Architecture

StudyZone is built as a modular single-page application (SPA) backed by serverless PostgreSQL and Supabase Edge Functions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Frontend Layer (Vite 6 SPA)                 │
│         Tailwind CSS v4 (Design System Tokens) + Motion (v12)          │
├────────────────────────────────────────────────────────────────────────┤
│                          Application State & Context                   │
│  ├─ AuthContext (User session & profile hydration)                     │
│  ├─ ThemeContext (6 Theme presets + localStorage persistence)          │
│  ├─ AudioContext (Web Audio procedural soundscapes & persistent bar)   │
│  └─ SearchContext (Global Cmd+K / Ctrl+K command palette)              │
├────────────────────────────────────────────────────────────────────────┤
│                          Service Layer (Client SDK)                    │
│  ├─ notesService.js            ├─ focusTimerService.js                 │
│  ├─ flashcardsService.js       ├─ smartNextActionService.js (Heuristic)│
│  ├─ tasksService.js            ├─ learningAnalyticsService.js          │
│  ├─ subjectsService.js         ├─ learningPlansService.js              │
│  ├─ deadlinesService.js        └─ studySessionsService.js              │
├───────────────────────────────────┬────────────────────────────────────┤
│ Supabase Backend (PostgreSQL)     │ Serverless AI Edge Engine (Deno)   │
│  ├─ Row Level Security (RLS)      │  ├─ Google Gemini 2.5 Flash API    │
│  ├─ ON DELETE SET NULL cascades   │  ├─ Strict JSON schema validation  │
│  └─ UTC TIMESTAMPTZ storage       │  └─ Explicit Context In/Out model  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 🔄 2. Core Learning Model & 1-Page, 1-Purpose Principle

StudyZone organizes learning into six interconnected stages:

$$\text{ORGANIZE} \longrightarrow \text{FOCUS} \longrightarrow \text{CAPTURE} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{PRACTICE} \longrightarrow \text{REVIEW}$$

### Flexible Non-Linear Entry Points
Real students do not follow rigid application paths. StudyZone supports direct entry into any phase:
- Writing notes without prior focus sessions.
- Starting a 25:00 focus session without an assigned subject or task.
- Asking the AI Study Tutor conceptual questions without creating a subject.
- Generating flashcard decks directly from a topic.

### One-Page, One-Primary-Purpose Rule

| Page | Route | Primary User Question | Architectural Responsibility |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/dashboard` | *What should I do now?* | Daily action cockpit: next action heuristic, today's focus, 1-click focus launcher |
| **Subjects** | `/subjects` | *What am I learning?* | Knowledge containers linking notes, tasks, cards, and study time |
| **Tasks** | `/tasks` | *What do I need to complete?* | Track and check off actionable to-dos |
| **Calendar** | `/calendar` | *When do I need to do it?* | Unified timeline: monthly event grid & upcoming deadlines tracker |
| **Focus Mode** | `/focus` | *Help me concentrate.* | 1-click timer & 10 procedural Web Audio ambient soundscapes |
| **Study Notes** | `/notes` | *What knowledge do I want to capture?* | Distraction-free single-column editor, local draft caching, contextual AI tools |
| **AI Study Tutor** | `/ai-assistant` | *Help me understand this.* | Conversational tutor with explicit context attachment |
| **Flashcards** | `/flashcards` | *Help me remember this.* | SM-2 spaced repetition, AI generation with inline review & editing |
| **Learning Plans**| `/plans` | *How do I reach a larger goal?* | Optional multi-milestone structured roadmaps |
| **Learning Insights**| `/analytics`| *How am I progressing?* | Retrospective study time, consistency calendar, subject distribution |
| **Settings** | `/settings` | *How do I configure my workspace?* | Profile name, appearance themes, audio preferences |

---

## 🔐 3. Authentication & Security Model

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
Even if a user attempts to query another user's UUID directly, PostgreSQL returns `0 rows`.

---

## 🤖 4. AI Privacy Architecture & Human-in-the-Loop Workflow

StudyZone enforces an explicit privacy and safety boundary for all generative AI interactions:

```
[User Interface]
  │
  ├─ User attaches specific Note / Prompt
  │  (Bounded at ~6,000 characters to prevent overflow)
  ▼
[Supabase Edge Function: study-assistant]
  │
  ├─ Validates JWT Auth Token (`auth.uid()`)
  ├─ Injects strict Academic Tutor System Instruction
  ├─ Forwards ONLY explicit attached context + minimal subject names
  │  (Zero silent database scraping of tasks, notes, or sessions)
  ▼
[Google Gemini 2.5 Flash]
  │
  ├─ Generates Tutoring Response OR Structured Proposal JSON
  ▼
[Frontend Approval Gate]
  │
  ├─ Notes: Review Modal with [ Apply Changes ], [ Copy ], [ Cancel ]
  ├─ Flashcards: Interactive Review with inline Q&A edit checkboxes
  ├─ Tasks/Plans: Interactive Review Card before saving
  ▼
[Supabase PostgreSQL]
  └─ Writes ONLY occur upon explicit student approval
```

---

## 🗄️ 5. Relational Database Schema & Data Integrity

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

### Safe Non-Destructive Deletions (`ON DELETE SET NULL`)
All child foreign keys referencing `subjects(id)` specify `ON DELETE SET NULL`:
- Deleting a Subject in StudyZone **never deletes** student notes, tasks, flashcards, or study sessions.
- Associated items remain safely preserved in the database with `subject_id = null` and display as unassigned items.
- The UI confirmation dialog explicitly communicates this reassurance to learners.

---

## 💡 6. Feature Deep Dives & Engineering Decisions

### A. Focus Mode: 1-Click Start & Single-Log Guarantee
- **Problem Solved**: Resistance to starting study sessions and duplicate session entries.
- **Engineering Implementation**:
  - Timer starts immediately with 1 click without requiring prior subject or task assignment (`subject_id = NULL`).
  - `sessionLoggedRef` prevents concurrent or duplicate database writes when timer reaches 00:00.
  - Completed sessions immediately clear from `localStorage` to eliminate duplicate writes on page refresh.
  - Optional post-session reflection modal allows retroactive subject linking.

### B. Pure Web Audio Procedural Soundscapes
- **Problem Solved**: High bandwidth costs, external streaming latency, and audio looping artifacts.
- **Implementation**:
  - 10 soundscapes (Gentle Rain, Ocean Waves, Forest Wind, Campfire, 528Hz Drone, 432Hz Harmonic, Brownian Noise, Pink Noise, White Noise, Mute) generated mathematically using Web Audio API nodes (`AudioBufferSourceNode`, `BiquadFilterNode`, `GainNode`, `StereoPannerNode`).
  - Runs with 0kb network requests and infinite, non-repeating acoustic variation.
  - Persistent playback across page navigation via root `<AudioProvider>`.

### C. Mathematical Spaced Repetition (SuperMemo SM-2)
- **Problem Solved**: Long-term memory decay and cramming.
- **Algorithm (`flashcardsService.js`)**:
  - Quality score ($q \in [0..5]$): `Again` (1), `Hard` (3), `Good` (4), `Easy` (5).
  - Easiness Factor update: $EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$, with $EF \ge 1.3$.
  - Intervals: $I(1) = 1$, $I(2) = 6$, $I(n) = I_{n-1} \times EF$.
  - Atomic card quality: System prompts strictly enforce 1 concept per card with active recall framing.

### D. Deterministic "Smart Next Action" Engine
- **Why Rule-Based instead of AI?**:
  - Real-time zero-latency execution.
  - Completely explainable and deterministic.
  - Zero token cost and zero hallucination risk.
- **Heuristic Order**:
  1. Overdue tasks (chronological by due date).
  2. Tasks due today.
  3. High/urgent priority tasks.
  4. Neglected subjects (> 7 days without study).
  5. Continue recent study activity.
  6. Empty state action card.

---

## 🧪 7. Post-Phase 18 Student Testing Protocol

To validate usability improvements with real learners, conduct unassisted testing using these six core scenarios:

### Task 1: Zero-Friction Focus Session
- **Scenario**: *"You have 25 minutes to study right now. Start a focus session."*
- **Observation Goal**: Verify student clicks "Start Focus" immediately without feeling blocked by subject/task dropdowns.
- **Success Criteria**: Timer starts within 5 seconds.

### Task 2: Distraction-Free Note Capture
- **Scenario**: *"Write a note summarizing what you learned about Binary Search Trees."*
- **Observation Goal**: Verify student writes in the single-column canvas, switches between Edit and Preview tabs, and triggers "Study with AI → Summarize Note".
- **Success Criteria**: Note is created and saved; proposal review modal is understood and applied non-destructively.

### Task 3: Automatic Flashcard Deck Creation
- **Scenario**: *"Create a 5-card flashcard deck to study Python List Comprehensions."*
- **Observation Goal**: Verify student uses `✨ Generate Flashcards`, inspects cards in the review modal, edits an answer inline, and saves the deck.
- **Success Criteria**: Deck is created and reviewed using SM-2 buttons (`Again`, `Hard`, `Good`, `Easy`).

### Task 4: Contextual AI Study Assistance
- **Scenario**: *"Ask the AI Study Tutor to explain Recursion using the note you just wrote."*
- **Observation Goal**: Verify student notices the visual context chip `[ 📄 Note: ... ✕ ]` and asks follow-up questions.
- **Success Criteria**: Student confirms feeling that the AI acts as an interactive tutor rather than an autonomous generator.

### Task 5: Daily Cockpit Action
- **Scenario**: *"You just opened StudyZone on a Monday morning. What should you do first?"*
- **Observation Goal**: Verify student reads the Smart Next Action card and checks off a task in "Today's Focus".
- **Success Criteria**: Student understands the "Why this?" rationale and completes the task in 1 click.

### Task 6: Organizing Big Goals vs. Subjects
- **Scenario**: *"You want to prepare for your semester exams in 2 months. Set up your workspace."*
- **Observation Goal**: Verify student creates a Subject for course materials and optionally creates a Learning Plan with milestones for the 2-month timeline.
- **Success Criteria**: Student distinguishes between the knowledge container (Subject) and the milestone roadmap (Learning Plan).

---

## 🎯 8. Developer Interview Q&A Quick Sheet

| Interview Question | Concise Technical Answer |
| :--- | :--- |
| **How is multi-tenancy enforced?** | Multi-tenancy is enforced at the database layer using PostgreSQL Row Level Security (RLS). Every table contains a `user_id` foreign key matching `auth.uid()`. Malicious cross-tenant queries return 0 rows. |
| **What is the AI Privacy boundary?** | StudyZone enforces `Explicit Context In → AI Processing → Response Out`. Gemini only receives explicitly attached note text or user prompts (capped at ~6,000 characters). Private tasks and sessions are never dumped silently into LLM prompts. |
| **Why is Smart Next Action rule-based?** | To ensure instantaneous rendering, explainable rationale (`Why this?`), zero token cost, and absolute determinism without hallucination. |
| **What happens when a Subject is deleted?** | PostgreSQL foreign keys enforce `ON DELETE SET NULL`. Notes, tasks, flashcards, and sessions remain safe in the database with `subject_id = null` as unassigned items. |
| **How does offline resilience work?** | Active note drafts are continuously mirrored to browser `localStorage`. If network drops or an edit fails to sync to Supabase, the student sees *"Offline — saved locally"* and can retry with zero data loss. |
| **How are focus sessions protected against duplicate logging?** | FocusPage utilizes `sessionLoggedRef` to guarantee focus sessions are recorded exactly once on timer completion, and immediately clears active timer state from `localStorage` upon completion. |
