import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  BookOpen,
  CheckSquare,
  Timer,
  FileText,
  Brain,
  X,
  Compass,
} from 'lucide-react'
import { Card } from '../ui/Card'

const DISMISS_KEY = 'studyzone_dismiss_getting_started'

export function GettingStartedCard() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true'
    } catch {
      return false
    }
  })

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  if (dismissed) return null

  const steps = [
    {
      num: '1',
      title: 'Create a Subject',
      desc: 'Organize what you study',
      to: '/subjects',
      icon: BookOpen,
      color: 'text-accent bg-accent/10 border-accent/25',
    },
    {
      num: '2',
      title: 'Add a Task',
      desc: 'Track specific goals',
      to: '/tasks',
      icon: CheckSquare,
      color: 'text-foreground bg-surface-raised border-border',
    },
    {
      num: '3',
      title: 'Start Focus',
      desc: '25-min Pomodoro timer',
      to: '/focus',
      icon: Timer,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
    },
    {
      num: '4',
      title: 'Capture Notes',
      desc: 'Markdown & AI summary',
      to: '/notes',
      icon: FileText,
      color: 'text-foreground/80 bg-surface-raised border-border',
    },
    {
      num: '5',
      title: 'Practice Cards',
      desc: 'Active recall spaced review',
      to: '/flashcards',
      icon: Brain,
      color: 'text-accent bg-accent/10 border-accent/25',
    },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="relative overflow-hidden border-border/90 bg-surface shadow-xs p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Getting Started</h3>
                <p className="text-[11px] text-muted">A quick guide to how the core StudyZone tools connect</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss getting started guide"
              className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {steps.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.num}
                  to={s.to}
                  className="group flex flex-col justify-between rounded-xl border border-border/70 bg-surface-raised/40 p-3 hover:border-accent/40 hover:bg-surface-raised transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold text-muted">STEP {s.num}</span>
                    <div className={`p-1 rounded-md border ${s.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-muted truncate mt-0.5">{s.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
