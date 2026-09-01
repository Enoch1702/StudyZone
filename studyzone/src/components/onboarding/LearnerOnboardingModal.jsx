import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  FileText,
  Flame,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { createSubject } from '../../services/subjectsService'
import { createTask } from '../../services/tasksService'
import { updateLearnerProfile, skipLearnerOnboarding } from '../../services/learnerProfileService'
import { useAuth } from '../../context/useAuth'
import { cn } from '../../lib/utils'

const overlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const modalVariant = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 350 },
  },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
}

const stepVariant = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15, ease: 'easeIn' } },
}

// Suggested popular subjects for quick 1-click start
const QUICK_SUBJECTS = [
  { name: 'Data Structures & Algorithms', color: '#3b82f6', category: 'Computer Science' },
  { name: 'Operating Systems & Networks', color: '#6366f1', category: 'Computer Science' },
  { name: 'Mathematics & Calculus', color: '#10b981', category: 'Science' },
  { name: 'Fullstack Web Development', color: '#f59e0b', category: 'Software' },
]

export function LearnerOnboardingModal({ isOpen, onClose }) {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [selectedSubjectColor, setSelectedSubjectColor] = useState('#3b82f6')
  const [customSubjectInput, setCustomSubjectInput] = useState('')
  const [isCustomSubject, setIsCustomSubject] = useState(false)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')

  const [createdSubjectId, setCreatedSubjectId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  function handleSelectQuickSubject(sub) {
    setSelectedSubjectName(sub.name)
    setSelectedSubjectColor(sub.color)
    setIsCustomSubject(false)
    setCustomSubjectInput('')
    setErrorMsg('')
  }

  function handleCustomSubjectSelect() {
    setIsCustomSubject(true)
    setSelectedSubjectName(customSubjectInput.trim())
    setErrorMsg('')
  }

  // Progress to step 3 after validating or creating the subject
  async function handleSubjectStepNext() {
    const subjectName = isCustomSubject ? customSubjectInput.trim() : selectedSubjectName.trim()
    if (!subjectName) {
      setErrorMsg('Please select or enter a subject name to continue.')
      return
    }

    setIsSaving(true)
    setErrorMsg('')

    try {
      if (user?.id) {
        const res = await createSubject({
          userId: user.id,
          name: subjectName,
          color: selectedSubjectColor,
          description: 'Created during initial setup',
        })
        if (res.data?.id) {
          setCreatedSubjectId(res.data.id)
        }
      }
      setStep(3)
    } catch (err) {
      console.warn('Subject creation note:', err)
      setStep(3)
    } finally {
      setIsSaving(false)
    }
  }

  // Progress to step 4 after creating task
  async function handleTaskStepNext() {
    setIsSaving(true)
    setErrorMsg('')

    try {
      if (taskTitle.trim() && user?.id) {
        await createTask({
          userId: user.id,
          subjectId: createdSubjectId || null,
          title: taskTitle.trim(),
          dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
          priority: 'high',
          status: 'pending',
        })
      }
      setStep(4)
    } catch (err) {
      console.warn('Task creation note:', err)
      setStep(4)
    } finally {
      setIsSaving(false)
    }
  }

  // Complete onboarding and optionally navigate
  async function handleFinish(destinationRoute = '/dashboard') {
    if (!user?.id) return
    setIsSaving(true)
    setErrorMsg('')

    try {
      await updateLearnerProfile({
        userId: user.id,
        onboardingCompleted: true,
      })
      await refreshProfile()
    } catch (err) {
      console.warn('Onboarding completion note:', err)
    } finally {
      setIsSaving(false)
      onClose?.()
      if (destinationRoute) {
        navigate(destinationRoute)
      }
    }
  }

  async function handleSkip() {
    if (!user?.id) return
    setIsSaving(true)
    try {
      await skipLearnerOnboarding({ userId: user.id })
      await refreshProfile()
    } catch (err) {
      console.warn('[StudyZone] Skip onboarding fallback:', err)
    } finally {
      setIsSaving(false)
      onClose?.()
    }
  }

  const effectiveSubjectName = isCustomSubject ? customSubjectInput.trim() : selectedSubjectName

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          variants={overlayVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          variants={modalVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl z-10"
        >
          {/* Header Banner */}
          <div className="border-b border-border/80 bg-surface-raised/40 px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    Welcome to StudyZone
                  </span>
                  <h2
                    id="onboarding-title"
                    className="text-base sm:text-lg font-extrabold tracking-tight text-foreground"
                  >
                    {step === 1 && 'Your Learning Operating System'}
                    {step === 2 && 'What are you learning right now?'}
                    {step === 3 && 'Add your first study task'}
                    {step === 4 && 'You are ready to learn!'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSaving}
                aria-label="Skip onboarding"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                title="Skip setup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="mt-3.5 flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    s === step
                      ? 'bg-accent'
                      : s < step
                        ? 'bg-accent/50'
                        : 'bg-surface-raised border border-border/40',
                  )}
                />
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 min-h-[350px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STEP 1 — Welcome & Workflow Overview */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    StudyZone is built around one continuous learning workflow to keep you in flow:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 mb-2 font-bold text-xs">
                        1
                      </div>
                      <p className="text-xs font-bold text-foreground">PLAN</p>
                      <p className="text-[11px] text-muted mt-0.5">Subjects & Tasks</p>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 mb-2 font-bold text-xs">
                        2
                      </div>
                      <p className="text-xs font-bold text-foreground">FOCUS</p>
                      <p className="text-[11px] text-muted mt-0.5">Timer & Audio</p>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mb-2 font-bold text-xs">
                        3
                      </div>
                      <p className="text-xs font-bold text-foreground">CAPTURE</p>
                      <p className="text-[11px] text-muted mt-0.5">Study Notes</p>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 mb-2 font-bold text-xs">
                        4
                      </div>
                      <p className="text-xs font-bold text-foreground">TRACK</p>
                      <p className="text-[11px] text-muted mt-0.5">Daily Streaks</p>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 mb-2 font-bold text-xs">
                        5
                      </div>
                      <p className="text-xs font-bold text-foreground">IMPROVE</p>
                      <p className="text-[11px] text-muted mt-0.5">AI Coaching</p>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 mb-2 font-bold text-xs">
                        6
                      </div>
                      <p className="text-xs font-bold text-foreground">REMEMBER</p>
                      <p className="text-[11px] text-muted mt-0.5">SM-2 Flashcards</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted">
                    Let&apos;s set up your first subject and task in 30 seconds so your dashboard is immediately actionable.
                  </p>
                </motion.div>
              )}

              {/* STEP 2 — Create First Subject */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-xs text-muted">
                    Subjects organize your tasks, notes, study logs, and flashcard decks. Select a quick topic or enter your own:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {QUICK_SUBJECTS.map((sub) => {
                      const isSelected = !isCustomSubject && selectedSubjectName === sub.name
                      return (
                        <button
                          key={sub.name}
                          type="button"
                          onClick={() => handleSelectQuickSubject(sub)}
                          className={cn(
                            'flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer',
                            isSelected
                              ? 'border-accent bg-accent/10 shadow-xs ring-1 ring-accent/40'
                              : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-raised/40',
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {sub.name}
                              </p>
                              <p className="text-[10px] text-muted">{sub.category}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Subject Input */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCustomSubjectSelect}
                      className={cn(
                        'w-full text-left rounded-xl border p-3 transition-all cursor-pointer mb-2 text-xs font-bold',
                        isCustomSubject
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border/80 bg-surface text-foreground hover:bg-surface-raised/40',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>+ Enter Custom Subject</span>
                        {isCustomSubject && <Check className="h-4 w-4 text-accent" />}
                      </div>
                    </button>

                    {isCustomSubject && (
                      <div className="space-y-1.5 pt-1">
                        <Input
                          placeholder="e.g. Machine Learning, Biology, Economics..."
                          value={customSubjectInput}
                          onChange={(e) => setCustomSubjectInput(e.target.value)}
                          autoFocus
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {errorMsg && <p className="text-xs text-danger font-medium">{errorMsg}</p>}
                </motion.div>
              )}

              {/* STEP 3 — Add First Task */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-xs text-muted">
                    What is one specific study goal or topic you want to complete first?
                  </p>

                  <div className="rounded-xl border border-border/80 bg-surface-raised/40 p-3.5 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>Linked Subject:</span>
                      <span className="font-bold text-foreground px-2 py-0.5 rounded-md bg-surface border border-border">
                        {effectiveSubjectName || 'General Studies'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="onboarding-task-title" className="block text-xs font-semibold text-foreground">
                        Task Title <span className="text-accent">*</span>
                      </label>
                      <Input
                        id="onboarding-task-title"
                        placeholder="e.g. Review lecture notes & solve 3 practice problems"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        autoFocus
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="onboarding-task-due" className="block text-xs font-semibold text-muted">
                        Due Date (Optional)
                      </label>
                      <Input
                        id="onboarding-task-due"
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted">
                    This task will appear directly on your Dashboard in <strong>Today&apos;s Focus</strong> and power your <strong>Best Next Action</strong>.
                  </p>

                  {errorMsg && <p className="text-xs text-danger font-medium">{errorMsg}</p>}
                </motion.div>
              )}

              {/* STEP 4 — Ready to Learn! */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4 text-center py-2"
                >
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-foreground">
                      Workspace Ready!
                    </h3>
                    <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                      Subject <strong className="text-foreground">{effectiveSubjectName}</strong> and your first task have been saved. Where would you like to start?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleFinish('/focus')}
                      className="group flex flex-col items-center justify-center rounded-xl border border-accent/40 bg-accent/10 p-3.5 text-accent hover:bg-accent hover:text-white transition-all cursor-pointer shadow-xs"
                    >
                      <Flame className="h-5 w-5 mb-1.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Start Focus</span>
                      <span className="text-[10px] opacity-80 mt-0.5">Pomodoro & Sound</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFinish('/notes')}
                      className="group flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-3.5 text-foreground hover:border-accent/40 hover:bg-surface-raised transition-all cursor-pointer shadow-xs"
                    >
                      <FileText className="h-5 w-5 mb-1.5 text-muted group-hover:text-accent transition-colors" />
                      <span className="text-xs font-bold">Study Notes</span>
                      <span className="text-[10px] text-muted mt-0.5">Markdown & AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFinish('/flashcards')}
                      className="group flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-3.5 text-foreground hover:border-accent/40 hover:bg-surface-raised transition-all cursor-pointer shadow-xs"
                    >
                      <Brain className="h-5 w-5 mb-1.5 text-muted group-hover:text-accent transition-colors" />
                      <span className="text-xs font-bold">Flashcards</span>
                      <span className="text-[10px] text-muted mt-0.5">SM-2 Spaced Recall</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
              {step > 1 && step < 4 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={isSaving}
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Skip setup
                </button>
              )}

              {step === 1 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === 2 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubjectStepNext}
                  disabled={isSaving || (!selectedSubjectName && !customSubjectInput.trim())}
                  className="gap-1.5 text-xs font-bold cursor-pointer"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : <span>Continue</span>}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === 3 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleTaskStepNext}
                  disabled={isSaving}
                  className="gap-1.5 text-xs font-bold cursor-pointer"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : <span>Continue</span>}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === 4 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleFinish('/dashboard')}
                  disabled={isSaving}
                  className="gap-1.5 text-xs font-bold cursor-pointer"
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : <span>Go to Dashboard</span>}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
