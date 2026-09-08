import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { DeadlineUrgency } from '../components/ui/DeadlineUrgency'
import { DeadlineModal } from '../components/deadlines/DeadlineModal'
import { DeleteDeadlineModal } from '../components/deadlines/DeleteDeadlineModal'
import { useAuth } from '../context/useAuth'
import { getTasks, createTask } from '../services/tasksService'
import {
  getDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} from '../services/deadlinesService'
import { getSubjects } from '../services/subjectsService'
import { supabase } from '../lib/supabase'
import { cn, formatDate, getDeadlineUrgency, toLocalDateKey } from '../lib/utils'
import { bannerVariant, staggerContainer, staggerItem } from '../lib/motion'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function DeadlineTypeIcon({ type }) {
  if (type === 'exam' || type === 'quiz') return <GraduationCap className="h-4 w-4 text-muted" />
  if (type === 'presentation') return <Layers className="h-4 w-4 text-muted" />
  return <FileText className="h-4 w-4 text-muted" />
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

export default function CalendarPage({ initialTab }) {
  const { user } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const defaultTab = useMemo(() => {
    if (initialTab === 'deadlines') return 'deadlines'
    if (searchParams.get('tab') === 'deadlines') return 'deadlines'
    if (location.pathname.includes('/deadlines')) return 'deadlines'
    return 'calendar'
  }, [initialTab, searchParams, location.pathname])

  const [activeTab, setActiveTab] = useState(defaultTab)

  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => toLocalDateKey(today), [today])

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

  // Quick Add Modal State (for Calendar view)
  const [quickAddModal, setQuickAddModal] = useState({ isOpen: false, type: 'task' })
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [quickAddDate, setQuickAddDate] = useState(() => todayStr)
  const [quickAddSubjectId, setQuickAddSubjectId] = useState('')
  const [quickAddPriority, setQuickAddPriority] = useState('medium')
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const [quickAddError, setQuickAddError] = useState('')

  // Deadlines View Filter & Modal State
  const [deadlineSearch, setDeadlineSearch] = useState('')
  const [deadlineTypeFilter, setDeadlineTypeFilter] = useState('all')
  const [deadlineSubjectFilter, setDeadlineSubjectFilter] = useState('all')
  const [deadlineUrgencyFilter, setDeadlineUrgencyFilter] = useState('all')
  const [deadlineModalState, setDeadlineModalState] = useState({ isOpen: false, deadline: null })
  const [deleteDeadlineModalState, setDeleteDeadlineModalState] = useState({
    isOpen: false,
    deadline: null,
  })
  const [deadlineActionLoading, setDeadlineActionLoading] = useState(false)
  const [deadlineBannerError, setDeadlineBannerError] = useState('')

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
      const localDateKey = toLocalDateKey(d.due_date)
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
      const localDateKey = toLocalDateKey(t.due_date)
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
      const localDateKey = toLocalDateKey(s.started_at)
      if (localDateKey) {
        addEvent(localDateKey, {
          id: `sess-${s.id}`,
          type: 'session',
          title: s.duration_minutes ? `${s.duration_minutes}m Focus Session` : 'Focus Session',
          subjectName: subjectMap.get(s.subject_id),
          subjectId: s.subject_id,
          duration: s.duration_minutes || 0,
          date: s.started_at,
          raw: s,
        })
      }
    }

    return map
  }, [deadlines, tasks, sessions, subjectMap])

  // Month navigation handlers
  function handlePrevMonth() {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }

  function handleJumpToday() {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDateStr(todayStr)
    setIsInspectorOpen(true)
  }

  function handleSelectDate(dateStr) {
    setSelectedDateStr(dateStr)
    setIsInspectorOpen(true)
  }

  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || []
  }, [eventsByDate, selectedDateStr])

  // Quick Add submit
  async function handleQuickAddSubmit(e) {
    e.preventDefault()
    if (!user?.id || !quickAddTitle.trim()) return

    setQuickAddLoading(true)
    setQuickAddError('')

    try {
      const targetDate = quickAddDate || selectedDateStr || todayStr

      if (quickAddModal.type === 'task') {
        const res = await createTask({
          userId: user.id,
          title: quickAddTitle.trim(),
          subjectId: quickAddSubjectId || null,
          priority: quickAddPriority,
          dueDate: targetDate,
          status: 'pending',
        })
        if (res.error) {
          setQuickAddError(res.error.message || 'Failed to schedule task.')
          setQuickAddLoading(false)
          return
        }
      } else {
        const res = await createDeadline({
          userId: user.id,
          title: quickAddTitle.trim(),
          subjectId: quickAddSubjectId || null,
          dueDate: targetDate,
          deadlineType: 'assignment',
        })
        if (res.error) {
          setQuickAddError(res.error.message || 'Failed to schedule deadline.')
          setQuickAddLoading(false)
          return
        }
      }

      // If scheduled for another month, smoothly navigate to that month
      const d = new Date(targetDate)
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear())
        setCurrentMonth(d.getMonth())
        setSelectedDateStr(targetDate)
      }

      setQuickAddLoading(false)
      setQuickAddModal({ isOpen: false, type: 'task' })
      setQuickAddTitle('')
      setQuickAddSubjectId('')
      setQuickAddError('')
      await reloadData()
    } catch (err) {
      setQuickAddError(err instanceof Error ? err.message : 'Unexpected error saving item.')
      setQuickAddLoading(false)
    }
  }

  // Deadlines Tab Actions
  async function handleSaveDeadline(formData) {
    if (!user?.id) return
    setDeadlineActionLoading(true)
    setDeadlineBannerError('')

    if (deadlineModalState.deadline) {
      const { data, error } = await updateDeadline({
        id: deadlineModalState.deadline.id,
        userId: user.id,
        ...formData,
      })
      if (error) {
        setDeadlineBannerError(error.message || 'Failed to update deadline.')
      } else if (data) {
        setDeadlineModalState({ isOpen: false, deadline: null })
        await reloadData()
      }
    } else {
      const { data, error } = await createDeadline({
        userId: user.id,
        ...formData,
      })
      if (error) {
        setDeadlineBannerError(error.message || 'Failed to create deadline.')
      } else if (data) {
        setDeadlineModalState({ isOpen: false, deadline: null })
        await reloadData()
      }
    }
    setDeadlineActionLoading(false)
  }

  async function handleDeleteDeadline() {
    if (!user?.id || !deleteDeadlineModalState.deadline) return
    setDeadlineActionLoading(true)
    setDeadlineBannerError('')

    const { error } = await deleteDeadline({
      id: deleteDeadlineModalState.deadline.id,
      userId: user.id,
    })

    if (error) {
      setDeadlineBannerError(error.message || 'Failed to delete deadline.')
    } else {
      setDeleteDeadlineModalState({ isOpen: false, deadline: null })
      await reloadData()
    }
    setDeadlineActionLoading(false)
  }

  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((dl) => {
      const sName = subjectMap.get(dl.subject_id) || ''
      const matchesSearch =
        deadlineSearch === '' ||
        dl.title.toLowerCase().includes(deadlineSearch.toLowerCase()) ||
        sName.toLowerCase().includes(deadlineSearch.toLowerCase())

      const matchesType = deadlineTypeFilter === 'all' || dl.deadline_type === deadlineTypeFilter
      const matchesSubject =
        deadlineSubjectFilter === 'all' || dl.subject_id === deadlineSubjectFilter
      const matchesUrgency =
        deadlineUrgencyFilter === 'all' ||
        getDeadlineUrgency(dl.due_date).level === deadlineUrgencyFilter

      return matchesSearch && matchesType && matchesSubject && matchesUrgency
    })
  }, [
    deadlines,
    subjectMap,
    deadlineSearch,
    deadlineTypeFilter,
    deadlineSubjectFilter,
    deadlineUrgencyFilter,
  ])

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
              Study Calendar & Deadlines
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Unified schedule of your upcoming deadlines, tasks, and study session history.
            </p>
          </div>
        </div>

        {/* Action button changes based on active tab */}
        {activeTab === 'calendar' ? (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setQuickAddDate(selectedDateStr || todayStr)
                setQuickAddModal({ isOpen: true, type: 'task' })
              }}
              className="gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Task</span>
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setDeadlineBannerError('')
              setDeadlineModalState({ isOpen: true, deadline: null })
            }}
            className="gap-1.5 text-xs font-bold shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Deadline</span>
          </Button>
        )}
      </div>

      {/* View Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'calendar'
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-raised',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Calendar Grid</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deadlines')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'deadlines'
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-raised',
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Upcoming Deadlines ({deadlines.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : activeTab === 'calendar' ? (
        /* Calendar Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Calendar Grid (8 or 12 cols depending on inspector) */}
          <div
            className={cn(
              isInspectorOpen ? 'lg:col-span-8' : 'lg:col-span-12',
              'transition-all duration-300',
            )}
          >
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
                  <div
                    key={wIdx}
                    className="grid grid-cols-7 divide-x divide-border/60 min-h-[110px] sm:min-h-[130px]"
                  >
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
                              <span className="text-[10px] font-bold text-muted px-1 rounded-full bg-surface-raised">
                                {events.length}
                              </span>
                            )}
                          </div>

                          {/* Event Indicators Preview (up to 3) */}
                          <div className="mt-1.5 space-y-1 overflow-hidden">
                            {events.slice(0, 3).map((ev) => (
                              <div
                                key={ev.id}
                                className={cn(
                                  'truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight shadow-2xs',
                                  ev.type === 'deadline' &&
                                    'bg-rose-500/15 text-rose-300 border border-rose-500/30',
                                  ev.type === 'task' &&
                                    'bg-accent/15 text-accent border border-accent/30',
                                  ev.type === 'session' &&
                                    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
                                )}
                              >
                                {ev.title}
                              </div>
                            ))}
                            {events.length > 3 && (
                              <div className="text-[9px] font-bold text-muted-foreground pl-1">
                                +{events.length - 3} more
                              </div>
                            )}
                          </div>

                          {/* Cell bottom accent bar */}
                          <div className="h-0.5 w-full mt-1 bg-transparent group-hover:bg-accent/30 rounded-full transition-colors" />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Inspector Panel */}
          <AnimatePresence>
            {isInspectorOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-4"
              >
                <Card className="border border-border bg-surface shadow-2xl overflow-hidden sticky top-6">
                  <CardHeader className="border-b border-border/80 bg-surface-raised/50 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <CardTitle className="text-sm font-bold text-foreground">
                          {selectedDateStr ? formatDate(selectedDateStr) : 'Day Overview'}
                        </CardTitle>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInspectorOpen(false)}
                        className="rounded-lg p-1 text-muted hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close Inspector"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <CardDescription className="text-xs text-muted">
                      {selectedDateEvents.length} scheduled item
                      {selectedDateEvents.length === 1 ? '' : 's'} on this day
                    </CardDescription>
                  </CardHeader>

                  <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {/* Quick Add Shortcut Buttons for this date */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setQuickAddDate(selectedDateStr)
                          setQuickAddModal({ isOpen: true, type: 'task' })
                        }}
                        className="gap-1.5 text-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-accent" />
                        <span>Add Task</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setQuickAddDate(selectedDateStr)
                          setQuickAddModal({ isOpen: true, type: 'deadline' })
                        }}
                        className="gap-1.5 text-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-rose-400" />
                        <span>Add Deadline</span>
                      </Button>
                    </div>

                    {/* Timeline Event Cards */}
                    {selectedDateEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted">
                        No events or tasks scheduled for this day. Click above to schedule something.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedDateEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-xl border border-border/80 bg-surface-raised/40 p-3 text-xs space-y-1.5 hover:border-accent/40 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                  ev.type === 'deadline' && 'bg-rose-500/20 text-rose-300',
                                  ev.type === 'task' && 'bg-accent/20 text-accent',
                                  ev.type === 'session' && 'bg-emerald-500/20 text-emerald-300',
                                )}
                              >
                                {ev.type}
                              </span>
                              {ev.subjectName && (
                                <span className="text-[11px] font-semibold text-muted-foreground truncate">
                                  {ev.subjectName}
                                </span>
                              )}
                            </div>

                            <p className="font-semibold text-foreground text-sm leading-snug">
                              {ev.title}
                            </p>

                            {ev.type === 'task' && ev.priority && (
                              <div className="flex items-center gap-1.5 text-muted text-[11px]">
                                <Flag className="h-3 w-3" />
                                <span className="capitalize">{ev.priority} Priority</span>
                              </div>
                            )}

                            {ev.type === 'deadline' && (
                              <div className="flex items-center gap-1.5 text-rose-300 text-[11px]">
                                <Timer className="h-3 w-3" />
                                <span>{ev.urgency?.label || 'Deadline'}</span>
                              </div>
                            )}
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
      ) : (
        /* Deadlines Management View */
        <div className="space-y-4">
          {/* Banner Error if any */}
          <AnimatePresence>
            {deadlineBannerError && (
              <motion.div
                variants={bannerVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <div
                  className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 p-4 text-xs text-danger"
                  role="alert"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{deadlineBannerError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeadlineBannerError('')}
                    className="text-danger hover:underline ml-3 font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter & Search Bar */}
          <div className="rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border/80">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search deadlines..."
                  value={deadlineSearch}
                  onChange={(e) => setDeadlineSearch(e.target.value)}
                  className="pl-9 text-xs"
                  aria-label="Search deadlines"
                />
              </div>

              {/* Type filter */}
              <Select
                value={deadlineTypeFilter}
                onChange={(e) => setDeadlineTypeFilter(e.target.value)}
                aria-label="Filter by type"
                className="text-xs"
              >
                <option value="all">All types</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
                <option value="presentation">Presentation</option>
                <option value="other">Other</option>
              </Select>

              {/* Subject filter */}
              <Select
                value={deadlineSubjectFilter}
                onChange={(e) => setDeadlineSubjectFilter(e.target.value)}
                aria-label="Filter by subject"
                className="text-xs"
              >
                <option value="all">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>

              {/* Urgency filter */}
              <Select
                value={deadlineUrgencyFilter}
                onChange={(e) => setDeadlineUrgencyFilter(e.target.value)}
                aria-label="Filter by urgency"
                className="text-xs"
              >
                <option value="all">All urgencies</option>
                <option value="urgent">Urgent (≤ 2 days)</option>
                <option value="approaching">Approaching (≤ 7 days)</option>
                <option value="normal">On Track</option>
                <option value="overdue">Overdue</option>
              </Select>
            </div>
          </div>

          {/* Deadlines List */}
          {deadlines.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No deadlines scheduled"
              description="Add deadlines to keep track of exams, project milestones, test dates, or submission targets."
              actionLabel="Add Deadline"
              onAction={() => {
                setDeadlineBannerError('')
                setDeadlineModalState({ isOpen: true, deadline: null })
              }}
            />
          ) : filteredDeadlines.length === 0 ? (
            <EmptyState
              title="No deadlines match your filters"
              description="Try adjusting your search or filter criteria."
            />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {filteredDeadlines.map((dl) => {
                const sName = subjectMap.get(dl.subject_id)
                return (
                  <motion.article
                    key={dl.id}
                    variants={staggerItem}
                    layout
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-4 transition-all duration-200 hover:border-border/80 hover:bg-surface-raised/30 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    {/* Left: icon + title + subject + type badge */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised border border-border/50">
                        <DeadlineTypeIcon type={dl.deadline_type} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{dl.title}</h3>
                        <p className="mt-0.5 text-xs text-muted">
                          {sName || (
                            <span className="italic text-muted-foreground/60">No subject</span>
                          )}
                        </p>
                        {dl.description && (
                          <p className="mt-1 text-xs text-muted line-clamp-1">{dl.description}</p>
                        )}
                        <Badge variant="default" className="mt-2 capitalize text-[10px]">
                          {dl.deadline_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Right: date + urgency + actions */}
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                      <div className="flex flex-col gap-1.5 sm:items-end">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(dl.due_date)}
                        </span>
                        <DeadlineUrgency date={dl.due_date} />
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 sm:mt-1">
                        <button
                          type="button"
                          aria-label={`Edit ${dl.title}`}
                          onClick={() => {
                            setDeadlineBannerError('')
                            setDeadlineModalState({ isOpen: true, deadline: dl })
                          }}
                          className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors active:scale-95 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${dl.title}`}
                          onClick={() => {
                            setDeadlineBannerError('')
                            setDeleteDeadlineModalState({ isOpen: true, deadline: dl })
                          }}
                          className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Add Modal (Calendar view) */}
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
                  Schedule {quickAddModal.type === 'task' ? 'Task' : 'Deadline'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddModal({ isOpen: false, type: 'task' })
                    setQuickAddError('')
                  }}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {quickAddError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {quickAddError}
                </div>
              )}

              <form onSubmit={handleQuickAddSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    placeholder={
                      quickAddModal.type === 'task'
                        ? 'e.g. Complete chapter 4 exercise'
                        : 'e.g. Midterm exam submission'
                    }
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={quickAddDate}
                    onChange={(e) => setQuickAddDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
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
                    <label className="text-xs font-semibold text-muted block mb-1">Priority</label>
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
                    onClick={() => {
                      setQuickAddModal({ isOpen: false, type: 'task' })
                      setQuickAddError('')
                    }}
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

      {/* Deadline Create / Edit Modal */}
      <DeadlineModal
        isOpen={deadlineModalState.isOpen}
        onClose={() => setDeadlineModalState({ isOpen: false, deadline: null })}
        onSave={handleSaveDeadline}
        deadline={deadlineModalState.deadline}
        subjects={subjects}
        loading={deadlineActionLoading}
      />

      {/* Deadline Delete Confirmation Modal */}
      <DeleteDeadlineModal
        isOpen={deleteDeadlineModalState.isOpen}
        onClose={() => setDeleteDeadlineModalState({ isOpen: false, deadline: null })}
        onConfirm={handleDeleteDeadline}
        deadline={deleteDeadlineModalState.deadline}
        loading={deadlineActionLoading}
      />
    </PageContainer>
  )
}
