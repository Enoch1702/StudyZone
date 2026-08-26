import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Layers,
  Plus,
  Sparkles,
  Timer,
  X,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/useAuth'
import { getTasks, createTask } from '../services/tasksService'
import { getDeadlines, createDeadline } from '../services/deadlinesService'
import { getSubjects } from '../services/subjectsService'
import { supabase } from '../lib/supabase'
import { cn, formatDate, formatDuration, getDeadlineUrgency } from '../lib/utils'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Safely converts an ISO timestamp or date string to local YYYY-MM-DD format
 * avoiding timezone offset date shifts.
 */
function toLocalDateStr(dateInput) {
  if (!dateInput) return null
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday = 0, Sunday = 6
  let startingDayOfWeek = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()

  const grid = []
  let week = []

  // Fill in previous month's trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevMonthDate = new Date(year, month - 1, d)
    const prevYear = prevMonthDate.getFullYear()
    const prevM = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
    const prevD = String(d).padStart(2, '0')
    week.push({
      day: d,
      dateStr: `${prevYear}-${prevM}-${prevD}`,
      isCurrentMonth: false,
    })
  }

  // Fill in current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    week.push({
      day,
      dateStr,
      isCurrentMonth: true,
    })

    if (week.length === 7) {
      grid.push(week)
      week = []
    }
  }

  // Fill in next month's leading days
  let nextMonthDay = 1
  while (week.length > 0 && week.length < 7) {
    const nextMonthDate = new Date(year, month + 1, nextMonthDay)
    const nextYear = nextMonthDate.getFullYear()
    const nextM = String(nextMonthDate.getMonth() + 1).padStart(2, '0')
    const nextD = String(nextMonthDay).padStart(2, '0')
    week.push({
      day: nextMonthDay,
      dateStr: `${nextYear}-${nextM}-${nextD}`,
      isCurrentMonth: false,
    })
    nextMonthDay++
  }
  if (week.length === 7) {
    grid.push(week)
  }

  return grid
}

