import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Database,
  GraduationCap,
  Headphones,
  Key,
  Layers,
  LayoutDashboard,
  Lock,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { stopAmbientSound } from '../services/soundGeneratorService'
import { cn } from '../lib/utils'

export default function LandingPage() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePreviewTab, setActivePreviewTab] = useState('dashboard')

  // Ensure ambient sound is silenced when landing page is viewed by logged out users
  useEffect(() => {
    if (!user) {
      stopAmbientSound()
    }
  }, [user])

  const previewTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'focus', label: 'Focus & Soundscape', icon: Timer },
    { id: 'calendar', label: 'Timetable Calendar', icon: CalendarDays },
    { id: 'flashcards', label: 'SM-2 Flashcards', icon: Brain },
    { id: 'analytics', label: 'Learning Insights', icon: TrendingUp },
    { id: 'ai', label: 'AI Study Assistant', icon: Bot },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-foreground">
      {/* ─── 1. PUBLIC NAVIGATION BAR ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              StudyZone
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted">
            <a href="#workflow" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-foreground transition-colors">
              Product Tour
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </nav>

          {/* Right Actions / Auth Switcher */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="gap-2 font-bold shadow-sm shadow-accent/25 cursor-pointer">
                  <span>Open Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold cursor-pointer">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="gap-1.5 font-bold shadow-sm shadow-accent/25 cursor-pointer">
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-foreground md:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border bg-surface px-4 py-4 md:hidden space-y-3"
            >
              <div className="flex flex-col gap-2.5 text-xs font-medium text-muted">
                <a
                  href="#workflow"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-surface-raised rounded-lg hover:text-foreground"
                >
                  How It Works
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-surface-raised rounded-lg hover:text-foreground"
                >
                  Features
                </a>
                <a
                  href="#preview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-surface-raised rounded-lg hover:text-foreground"
                >
                  Product Tour
                </a>
                <a
                  href="#architecture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-surface-raised rounded-lg hover:text-foreground"
                >
                  Architecture
                </a>
              </div>

              <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full justify-center gap-2 font-bold cursor-pointer">
                      <span>Open Dashboard</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm" className="w-full justify-center text-xs cursor-pointer">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full justify-center font-bold cursor-pointer">
                        Get Started Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="space-y-24 sm:space-y-32 pb-24">
        {/* ─── 2. HERO SECTION ────────────────────────────────────────────── */}
        <section className="relative pt-12 sm:pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8">
          {/* Subtle Ambient Radial Glow */}
          <div
            className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] sm:h-[350px] sm:w-[600px] rounded-full bg-accent/8 blur-3xl sm:blur-[100px] transform-gpu"
            aria-hidden="true"
          />

          <div className="mx-auto max-w-5xl text-center space-y-6">
            {/* Signed-in user quick jump banner */}
            {user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto max-w-lg rounded-2xl border border-accent/40 bg-surface-raised/90 p-3 flex items-center justify-between gap-3 text-left shadow-lg"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      Signed in as {user?.email}
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      Your personalized workspace is active
                    </p>
                  </div>
                </div>
                <Link to="/dashboard" className="shrink-0">
                  <Button size="sm" className="gap-1 text-xs font-bold shadow-xs cursor-pointer">
                    <span>Open Dashboard</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-[11px] font-semibold text-accent"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>PERSONAL LEARNING SYSTEM</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.15]"
            >
              Plan your learning. Focus on the work.{' '}
              <span className="bg-gradient-to-r from-accent via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                Understand your progress.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto max-w-2xl text-sm leading-relaxed text-muted sm:text-base"
            >
              StudyZone brings course planning, focus sessions, study analytics, AI coaching, and SuperMemo SM-2 spaced repetition into one personal, dark-first workspace.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <Link to={user ? '/dashboard' : '/signup'} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-sm font-bold shadow-md shadow-accent/30 cursor-pointer">
                  <span>{user ? 'Go to Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#preview" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 text-sm font-semibold cursor-pointer">
                  <span>Explore Product Tour</span>
                </Button>
              </a>
            </motion.div>

            {/* Browser Preview Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="pt-8 sm:pt-12"
            >
              <div className="relative mx-auto max-w-5xl rounded-2xl border border-border bg-surface shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/5">
                {/* Browser top chrome bar */}
                <div className="flex h-9 items-center justify-between border-b border-border/80 bg-surface-raised/80 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-surface px-3 py-0.5 text-[10px] font-mono text-muted border border-border/60">
                    <Lock className="h-2.5 w-2.5 text-accent" />
                    <span>studyzone.app/dashboard</span>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Hero Dashboard Preview UI Representation */}
                <div className="p-4 sm:p-6 space-y-4 bg-background/60 text-left">
                  {/* Top Bar Representation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Good morning</span>
                      <h2 className="text-base sm:text-lg font-bold text-foreground">Alex Chen · Computer Science</h2>
                      <p className="text-xs text-muted">2 tasks remaining today · 2 deadlines on your radar this week</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        <span>Ask AI Coach</span>
                      </span>
                    </div>
                  </div>

                  {/* Best Next Action Banner */}
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-400 uppercase tracking-wider border border-rose-500/30">
                          Urgent Overdue
                        </span>
                        <span className="text-xs font-bold text-foreground">Complete High-Priority Java Module</span>
                      </div>
                      <p className="text-[11px] text-muted">
                        Reason: Overdue high-priority task. Tackling this now clears critical backlog.
                      </p>
                    </div>
                    <Button size="sm" className="gap-1 text-xs shrink-0 self-start sm:self-auto pointer-events-none">
                      <Play className="h-3 w-3 fill-white" />
                      <span>Start Focus</span>
                    </Button>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                      <p className="text-[10px] text-muted uppercase font-semibold">Total Tasks</p>
                      <p className="text-lg font-extrabold text-foreground">5</p>
                      <p className="text-[10px] text-muted-foreground">across all subjects</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                      <p className="text-[10px] text-muted uppercase font-semibold">Completed</p>
                      <p className="text-lg font-extrabold text-emerald-400">2 <span className="text-xs font-normal text-muted">(40%)</span></p>
                      <p className="text-[10px] text-muted-foreground">tasks finished</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                      <p className="text-[10px] text-muted uppercase font-semibold">Upcoming Due</p>
                      <p className="text-lg font-extrabold text-amber-400">1</p>
                      <p className="text-[10px] text-muted-foreground">in the next 7 days</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                      <p className="text-[10px] text-muted uppercase font-semibold">Progress</p>
                      <p className="text-lg font-extrabold text-accent">40%</p>
                      <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
                        <div className="h-full bg-accent rounded-full w-[40%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 3. PRODUCT WORKFLOW (PLAN → FOCUS → TRACK → IMPROVE → REMEMBER) ─ */}
        <section id="workflow" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
              A Connected Learning Methodology
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              How StudyZone Works
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted">
              Move seamlessly through the 5 core stages of intentional learning without switching tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {/* Step 1: PLAN */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 flex flex-col justify-between hover:border-accent/40 transition-all group">
              <div className="space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Step 1</div>
                <h3 className="text-sm font-bold text-foreground">PLAN</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Organize subjects, tasks, deadlines, and milestone-driven learning plans.
                </p>
              </div>
            </div>

            {/* Step 2: FOCUS */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 flex flex-col justify-between hover:border-accent/40 transition-all group">
              <div className="space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                  <Timer className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Step 2</div>
                <h3 className="text-sm font-bold text-foreground">FOCUS</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Start structured Pomodoro sessions with synthesized Web Audio noise soundscapes.
                </p>
              </div>
            </div>

            {/* Step 3: TRACK */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 flex flex-col justify-between hover:border-accent/40 transition-all group">
              <div className="space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Step 3</div>
                <h3 className="text-sm font-bold text-foreground">TRACK</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Analyze daily study consistency, streaks, workload balance, and task completion.
                </p>
              </div>
            </div>

            {/* Step 4: IMPROVE */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 flex flex-col justify-between hover:border-accent/40 transition-all group">
              <div className="space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20 group-hover:scale-105 transition-transform">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent">Step 4</div>
                <h3 className="text-sm font-bold text-foreground">IMPROVE</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Receive personalized AI study coaching backed by your real verified metrics.
                </p>
              </div>
            </div>

            {/* Step 5: REMEMBER */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 flex flex-col justify-between hover:border-accent/40 transition-all group">
              <div className="space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Step 5</div>
                <h3 className="text-sm font-bold text-foreground">REMEMBER</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Master long-term memory recall with SuperMemo SM-2 spaced repetition decks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. FEATURE SHOWCASE MATRIX ─────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
              Comprehensive Learning Tools
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything You Need in One Workspace
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted">
              Built purposefully for learners who value clear organization, deep focus, and actionable analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pillar A: Organize Your Learning */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 hover:border-border/80 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Organize Your Learning</h3>
              <p className="text-xs text-muted leading-relaxed">
                Structure coursework with custom subject areas, prioritized action items, assignment deadlines, and milestone plans.
              </p>
              <ul className="space-y-2 text-xs text-muted border-t border-border/60 pt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Subjects & Topic Areas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Tasks with priority tags & due dates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Exam & assignment deadline tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Interactive 6-week Timetable Calendar</span>
                </li>
              </ul>
            </div>

            {/* Pillar B: Stay Focused */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 hover:border-border/80 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Headphones className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Deep Focus & Soundscapes</h3>
              <p className="text-xs text-muted leading-relaxed">
                Enter flow state with 5 Pomodoro timer modes, synthesized Web Audio ambient noise, and automatic study logging.
              </p>
              <ul className="space-y-2 text-xs text-muted border-t border-border/60 pt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Classic Pomodoro, Deep Work & Custom</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Brown, Pink, White & 432Hz Audio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Tibetan singing bowl transition chime</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Screen WakeLock & Fullscreen mode</span>
                </li>
              </ul>
            </div>

            {/* Pillar C: Understand Your Progress */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 hover:border-border/80 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Actionable Study Insights</h3>
              <p className="text-xs text-muted leading-relaxed">
                Evaluate your study habits through deterministic calculations based on your real logged sessions and task completions.
              </p>
              <ul className="space-y-2 text-xs text-muted border-t border-border/60 pt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>7-day daily study consistency tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Current & longest study streak record</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Subject balance & neglected area alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>7-day upcoming workload distribution</span>
                </li>
              </ul>
            </div>

            {/* Pillar D: Learn & Remember */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 hover:border-border/80 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">SuperMemo SM-2 Flashcards</h3>
              <p className="text-xs text-muted leading-relaxed">
                Retain critical knowledge with 3D active recall flashcards powered by the scientifically validated SuperMemo SM-2 algorithm.
              </p>
              <ul className="space-y-2 text-xs text-muted border-t border-border/60 pt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>Easiness Factor & interval scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>Active recall flip with keyboard shortcuts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>AI Deck Generator from lecture notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>Resilient read-through cache fallback</span>
                </li>
              </ul>
            </div>

            {/* Pillar E: Get Guidance */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 hover:border-border/80 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">AI Study Assistant & Planner</h3>
              <p className="text-xs text-muted leading-relaxed">
                Consult a conversational AI study coach aware of your verified analytics, active deadlines, and learning roadmaps.
              </p>
              <ul className="space-y-2 text-xs text-muted border-t border-border/60 pt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Multi-thread persistent chat history</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Analytics-aware weekly reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Interactive Action Proposals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Zero autonomous writes (User approval)</span>
                </li>
              </ul>
            </div>

            {/* Pillar F: Data Portability & Productivity */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 hover:border-border/80 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Data Portability & Command Engine</h3>
              <p className="text-xs text-muted leading-relaxed">
                Quickly jump anywhere with the global command palette and export complete JSON/CSV archives of your data anytime.
              </p>
              <ul className="space-y-2 text-xs text-muted border-t border-border/60 pt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Global Search Palette (Ctrl / Cmd + K)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>1-click full JSON backup archive</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>CSV exports for tasks, sessions & decks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Deterministic in-app notification alerts</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── 5. REAL PRODUCT SHOWCASE TOUR TAB ──────────────────────────── */}
        <section id="preview" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
              Live Product Tour
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Inspect the StudyZone Experience
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted">
              Explore authentic views of the actual workspace interfaces built into StudyZone.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {previewTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activePreviewTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer border',
                    isActive
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'border-border bg-surface text-muted hover:border-border/80 hover:bg-surface-raised hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab View Container */}
          <div className="rounded-2xl border border-border bg-surface shadow-2xl p-4 sm:p-8">
            {/* View 1: Dashboard */}
            {activePreviewTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Interactive Study Dashboard</h3>
                    <p className="text-xs text-muted">Surfacing highest-leverage tasks, active plans, and daily focus targets.</p>
                  </div>
                  <span className="text-[11px] font-mono text-accent">Route: /dashboard</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 space-y-2 md:col-span-2">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Best Next Action</span>
                    <p className="text-xs sm:text-sm font-bold text-foreground">Complete High-Priority Java Module</p>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Evaluates pending workload and overdue items to prioritize what moves the needle today.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-1 text-center">
                    <span className="text-[10px] text-muted uppercase font-bold">7-Day Study Total</span>
                    <p className="text-2xl font-extrabold text-foreground">3h 30m</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">2 active days this week</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Focus Mode */}
            {activePreviewTab === 'focus' && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Focus Mode & Ambient Soundscape</h3>
                    <p className="text-xs text-muted">Distraction-free timer with Brown, Pink, White noise, and 432Hz harmonic tone.</p>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400">Route: /focus</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="rounded-xl border border-border bg-surface-raised p-6 text-center space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Cycle 1 of 4</span>
                    <p className="text-4xl font-extrabold font-mono text-foreground tracking-tight">25:00</p>
                    <span className="inline-block rounded-full bg-accent/20 px-3 py-0.5 text-xs font-bold text-accent">
                      READY TO FOCUS
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-muted">
                    <p className="font-bold text-foreground text-sm">Synthesized Web Audio Generative Noise</p>
                    <p className="text-[11px] leading-relaxed">
                      Audio is calculated 100% locally via Web Audio oscillators and filters. Zero network downloads, zero streaming drops, zero copyright issues.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-semibold text-foreground">Brown Noise</span>
                      <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-semibold text-foreground">Pink Noise</span>
                      <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-semibold text-foreground">432Hz Harmonic</span>
                      <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-semibold text-foreground">Singing Bowl Chime</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Calendar */}
            {activePreviewTab === 'calendar' && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Study Calendar & Timetable</h3>
                    <p className="text-xs text-muted">Unified 6-week timetable aggregating deadlines, scheduled tasks, and focus history.</p>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400">Route: /calendar</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-2 md:col-span-2">
                    <span className="text-xs font-bold text-foreground">Timezone-Safe Local Day Grid</span>
                    <p className="text-xs text-muted leading-relaxed">
                      Displays deadline pills (rose), scheduled tasks (accent), and logged study sessions (purple) mapped accurately to your local calendar day.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-1.5">
                    <span className="text-xs font-bold text-foreground">Day Inspector Drawer</span>
                    <p className="text-[11px] text-muted">Click any date to inspect items, launch direct focus sessions, or quick-schedule tasks.</p>
                  </div>
                </div>
              </div>
            )}

            {/* View 4: Flashcards */}
            {activePreviewTab === 'flashcards' && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Active Recall Flashcards (SuperMemo SM-2)</h3>
                    <p className="text-xs text-muted">Spaced repetition memory algorithm calculating optimal interval growth.</p>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400">Route: /flashcards</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="rounded-xl border border-accent/40 bg-surface-raised p-6 text-center space-y-2 shadow-md">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Active Recall Front</span>
                    <p className="text-sm font-bold text-foreground">What is the time complexity of lookup in a HashMap?</p>
                    <p className="text-[10px] text-muted">Press Space or Enter to flip</p>
                  </div>
                  <div className="space-y-2 text-xs text-muted">
                    <p className="font-bold text-foreground text-sm">SM-2 Spaced Repetition Scheduling</p>
                    <p className="text-[11px] leading-relaxed">
                      Quality scores (Again, Hard, Good, Easy) dynamically adjust the card&apos;s Easiness Factor (EF) and intervals (1d &rarr; 6d &rarr; $I \times EF$).
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold pt-1">
                      <span className="rounded bg-rose-500/15 text-rose-400 p-1 border border-rose-500/30">1: Again</span>
                      <span className="rounded bg-amber-500/15 text-amber-400 p-1 border border-amber-500/30">2: Hard</span>
                      <span className="rounded bg-accent/15 text-accent p-1 border border-accent/30">3: Good</span>
                      <span className="rounded bg-emerald-500/15 text-emerald-400 p-1 border border-emerald-500/30">4: Easy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 5: Analytics */}
            {activePreviewTab === 'analytics' && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Learning Insights & Habit Analytics</h3>
                    <p className="text-xs text-muted">7-day consistency calendar, streak records, subject balance, and workload forecasts.</p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Route: /analytics</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="rounded-xl border border-border bg-surface-raised p-3">
                    <span className="text-[10px] text-muted uppercase font-bold">Study Streak</span>
                    <p className="text-base font-extrabold text-foreground">2 Days</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised p-3">
                    <span className="text-[10px] text-muted uppercase font-bold">Active Days</span>
                    <p className="text-base font-extrabold text-foreground">2 / 7</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised p-3">
                    <span className="text-[10px] text-muted uppercase font-bold">Study Time</span>
                    <p className="text-base font-extrabold text-foreground">3h 30m</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised p-3">
                    <span className="text-[10px] text-muted uppercase font-bold">Task Rate</span>
                    <p className="text-base font-extrabold text-emerald-400">40%</p>
                  </div>
                </div>
              </div>
            )}

            {/* View 6: AI Study Assistant */}
            {activePreviewTab === 'ai' && (
              <div className="space-y-4">
                <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI Study Assistant & Action Proposals</h3>
                    <p className="text-xs text-muted">Contextual learning assistant with multi-thread history and strictly user-approved mutations.</p>
                  </div>
                  <span className="text-[11px] font-mono text-accent">Route: /ai-assistant</span>
                </div>
                <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-accent font-bold">
                    <Sparkles className="h-4 w-4" />
                    <span>Proposed StudyZone Actions (Review Before Add)</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    AI suggests structured tasks, deadlines, and milestone plans. You select exactly which items to approve or edit—zero autonomous database writes occur without your consent.
                  </p>
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <span className="font-semibold text-foreground text-xs">Complete High-Priority Java Module (Task · 60m)</span>
                    </div>
                    <span className="text-[10px] font-bold text-accent">+ Add Selected</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── 6. ENGINEERING & PRIVACY SECTION ───────────────────────────── */}
        <section id="architecture" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
              Security & Engineering
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built Around Your Own Data
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted">
              StudyZone implements strict security boundaries, isolated user storage, and zero autonomous modifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Architecture Card 1: Row Level Security */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">PostgreSQL Row-Level Security (RLS)</h3>
                  <p className="text-[11px] text-muted">Database-level user data isolation</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Every table in StudyZone enforces Postgres RLS policies checking <code className="text-accent">auth.uid() = user_id</code>. Users can strictly only view, insert, update, and delete their own study records.
              </p>
            </div>

            {/* Architecture Card 2: Server-Side AI API Secrets */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Server-Side AI Secrets</h3>
                  <p className="text-[11px] text-muted">Supabase Edge Function architecture</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Gemini AI API keys never exist in the client-side JavaScript bundle. All conversational inference passes securely through authenticated Supabase Edge Functions.
              </p>
            </div>

            {/* Architecture Card 3: Deterministic Analytics */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Deterministic Analytics</h3>
                  <p className="text-[11px] text-muted">Metrics calculated from actual recorded events</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Streaks, study time averages, consistency scores, and workload classifications are mathematically computed from genuine logged study sessions and tasks.
              </p>
            </div>

            {/* Architecture Card 4: Zero Autonomous Writes */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Zero Autonomous Writes</h3>
                  <p className="text-[11px] text-muted">Explicit user review and approval required</p>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                AI action proposals and generated flashcard decks are presented in interactive review containers. No database mutations occur without your direct approval.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 7. FINAL CALL TO ACTION ────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-accent/30 bg-gradient-to-b from-surface-raised to-surface p-8 sm:p-14 text-center space-y-6 shadow-2xl overflow-hidden">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-accent/15 blur-3xl transform-gpu"
              aria-hidden="true"
            />

            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/25">
              <GraduationCap className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Build a learning system that works for you.
            </h2>

            <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted leading-relaxed">
              Start organizing your learning, tracking your focus, and understanding your progress in one calm, dark-first personal workspace.
            </p>

            <div className="pt-2">
              <Link to={user ? '/dashboard' : '/signup'}>
                <Button size="lg" className="gap-2 text-sm font-bold shadow-lg shadow-accent/30 cursor-pointer">
                  <span>{user ? 'Open Your Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 8. FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border/80 bg-surface/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">StudyZone</span>
            <span className="text-muted-foreground">· Your Personal Learning System</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Enoch1702/StudyZone"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub Repository
            </a>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">
              Create Account
            </Link>
          </div>

          <p className="text-muted-foreground">
            © {new Date().getFullYear()} StudyZone. Released under the MIT License.
          </p>
        </div>
      </footer>
    </div>
  )
}
