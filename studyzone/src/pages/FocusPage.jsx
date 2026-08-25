import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FastForward,
  Flame,
  Hourglass,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Timer,
  Zap,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/useAuth'
import { getSubjects } from '../services/subjectsService'
import { getTasks } from '../services/tasksService'
import {
  FOCUS_PRESETS,
  saveActiveFocusState,
  loadActiveFocusState,
  logCompletedFocusSession,
  getFocusSessionStats,
} from '../services/focusTimerService'
import { cn, formatDuration, formatMinutesToHoursMinutes } from '../lib/utils'

function formatSeconds(totalSeconds) {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60)
  const secs = Math.floor(Math.max(0, totalSeconds) % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function FocusPage() {
  const { user } = useAuth()
  const location = useLocation()

  // ─── Initial Restored Session State ────────────────────────────
  const initialSavedSession = useMemo(() => loadActiveFocusState(), [])

  // ─── Preset & Custom Mode State ────────────────────────────────
  const [selectedPresetId, setSelectedPresetId] = useState(
    () => initialSavedSession?.modeId || 'pomodoro',
  )
  const [customFocusMinutes, setCustomFocusMinutes] = useState(30)
  const [customShortBreakMinutes, setCustomShortBreakMinutes] = useState(5)
  const [customLongBreakMinutes, setCustomLongBreakMinutes] = useState(15)
  const [customCycles, setCustomCycles] = useState(4)

  const currentPreset = useMemo(() => {
    const p = FOCUS_PRESETS.find((preset) => preset.id === selectedPresetId) || FOCUS_PRESETS[0]
    if (p.id === 'custom') {
      return {
        ...p,
        focusMinutes: customFocusMinutes,
        shortBreakMinutes: customShortBreakMinutes,
        longBreakMinutes: customLongBreakMinutes,
        cyclesBeforeLongBreak: customCycles,
      }
    }
    return p
  }, [
    selectedPresetId,
    customFocusMinutes,
    customShortBreakMinutes,
    customLongBreakMinutes,
    customCycles,
  ])

  // ─── Linked Context (Subject & Task) ───────────────────────────
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    () => location.state?.subjectId || initialSavedSession?.subjectId || '',
  )
  const [selectedTaskId, setSelectedTaskId] = useState(
    () => location.state?.taskId || initialSavedSession?.taskId || '',
  )

  // ─── Timer State ───────────────────────────────────────────────
  const [sessionPhase, setSessionPhase] = useState(
    () => initialSavedSession?.phase || 'idle',
  )
  const [isRunning, setIsRunning] = useState(
    () => Boolean(initialSavedSession?.isRunning),
  )
  const [isPaused, setIsPaused] = useState(
    () => Boolean(initialSavedSession?.isPaused),
  )
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => initialSavedSession?.remainingSeconds ?? (25 * 60),
  )
  const [totalPhaseSeconds, setTotalPhaseSeconds] = useState(
    () => initialSavedSession?.totalPhaseSeconds ?? (25 * 60),
  )
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(
    () => initialSavedSession?.accumulatedFocusSeconds ?? 0,
  )
  const [cycleIndex, setCycleIndex] = useState(
    () => initialSavedSession?.cycleIndex ?? 1,
  )

  // ─── Completion Modal & Stats ──────────────────────────────────
  const [completionData, setCompletionData] = useState(null)
  const [stats, setStats] = useState({
    todayFocusMinutes: 0,
    todaySessionsCount: 0,
    weeklyFocusMinutes: 0,
    weeklyAvgDurationMinutes: 0,
    recentSessions: [],
  })
  const [bannerMessage, setBannerMessage] = useState(null)

  const timerIntervalRef = useRef(null)
  const targetEndTimeRef = useRef(null)
  const lastTickTimeRef = useRef(null)

  // ─── Load Subjects, Tasks, and Stats ───────────────────────────
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!user?.id) return
      try {
        const [subRes, taskRes, statsRes] = await Promise.all([
          getSubjects(user.id),
          getTasks(user.id),
          getFocusSessionStats(user.id),
        ])

        if (isMounted) {
          if (subRes.data) setSubjects(subRes.data)
          if (taskRes.data) {
            setTasks(taskRes.data.filter((t) => t.status !== 'completed' && t.status !== 'archived'))
          }
          if (statsRes) setStats(statsRes)
        }
      } catch (err) {
        console.warn('Could not load focus page context:', err)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user])

  // ─── Save State to LocalStorage on changes ─────────────────────
  useEffect(() => {
    if (sessionPhase === 'idle') {
      saveActiveFocusState(null)
    } else {
      saveActiveFocusState({
        modeId: selectedPresetId,
        phase: sessionPhase,
        isRunning,
        isPaused,
        remainingSeconds,
        totalPhaseSeconds,
        accumulatedFocusSeconds,
        cycleIndex,
        subjectId: selectedSubjectId,
        taskId: selectedTaskId,
        targetEndTime: isRunning && !isPaused ? Date.now() + remainingSeconds * 1000 : null,
      })
    }
  }, [
    sessionPhase,
    isRunning,
    isPaused,
    remainingSeconds,
    totalPhaseSeconds,
    accumulatedFocusSeconds,
    cycleIndex,
    selectedPresetId,
    selectedSubjectId,
    selectedTaskId,
  ])

  // ─── Update Initial Timer when switching preset in Idle state ──
  function handleSelectPreset(presetId) {
    if (sessionPhase !== 'idle' && isRunning) return
    setSelectedPresetId(presetId)
    const targetPreset = FOCUS_PRESETS.find((p) => p.id === presetId) || FOCUS_PRESETS[0]
    const focusMins = targetPreset.id === 'custom' ? customFocusMinutes : targetPreset.focusMinutes
    setRemainingSeconds(focusMins * 60)
    setTotalPhaseSeconds(focusMins * 60)
    setSessionPhase('idle')
    setIsRunning(false)
    setIsPaused(false)
    setAccumulatedFocusSeconds(0)
    setCycleIndex(1)
  }

  // ─── Phase Completion Handler ──────────────────────────────────
  async function triggerPhaseComplete() {
    setIsRunning(false)
    setIsPaused(false)

    if (sessionPhase === 'focus') {
      const focusedMins = Math.max(1, Math.round(totalPhaseSeconds / 60))

      if (user?.id) {
        await logCompletedFocusSession({
          userId: user.id,
          subjectId: selectedSubjectId || null,
          taskId: selectedTaskId || null,
          focusedMinutes: focusedMins,
          presetName: currentPreset.name,
          intendedMinutes: currentPreset.focusMinutes,
        })
        const updatedStats = await getFocusSessionStats(user.id)
        if (updatedStats) setStats(updatedStats)
      }

      const isLongBreakDue = cycleIndex >= currentPreset.cyclesBeforeLongBreak
      const nextBreakPhase = isLongBreakDue ? 'long_break' : 'short_break'
      const nextBreakMins = isLongBreakDue
        ? currentPreset.longBreakMinutes
        : currentPreset.shortBreakMinutes

      setCompletionData({
        type: 'focus_complete',
        focusedMinutes: focusedMins,
        cycleIndex,
        maxCycles: currentPreset.cyclesBeforeLongBreak,
        isLongBreakDue,
        nextBreakMins,
        nextBreakPhase,
        subjectName: subjects.find((s) => s.id === selectedSubjectId)?.name,
        taskTitle: tasks.find((t) => t.id === selectedTaskId)?.title,
      })
    } else {
      setCompletionData({
        type: 'break_complete',
        cycleIndex,
        maxCycles: currentPreset.cyclesBeforeLongBreak,
      })
    }
  }

  // ─── Timer Countdown Tick Loop ─────────────────────────────────
  useEffect(() => {
    if (!isRunning || isPaused) {
      clearInterval(timerIntervalRef.current)
      return
    }

    lastTickTimeRef.current = Date.now()
    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000))
      const deltaSec = Math.max(0, Math.round((now - lastTickTimeRef.current) / 1000))
      lastTickTimeRef.current = now

      if (sessionPhase === 'focus') {
        setAccumulatedFocusSeconds((prev) => prev + deltaSec)
      }

      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current)
        triggerPhaseComplete()
      }
    }, 500)

    return () => clearInterval(timerIntervalRef.current)
  }, [isRunning, isPaused, sessionPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Control Handlers ──────────────────────────────────────────
  function handleStart() {
    if (sessionPhase === 'idle') {
      setSessionPhase('focus')
      const secs = currentPreset.focusMinutes * 60
      setRemainingSeconds(secs)
      setTotalPhaseSeconds(secs)
      setAccumulatedFocusSeconds(0)
    }
    setIsRunning(true)
    setIsPaused(false)
  }

  function handlePause() {
    setIsPaused(true)
  }

  function handleResume() {
    setIsPaused(false)
    setIsRunning(true)
  }

  async function handleEndEarlyAndLog() {
    const focusedMins = Math.round(accumulatedFocusSeconds / 60)

    if (sessionPhase === 'focus' && focusedMins >= 1 && user?.id) {
      await logCompletedFocusSession({
        userId: user.id,
        subjectId: selectedSubjectId || null,
        taskId: selectedTaskId || null,
        focusedMinutes: focusedMins,
        presetName: currentPreset.name,
        intendedMinutes: currentPreset.focusMinutes,
      })
      const updatedStats = await getFocusSessionStats(user.id)
      if (updatedStats) setStats(updatedStats)

      setBannerMessage({
        type: 'success',
        text: `Logged ${focusedMins} minute${focusedMins > 1 ? 's' : ''} of focused study time.`,
      })
      setTimeout(() => setBannerMessage(null), 4000)
    }

    handleReset()
  }

  function handleReset() {
    setIsRunning(false)
    setIsPaused(false)
    setSessionPhase('idle')
    setAccumulatedFocusSeconds(0)
    setRemainingSeconds(currentPreset.focusMinutes * 60)
    setTotalPhaseSeconds(currentPreset.focusMinutes * 60)
    setCompletionData(null)
    saveActiveFocusState(null)
  }

  function handleStartBreak(isLong) {
    setCompletionData(null)
    const breakMins = isLong ? currentPreset.longBreakMinutes : currentPreset.shortBreakMinutes
    const breakPhase = isLong ? 'long_break' : 'short_break'
    setSessionPhase(breakPhase)
    setRemainingSeconds(breakMins * 60)
    setTotalPhaseSeconds(breakMins * 60)
    setIsRunning(true)
    setIsPaused(false)
  }

  function handleStartNextFocusCycle() {
    setCompletionData(null)
    const nextCycle = cycleIndex >= currentPreset.cyclesBeforeLongBreak ? 1 : cycleIndex + 1
    setCycleIndex(nextCycle)
    setSessionPhase('focus')
    const secs = currentPreset.focusMinutes * 60
    setRemainingSeconds(secs)
    setTotalPhaseSeconds(secs)
    setAccumulatedFocusSeconds(0)
    setIsRunning(true)
    setIsPaused(false)
  }

  // ─── Filtered Tasks by Subject ─────────────────────────────────
  const availableTasks = useMemo(() => {
    if (!selectedSubjectId) return tasks
    return tasks.filter((t) => t.subject_id === selectedSubjectId)
  }, [tasks, selectedSubjectId])

  // ─── Progress Percentage & Ring ────────────────────────────────
  const progressPercent = totalPhaseSeconds > 0
    ? Math.min(100, Math.max(0, ((totalPhaseSeconds - remainingSeconds) / totalPhaseSeconds) * 100))
    : 0

  const radius = 130
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const isBreakPhase = sessionPhase === 'short_break' || sessionPhase === 'long_break'

  return (
    <PageContainer width="wide" className="space-y-6 pb-12">
      {/* Top Banner Alert (e.g. after early logging) */}
      <AnimatePresence>
        {bannerMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 rounded-xl border border-accent/40 bg-accent/15 p-3.5 text-xs sm:text-sm text-foreground shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
            <span>{bannerMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Focus Mode
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Distraction-free deep work intervals automatically tracked in your study analytics.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {sessionPhase === 'focus' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Focusing
            </span>
          )}
          {sessionPhase === 'short_break' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 px-3 py-1 text-xs font-bold text-sky-400">
              <CoffeeCupIcon className="h-3.5 w-3.5" />
              Short Break
            </span>
          )}
          {sessionPhase === 'long_break' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-400">
              <Sparkles className="h-3.5 w-3.5" />
              Long Break
            </span>
          )}
          {sessionPhase === 'idle' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised border border-border px-3 py-1 text-xs font-medium text-muted">
              <Hourglass className="h-3.5 w-3.5" />
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Main Focus Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset & Context Settings (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Preset Selector Card */}
          <Card className="border-border/90 bg-surface shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Timer Mode
              </CardTitle>
              <CardDescription className="text-xs">
                Select your preferred focus interval.
              </CardDescription>
            </CardHeader>

            <div className="p-4 pt-0 space-y-2">
              {FOCUS_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id
                const disabled = isRunning && sessionPhase !== 'idle'

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={cn(
                      'flex flex-col w-full text-left rounded-xl p-3 border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
                      isSelected
                        ? 'bg-accent/15 border-accent/50 shadow-2xs'
                        : 'bg-surface-raised/40 border-border/70 hover:bg-surface-raised hover:border-border',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs font-bold', isSelected ? 'text-accent' : 'text-foreground')}>
                        {preset.name}
                      </span>
                      <span className="text-[11px] font-mono text-muted">
                        {preset.id === 'custom' ? `${customFocusMinutes}m` : `${preset.focusMinutes}m`}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{preset.description}</p>
                  </button>
                )
              })}

              {/* Custom Mode Inputs */}
              {selectedPresetId === 'custom' && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                        Focus (min)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={customFocusMinutes}
                        disabled={isRunning}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 25
                          setCustomFocusMinutes(val)
                          if (sessionPhase === 'idle') {
                            setRemainingSeconds(val * 60)
                            setTotalPhaseSeconds(val * 60)
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                        Break (min)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={customShortBreakMinutes}
                        disabled={isRunning}
                        onChange={(e) => setCustomShortBreakMinutes(Number(e.target.value) || 5)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                        Long Break (min)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={customLongBreakMinutes}
                        disabled={isRunning}
                        onChange={(e) => setCustomLongBreakMinutes(Number(e.target.value) || 15)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                        Cycles
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={customCycles}
                        disabled={isRunning}
                        onChange={(e) => setCustomCycles(Number(e.target.value) || 4)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Optional Linked Context (Subject & Task) */}
          <Card className="border-border/90 bg-surface shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                Linked Subject & Task
              </CardTitle>
              <CardDescription className="text-xs">
                Optionally link your study session to aggregate focus time.
              </CardDescription>
            </CardHeader>

            <div className="p-4 pt-0 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Subject / Area
                </label>
                <select
                  value={selectedSubjectId}
                  disabled={isRunning}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value)
                    setSelectedTaskId('')
                  }}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer disabled:opacity-60"
                >
                  <option value="">No specific subject (General Study)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Task
                </label>
                <select
                  value={selectedTaskId}
                  disabled={isRunning}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer disabled:opacity-60"
                >
                  <option value="">No linked task</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Distraction-Free Radial Timer Centerpiece (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="relative overflow-hidden border-border/90 bg-gradient-to-b from-surface to-surface-raised p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center text-center">
            {/* Cycle Dots Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Cycle {cycleIndex} of {currentPreset.cyclesBeforeLongBreak}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: currentPreset.cyclesBeforeLongBreak }).map((_, i) => {
                  const isPast = i + 1 < cycleIndex
                  const isCurrent = i + 1 === cycleIndex
                  return (
                    <span
                      key={i}
                      className={cn(
                        'h-2.5 rounded-full transition-all duration-300',
                        isPast
                          ? 'w-2.5 bg-accent'
                          : isCurrent
                          ? 'w-6 bg-accent shadow-xs'
                          : 'w-2.5 bg-border',
                      )}
                    />
                  )
                })}
              </div>
            </div>

            {/* Radial SVG Progress Ring & Countdown Display */}
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform" viewBox="0 0 300 300">
                {/* Background Circle */}
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  className="stroke-border/40"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Progress Dynamic Ring */}
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  stroke={
                    sessionPhase === 'short_break'
                      ? '#38bdf8'
                      : sessionPhase === 'long_break'
                      ? '#a855f7'
                      : '#4f7cff'
                  }
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              {/* Center Digital Countdown & Meta */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground tabular-nums drop-shadow-sm">
                  {formatSeconds(remainingSeconds)}
                </span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-muted mt-2">
                  {sessionPhase === 'idle'
                    ? 'Ready to focus'
                    : sessionPhase === 'focus'
                    ? isPaused
                      ? 'Paused'
                      : 'Focus Time'
                    : sessionPhase === 'short_break'
                    ? 'Short Break'
                    : 'Long Break'}
                </span>

                {/* Linked Subject / Task pill in center */}
                {(selectedSubjectId || selectedTaskId) && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-full bg-surface-raised/80 border border-border px-3 py-1 text-[11px] text-muted max-w-[200px] truncate">
                    <BookOpen className="h-3 w-3 shrink-0 text-accent" />
                    <span className="truncate">
                      {tasks.find((t) => t.id === selectedTaskId)?.title ||
                        subjects.find((s) => s.id === selectedSubjectId)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Control Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8 w-full max-w-md">
              {!isRunning ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleStart}
                  className="gap-2.5 px-8 py-3 text-sm font-bold shadow-lg shadow-accent/20 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{sessionPhase === 'idle' ? 'Start Focus Session' : 'Start Timer'}</span>
                </Button>
              ) : isPaused ? (
                <>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleResume}
                    className="gap-2 px-6 py-2.5 font-bold cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Resume</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleEndEarlyAndLog}
                    className="gap-2 px-4 py-2.5 cursor-pointer"
                  >
                    <Square className="h-4 w-4" />
                    <span>End & Log</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleReset}
                    className="gap-1.5 px-3 py-2.5 text-muted hover:text-danger cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handlePause}
                    className="gap-2 px-6 py-2.5 font-bold cursor-pointer"
                  >
                    <Pause className="h-4 w-4" />
                    <span>Pause</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleEndEarlyAndLog}
                    className="gap-2 px-4 py-2.5 cursor-pointer text-muted hover:text-foreground"
                  >
                    <Square className="h-4 w-4" />
                    <span>End Early</span>
                  </Button>
                </>
              )}

              {/* Fast Forward Break Button */}
              {isBreakPhase && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartNextFocusCycle}
                  className="gap-1.5 text-xs text-muted hover:text-accent cursor-pointer"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  <span>Skip Break</span>
                </Button>
              )}
            </div>
          </Card>

          {/* Today & Weekly Focus Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Today Focus</span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {formatMinutesToHoursMinutes(stats.todayFocusMinutes)}
              </p>
            </Card>

            <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Sessions</span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {stats.todaySessionsCount} completed
              </p>
            </Card>

            <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[11px] font-medium uppercase tracking-wider">This Week</span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {formatMinutesToHoursMinutes(stats.weeklyFocusMinutes)}
              </p>
            </Card>

            <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Hourglass className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Avg Session</span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                {stats.weeklyAvgDurationMinutes}m
              </p>
            </Card>
          </div>

          {/* Recent Focus History Table */}
          <Card className="border-border/90 bg-surface shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted" />
                Recent Focus Sessions
              </CardTitle>
              <CardDescription className="text-xs">
                Verified focus sessions logged into your StudyZone history.
              </CardDescription>
            </CardHeader>

            <div className="p-4 pt-0">
              {stats.recentSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No focus sessions logged this week. Start a session above to build momentum!
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {stats.recentSessions.map((session) => {
                    const subName = subjects.find((s) => s.id === session.subject_id)?.name
                    const taskTitle = tasks.find((t) => t.id === session.task_id)?.title

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between py-2.5 text-xs text-foreground"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-semibold truncate">
                            {session.notes || 'Focus Study Session'}
                          </p>
                          <p className="text-[11px] text-muted truncate mt-0.5">
                            {subName || 'General'} {taskTitle ? `· ${taskTitle}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-accent">
                            {formatDuration(session.duration_minutes)}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {session.started_at
                              ? new Date(session.started_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Completion Modal Dialog */}
      <AnimatePresence>
        {completionData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl text-center"
            >
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-md">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              {completionData.type === 'focus_complete' ? (
                <>
                  <h3 className="text-lg font-bold text-foreground">
                    Focus Interval Completed!
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    You logged <strong className="text-foreground">{completionData.focusedMinutes} minutes</strong> of deep study.
                  </p>

                  {completionData.subjectName && (
                    <p className="text-xs text-accent mt-1">
                      Subject: {completionData.subjectName}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={() => handleStartBreak(completionData.isLongBreakDue)}
                      className="w-full gap-2 font-bold cursor-pointer"
                    >
                      <CoffeeCupIcon className="h-4 w-4" />
                      <span>
                        Start {completionData.isLongBreakDue ? 'Long' : 'Short'} Break ({completionData.nextBreakMins}m)
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleStartNextFocusCycle}
                      className="w-full gap-2 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Next Focus Interval</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="w-full text-xs text-muted hover:text-foreground cursor-pointer"
                    >
                      Finish for Now
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-foreground">
                    Break Finished!
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    Ready to resume your next focus interval?
                  </p>

                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={handleStartNextFocusCycle}
                      className="w-full gap-2 font-bold cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Focus Interval</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="w-full text-xs text-muted hover:text-foreground cursor-pointer"
                    >
                      Done for now
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}

function CoffeeCupIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
}
