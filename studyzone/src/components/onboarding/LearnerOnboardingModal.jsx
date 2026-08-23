import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  Briefcase,
  Check,
  Code,
  GraduationCap,
  School,
  Sparkles,
  Trophy,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { LEARNER_TYPES, PRIMARY_GOALS } from '../../lib/learnerProfile'
import { updateLearnerProfile, skipLearnerOnboarding } from '../../services/learnerProfileService'
import { useAuth } from '../../context/useAuth'
import { cn } from '../../lib/utils'

// Icon mapping for learner types
const ICONS = {
  GraduationCap,
  School,
  Briefcase,
  Trophy,
  Code,
  BookOpen,
}

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

/**
 * Modern, focused 3-step onboarding modal for personalized learner setup.
 */
export function LearnerOnboardingModal({ isOpen, onClose }) {
  const { user, refreshProfile } = useAuth()

  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState('college')
  const [selectedGoal, setSelectedGoal] = useState('exams')
  const [focusInput, setFocusInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  // Auto-sync goal recommendations when learner type is selected
  function handleSelectType(typeId) {
    setSelectedType(typeId)
    if (typeId === 'placement') setSelectedGoal('placements')
    else if (typeId === 'competitive_exam') setSelectedGoal('competitive_exam')
    else if (typeId === 'skill_dev') setSelectedGoal('skills')
    else if (typeId === 'self_learning') setSelectedGoal('consistency')
    else setSelectedGoal('exams')
  }

  async function handleComplete() {
    if (!user?.id) return
    setIsSaving(true)
    setErrorMsg('')

    const result = await updateLearnerProfile({
      userId: user.id,
      learnerType: selectedType,
      primaryGoal: selectedGoal,
      learningFocus: focusInput.trim() || null,
      onboardingCompleted: true,
    })

    if (result.error) {
      setErrorMsg(result.error.message || 'Could not save your preferences. Please try again.')
      setIsSaving(false)
    } else {
      await refreshProfile()
      setIsSaving(false)
      onClose?.()
    }
  }

  async function handleSkip() {
    if (!user?.id) return
    setIsSaving(true)
    setErrorMsg('')

    const result = await skipLearnerOnboarding({ userId: user.id })
    if (result.error) {
      console.warn('[StudyZone] Skip onboarding fallback:', result.error)
    }
    await refreshProfile()
    setIsSaving(false)
    onClose?.()
  }

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
          <div className="border-b border-border/80 bg-surface-raised/40 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/25">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                    Welcome to StudyZone
                  </span>
                  <h2
                    id="onboarding-title"
                    className="text-lg font-bold tracking-tight text-foreground"
                  >
                    Personalize your workspace
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSaving}
                aria-label="Skip onboarding"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3].map((s) => (
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
          <div className="p-6 sm:p-8 min-h-[340px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STEP 1 — Learner Category */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      What best describes your learning right now?
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      Select your primary study focus so we can tailor your workspace.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {LEARNER_TYPES.map((type) => {
                      const IconComp = ICONS[type.icon] || BookOpen
                      const isSelected = selectedType === type.id

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleSelectType(type.id)}
                          className={cn(
                            'group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150',
                            isSelected
                              ? 'border-accent bg-accent/10 shadow-xs ring-1 ring-accent/40'
                              : 'border-border bg-surface-raised/40 hover:border-border/80 hover:bg-surface-raised/70',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                              isSelected
                                ? 'border-accent/40 bg-accent text-white'
                                : 'border-border/60 bg-surface-raised text-muted group-hover:text-foreground',
                            )}
                          >
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-foreground">
                                {type.label}
                              </p>
                              {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-tight text-muted line-clamp-2">
                              {type.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Primary Goal */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      What is your main goal right now?
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      We will adapt your task prioritization and AI study guidance.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {PRIMARY_GOALS.map((goal) => {
                      const isSelected = selectedGoal === goal.id

                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setSelectedGoal(goal.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-150',
                            isSelected
                              ? 'border-accent bg-accent/10 shadow-xs ring-1 ring-accent/40'
                              : 'border-border bg-surface-raised/40 hover:border-border/80 hover:bg-surface-raised/70',
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-xs font-semibold text-foreground">{goal.label}</p>
                            <p className="mt-0.5 text-[11px] text-muted">{goal.description}</p>
                          </div>
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                              isSelected
                                ? 'border-accent bg-accent text-white'
                                : 'border-border bg-surface',
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — Current Focus (Optional) */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      What are you currently focused on?
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      Optional — add key topics or courses to help the AI assistant give targeted advice.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label
                      htmlFor="onboarding-focus"
                      className="block text-xs font-medium text-foreground"
                    >
                      Current focus topics or skills
                    </label>
                    <Input
                      id="onboarding-focus"
                      value={focusInput}
                      onChange={(e) => setFocusInput(e.target.value)}
                      placeholder="e.g. Java, NEET Biology, DSA, React, GATE..."
                      className="h-11 text-sm"
                      autoFocus
                    />
                    <div className="rounded-lg bg-surface-raised/60 p-3 border border-border/50">
                      <p className="text-[11px] leading-relaxed text-muted">
                        💡 <strong className="text-foreground font-medium">Tip:</strong> This context
                        helps your AI assistant tailor study plans and recommendations. You can add or
                        update your subjects anytime in the <strong className="text-foreground font-medium">Subjects</strong> tab.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {errorMsg && (
              <p className="mt-3 text-xs text-danger font-medium">{errorMsg}</p>
            )}

            {/* Footer Navigation */}
            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={isSaving}
                  className="gap-1.5 text-xs text-muted"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="text-xs font-medium text-muted hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  Skip for now
                </button>
              )}

              <div className="flex items-center gap-2">
                {step < 3 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setStep((s) => s + 1)}
                    className="gap-1.5 text-xs"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="gap-1.5 text-xs"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Setup</span>
                        <Check className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