export default function CalendarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => toLocalDateStr(today), [today])

  const [currentYear, setCurrentYear] = useState(() => today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth())
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)

  // Workload Data State
  const [tasks, setTasks] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [sessions, setSessions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  // Quick Add Modal State
  const [quickAddModal, setQuickAddModal] = useState({ isOpen: false, type: 'task' })
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [quickAddSubjectId, setQuickAddSubjectId] = useState('')
  const [quickAddPriority, setQuickAddPriority] = useState('medium')
  const [quickAddLoading, setQuickAddLoading] = useState(false)

  const reloadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [taskRes, deadRes, subRes, sessRes] = await Promise.all([
        getTasks(user.id),
        getDeadlines(user.id),
        getSubjects(user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id),
      ])

      if (taskRes.data) setTasks(taskRes.data)
      if (deadRes.data) setDeadlines(deadRes.data)
      if (subRes.data) setSubjects(subRes.data)
      if (sessRes.data) setSessions(sessRes.data)
    } catch (err) {
      console.warn('Error loading calendar data:', err)
    }
  }, [user])

  useEffect(() => {
    let isMounted = true

    async function initData() {
      if (!user?.id) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        const [taskRes, deadRes, subRes, sessRes] = await Promise.all([
          getTasks(user.id),
          getDeadlines(user.id),
          getSubjects(user.id),
          supabase.from('study_sessions').select('*').eq('user_id', user.id),
        ])

        if (isMounted) {
          if (taskRes.data) setTasks(taskRes.data)
          if (deadRes.data) setDeadlines(deadRes.data)
          if (subRes.data) setSubjects(subRes.data)
          if (sessRes.data) setSessions(sessRes.data)
        }
      } catch (err) {
        console.warn('Error loading calendar data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initData()

    return () => {
      isMounted = false
    }
  }, [user])

  const subjectMap = useMemo(() => {
    const map = new Map()
    for (const s of subjects) map.set(s.id, s.name)
    return map
  }, [subjects])

  // Map events by dateStr ('YYYY-MM-DD') using local date formatting
  const eventsByDate = useMemo(() => {
    const map = new Map()

    function addEvent(dateStr, event) {
      if (!dateStr) return
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr).push(event)
    }

    // Add Deadlines
    for (const d of deadlines) {
      const localDateKey = toLocalDateStr(d.due_date)
      if (localDateKey) {
        addEvent(localDateKey, {
          id: `dead-${d.id}`,
          type: 'deadline',
          title: d.title,
          subjectName: subjectMap.get(d.subject_id),
          subjectId: d.subject_id,
          date: d.due_date,
          urgency: getDeadlineUrgency(d.due_date),
          raw: d,
        })
      }
    }

    // Add Tasks
    for (const t of tasks) {
      const localDateKey = toLocalDateStr(t.due_date)
      if (localDateKey) {
        addEvent(localDateKey, {
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subjectName: subjectMap.get(t.subject_id),
          subjectId: t.subject_id,
          priority: t.priority,
          status: t.status,
          date: t.due_date,
          raw: t,
        })
      }
    }

    // Add Study Sessions (using local start date)
    for (const s of sessions) {
      const localDateKey = toLocalDateStr(s.started_at)
      if (localDateKey) {
        addEvent(localDateKey, {
          id: `sess-${s.id}`,
          type: 'session',
          title: s.notes || 'Study Session',
          duration: s.duration_minutes,
          subjectName: subjectMap.get(s.subject_id),
          subjectId: s.subject_id,
          date: s.started_at,
          raw: s,
        })
      }
    }

    return map
  }, [deadlines, tasks, sessions, subjectMap])

  // Navigation handlers
  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function handleJumpToday() {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDateStr(todayStr)
  }

  function handleSelectDate(dateStr) {
    setSelectedDateStr(dateStr)
    setIsInspectorOpen(true)
  }

  // Selected date events for the inspector
  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || []
  }, [eventsByDate, selectedDateStr])

  // Quick Add submit
  async function handleQuickAddSubmit(e) {
    e.preventDefault()
    if (!quickAddTitle.trim() || !user?.id) return

    setQuickAddLoading(true)

    if (quickAddModal.type === 'task') {
      await createTask({
        user_id: user.id,
        title: quickAddTitle.trim(),
        subject_id: quickAddSubjectId || null,
        priority: quickAddPriority,
        due_date: selectedDateStr,
        status: 'pending',
      })
    } else {
      await createDeadline({
        user_id: user.id,
        title: quickAddTitle.trim(),
        subject_id: quickAddSubjectId || null,
        due_date: selectedDateStr,
        deadline_type: 'assignment',
      })
    }

    setQuickAddLoading(false)
    setQuickAddModal({ isOpen: false, type: 'task' })
    setQuickAddTitle('')
    setQuickAddSubjectId('')
    reloadData()
  }

  const calendarGrid = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  return (
    <PageContainer width="wide" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Study Calendar & Timetable
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Unified timetable of your deadlines, scheduled tasks, and study session history.
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[130px] text-center text-xs sm:text-sm font-bold text-foreground">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleJumpToday}
            className="text-xs font-semibold cursor-pointer"
          >
            Today
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Calendar Grid (8 or 12 cols depending on inspector) */}
          <div className={cn(isInspectorOpen ? 'lg:col-span-8' : 'lg:col-span-12', 'transition-all duration-300')}>
            <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-surface-raised/70 text-center text-[11px] font-bold text-muted uppercase tracking-wider py-3">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Month Calendar Cells */}
              <div className="divide-y divide-border/60">
                {calendarGrid.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 divide-x divide-border/60 min-h-[110px] sm:min-h-[130px]">
                    {week.map((cell) => {
                      const events = eventsByDate.get(cell.dateStr) || []
                      const isToday = cell.dateStr === todayStr
                      const isSelected = cell.dateStr === selectedDateStr && isInspectorOpen

                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => handleSelectDate(cell.dateStr)}
                          className={cn(
                            'group p-1.5 sm:p-2.5 transition-all cursor-pointer flex flex-col justify-between hover:bg-surface-raised/60',
                            !cell.isCurrentMonth && 'bg-surface-raised/20 opacity-40',
                            isSelected && 'bg-accent/10 ring-1 ring-accent inset-0',
                          )}
                        >
                          {/* Day Number Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all',
                                isToday
                                  ? 'bg-accent text-white shadow-sm'
                                  : isSelected
                                  ? 'text-accent font-extrabold'
                                  : 'text-foreground/90 group-hover:text-foreground',
                              )}
                            >
                              {cell.day}
                            </span>

                            {events.length > 0 && (
                              <span className="text-[10px] font-mono font-bold text-muted">
                                {events.length}
                              </span>
                            )}
                          </div>

                          {/* Event Indicators list (up to 3 items) */}
                          <div className="space-y-1 my-1 flex-1 overflow-hidden">
                            {events.slice(0, 3).map((ev) => (
                              <div
                                key={ev.id}
                                className={cn(
                                  'truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight flex items-center gap-1 shadow-2xs',
                                  ev.type === 'deadline'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : ev.type === 'task'
                                    ? ev.raw.status === 'completed'
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 line-through opacity-70'
                                      : 'bg-accent/15 text-accent border border-accent/30'
                                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
                                )}
                              >
                                {ev.type === 'deadline' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />}
                                {ev.type === 'task' && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                                {ev.type === 'session' && <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />}
                                <span className="truncate">{ev.title}</span>
                              </div>
                            ))}
                            {events.length > 3 && (
                              <span className="text-[9px] font-bold text-muted block pl-1">
                                +{events.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Inspector Side Drawer (4 cols on lg when open) */}
          <AnimatePresence>
            {isInspectorOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-4 space-y-4"
              >
                <Card className="border-border/90 bg-surface shadow-xl">
                  <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-accent" />
                        <span>{formatDate(selectedDateStr)}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {selectedDateEvents.length} item{selectedDateEvents.length === 1 ? '' : 's'} scheduled or logged.
                      </CardDescription>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInspectorOpen(false)}
                      className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </CardHeader>

                  {/* Day Inspector Content */}
                  <div className="p-4 space-y-4">
                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setQuickAddModal({ isOpen: true, type: 'task' })}
                        className="gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Task</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickAddModal({ isOpen: true, type: 'deadline' })}
                        className="gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>Add Due Date</span>
                      </Button>
                    </div>

                    {/* Events List for Day */}
                    {selectedDateEvents.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted">
                        <Sparkles className="h-5 w-5 mx-auto text-muted/60 mb-2" />
                        <p className="font-semibold">No items on this date</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Use the buttons above to schedule tasks or deadlines.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedDateEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-xl border border-border/80 bg-surface-raised/50 p-3 text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border',
                                  ev.type === 'deadline'
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : ev.type === 'task'
                                    ? 'bg-accent/15 text-accent border-accent/30'
                                    : 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                                )}
                              >
                                {ev.type}
                              </span>

                              {ev.type === 'task' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate('/focus', {
                                      state: { taskId: ev.raw.id, subjectId: ev.raw.subject_id },
                                    })
                                  }
                                  title="Start Focus on this task"
                                  className="flex items-center gap-1 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                                >
                                  <Timer className="h-3 w-3" />
                                  <span>Focus</span>
                                </button>
                              )}
                            </div>

                            <p className="font-bold text-foreground text-sm leading-snug">
                              {ev.title}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                              {ev.subjectName && (
                                <span className="flex items-center gap-1">
                                  <Layers className="h-3 w-3 text-accent" />
                                  {ev.subjectName}
                                </span>
                              )}
                              {ev.duration && (
                                <span className="flex items-center gap-1 font-mono text-purple-300">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(ev.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Add Modal */}
      <AnimatePresence>
        {quickAddModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">
                  Schedule {quickAddModal.type === 'task' ? 'Task' : 'Deadline'} for {formatDate(selectedDateStr)}
                </h3>
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ isOpen: false, type: 'task' })}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAddSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    placeholder={quickAddModal.type === 'task' ? 'e.g. Complete chapter 4 exercise' : 'e.g. Midterm exam submission'}
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Subject (Optional)
                  </label>
                  <select
                    value={quickAddSubjectId}
                    onChange={(e) => setQuickAddSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
                  >
                    <option value="">No specific subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {quickAddModal.type === 'task' && (
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">
                      Priority
                    </label>
                    <select
                      value={quickAddPriority}
                      onChange={(e) => setQuickAddPriority(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickAddModal({ isOpen: false, type: 'task' })}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={quickAddLoading || !quickAddTitle.trim()}
                    className="font-bold cursor-pointer"
                  >
                    {quickAddLoading ? 'Saving...' : 'Save to Calendar'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
