// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.
// URL imports, Deno.* globals, and Deno-style TypeScript are intentional.
/**
 * StudyZone AI Assistant — Supabase Edge Function
 *
 * Security boundary between the React client and the Gemini API.
 *
 * Flow:
 *   1. Receive POST from authenticated React client
 *   2. Validate request (Authorization header, body shape)
 *   3. Derive authenticated user securely from JWT (never trust client-provided user_id)
 *   4. Fetch user-scoped StudyZone data (subjects, tasks, deadlines, recent sessions)
 *   5. Assemble clean, normalized AI context with deterministic learning analytics
 *   6. Call Gemini API with system prompt + context + limited history + message
 *   7. Return { reply, actions } or { error }
 *
 * The Gemini API key is read ONLY from Edge Function secrets.
 * It is never present in frontend code or VITE_* variables.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GEMINI_MODEL, MAX_HISTORY_TURNS, SYSTEM_INSTRUCTION } from './gemini-config.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

interface AnalyticsSummary {
  consistency?: {
    current_streak: number
    longest_streak: number
    active_days_7d: number
    active_days_30d: number
  }
  study_time?: {
    total_minutes_7d: number
    average_minutes_per_active_day_7d: number
    most_productive_day_7d: string | null
    total_minutes_30d?: number
    average_minutes_per_active_day_30d?: number
  }
  learning_balance?: Array<{
    subject_name: string
    percentage: number
    total_minutes: number
  }>
  neglected_areas?: Array<{
    subject_name: string
    days_since_last_study: string
  }>
  task_progress?: {
    tasks_created: number
    tasks_completed: number
    completion_rate: number
  }
  upcoming_workload?: {
    upcoming_tasks: number
    upcoming_deadlines: number
    overdue_items: number
    high_priority_tasks: number
    busiest_day: string | null
    workload_level: string
    workload_reasons?: string[]
  }
interface SelectedContext {
  type?: string
  id?: string
  title?: string
  content?: string
}

interface RequestBody {
  message: string
  history?: ConversationTurn[]
  analytics_summary?: AnalyticsSummary
  selected_context?: SelectedContext
}

interface Subject {
  id: string
  name: string
  description: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  due_date: string | null
  estimated_minutes: number | null
  subject_id: string | null
  completed_at: string | null
}

interface Deadline {
  id: string
  title: string
  description: string | null
  deadline_type: string
  due_date: string
  subject_id: string | null
}

interface StudySession {
  id: string
  subject_id: string | null
  task_id: string | null
  started_at: string
  duration_minutes: number
  notes: string | null
}

interface LearnerProfile {
  learner_type: string | null
  primary_goal: string | null
  learning_focus: string | null
}

// ---------------------------------------------------------------------------
// CORS headers — required for Supabase Edge Functions called from browser
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

/**
 * Formats a date string into a human-readable relative label.
 * e.g. "in 3 days", "yesterday", "overdue by 5 days"
 */
function formatRelativeDate(dateStr: string, now: Date): string {
  const date = new Date(dateStr)
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  if (diffDays > 1) return `in ${diffDays} days`
  return `overdue by ${Math.abs(diffDays)} days`
}

/**
 * Builds a concise, structured context string for Gemini.
 * Resolves subject relationships by name. Does not dump raw UUIDs.
 */
function buildContext(
  profile: LearnerProfile | null,
  subjects: Subject[],
  selectedContext: SelectedContext | null,
  analytics: AnalyticsSummary | null,
  now: Date,
): string {
  const lines: string[] = []
  lines.push(`Current date: ${now.toDateString()}`)

  // --- Explicit User-Attached Context (Note, Topic, etc.) ---
  if (selectedContext && (selectedContext.title || selectedContext.content)) {
    lines.push('\n=== EXPLICITLY ATTACHED CONTEXT (Attached by Student) ===')
    if (selectedContext.type) lines.push(`Context Type: ${selectedContext.type}`)
    if (selectedContext.title) lines.push(`Title: ${selectedContext.title}`)
    if (selectedContext.content) {
      // Respect ~6,000 char boundary
      const safeContent = selectedContext.content.slice(0, 6000)
      lines.push(`Content:\n${safeContent}`)
    }
  }

  // --- Learning Analytics (Only present if user explicitly requested coaching review) ---
  if (analytics) {
    lines.push('\n=== LEARNING ANALYTICS (Explicit Request) ===')

    if (analytics.consistency) {
      lines.push('CONSISTENCY:')
      lines.push(`- Current streak: ${analytics.consistency.current_streak} days`)
      lines.push(`- Longest streak: ${analytics.consistency.longest_streak} days`)
      lines.push(`- Active study days (last 7 days): ${analytics.consistency.active_days_7d} of 7`)
      lines.push(`- Active study days (last 30 days): ${analytics.consistency.active_days_30d} of 30`)
    }

    if (analytics.study_time) {
      lines.push('\nSTUDY TIME:')
      lines.push(`- Total study time (last 7 days): ${analytics.study_time.total_minutes_7d} minutes`)
      lines.push(`- Average per active day (last 7 days): ${analytics.study_time.average_minutes_per_active_day_7d} minutes`)
      if (analytics.study_time.most_productive_day_7d) {
        lines.push(`- Most productive day: ${analytics.study_time.most_productive_day_7d}`)
      }
      if (analytics.study_time.total_minutes_30d) {
        lines.push(`- Total study time (last 30 days): ${analytics.study_time.total_minutes_30d} minutes`)
      }
    }

    if (Array.isArray(analytics.learning_balance) && analytics.learning_balance.length > 0) {
      lines.push('\nLEARNING BALANCE (last 30 days):')
      analytics.learning_balance.forEach((item) => {
        lines.push(`- ${item.subject_name}: ${item.percentage}% (${item.total_minutes} min)`)
      })
    }

    if (Array.isArray(analytics.neglected_areas) && analytics.neglected_areas.length > 0) {
      lines.push('\nNEGLECTED AREAS (no study in >14 days or never studied):')
      analytics.neglected_areas.forEach((item) => {
        lines.push(`- ${item.subject_name}: ${item.days_since_last_study}`)
      })
    }

    if (analytics.task_progress) {
      lines.push('\nTASK PROGRESS (last 30 days):')
      lines.push(`- Tasks created: ${analytics.task_progress.tasks_created}`)
      lines.push(`- Tasks completed: ${analytics.task_progress.tasks_completed}`)
      lines.push(`- Completion rate: ${analytics.task_progress.completion_rate}%`)
    }

    if (analytics.upcoming_workload) {
      lines.push('\nUPCOMING WORKLOAD (next 7 days):')
      lines.push(`- Workload Level: ${analytics.upcoming_workload.workload_level || 'Balanced'}`)
      lines.push(`- Upcoming tasks: ${analytics.upcoming_workload.upcoming_tasks}`)
      lines.push(`- Upcoming deadlines: ${analytics.upcoming_workload.upcoming_deadlines}`)
      lines.push(`- Overdue items: ${analytics.upcoming_workload.overdue_items}`)
      lines.push(`- High-priority tasks: ${analytics.upcoming_workload.high_priority_tasks}`)
      if (analytics.upcoming_workload.busiest_day) {
        lines.push(`- Busiest upcoming day: ${analytics.upcoming_workload.busiest_day}`)
      }
      if (Array.isArray(analytics.upcoming_workload.workload_reasons) && analytics.upcoming_workload.workload_reasons.length > 0) {
        lines.push(`- Reasons: ${analytics.upcoming_workload.workload_reasons.join('; ')}`)
      }
    }
  }

  // --- Available Subjects (Minimal reference for proposal linkage) ---
  if (subjects.length > 0) {
    lines.push('\n=== AVAILABLE SUBJECTS (for study planning) ===')
    subjects.forEach((s) => {
      lines.push(`- ${s.name}`)
    })
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

// In-memory cache across function invocations for instant (<1s) execution
let cachedWorkingModel: string | null = null

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // -------------------------------------------------------------------------
    // Step 1: Validate environment secrets
    // -------------------------------------------------------------------------
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!geminiApiKey) {
      console.error('[study-assistant] GEMINI_API_KEY secret is not set.')
      return new Response(
        JSON.stringify({ error: 'AI service is not configured. Please set GEMINI_API_KEY in Supabase secrets.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[study-assistant] Supabase environment variables are missing.')
      return new Response(
        JSON.stringify({ error: 'Service configuration error. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // -------------------------------------------------------------------------
    // Step 2: Parse and validate request body
    // -------------------------------------------------------------------------
    let body: RequestBody
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const message = body.message?.trim()
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawHistory: ConversationTurn[] = Array.isArray(body.history) ? body.history : []
    const analyticsSummary: AnalyticsSummary | null = body.analytics_summary || null
    const selectedContext: SelectedContext | null = body.selected_context || null

    // -------------------------------------------------------------------------
    // Step 3: Authenticate — derive user securely from Authorization header JWT
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userJwt = authHeader.replace('Bearer ', '')

    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(userJwt)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Invalid session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // -------------------------------------------------------------------------
    // Step 4: Fetch user-scoped StudyZone context (Minimal & Privacy-Conscious)
    // We only fetch subject names for proposal linkage. No silent dumping of user notes or tasks.
    // -------------------------------------------------------------------------
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date()

    const [profileResult, subjectsResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('learner_type, primary_goal, learning_focus')
        .eq('id', userId)
        .maybeSingle(),

      supabaseAdmin
        .from('subjects')
        .select('id, name, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ])

    const profile: LearnerProfile | null = profileResult.data || null
    const subjects: Subject[] = subjectsResult.data || []

    // -------------------------------------------------------------------------
    // Step 5: Build clean AI context (Strict Explicit Context In -> AI Out)
    // -------------------------------------------------------------------------
    const contextBlock = buildContext(profile, subjects, selectedContext, analyticsSummary, now)

    // -------------------------------------------------------------------------
    // Step 6: Assemble Gemini request
    // -------------------------------------------------------------------------
    const limitedHistory = rawHistory.slice(-MAX_HISTORY_TURNS)
    const geminiContents: any[] = []

    limitedHistory.forEach((turn) => {
      geminiContents.push({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      })
    })

    const messageWithContext = contextBlock.trim()
      ? `Study Context & Metadata:\n${contextBlock}\n\nStudent's Message:\n${message}`
      : message

    geminiContents.push({
      role: 'user',
      parts: [{ text: messageWithContext }],
    })

    // -------------------------------------------------------------------------
    // Step 7: Dynamic & Cached Model Execution
    // -------------------------------------------------------------------------
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    }

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.95,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }

    // If no working model is cached yet, query Google for available text models once
    let candidateList: string[] = []
    if (cachedWorkingModel) {
      candidateList.push(cachedWorkingModel)
    }

    if (candidateList.length === 0) {
      try {
        const listRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`,
          { headers, signal: AbortSignal.timeout(8_000) }
        )
        if (listRes.ok) {
          const listJson = await listRes.json()
          if (Array.isArray(listJson?.models)) {
            const discovered = listJson.models
              .filter((m: any) => {
                const name = (m.name || '').toLowerCase()
                const canGen = m.supportedGenerationMethods?.includes('generateContent')
                const isExcluded = name.includes('tts') || name.includes('embed') || name.includes('imagen') || name.includes('realtime')
                return canGen && !isExcluded
              })
              .map((m: any) => m.name.replace(/^models\//, ''))

            candidateList.push(...discovered)
          }
        }
      } catch (err) {
        console.warn('[study-assistant] Auto-discovery error:', err)
      }
    }

    // Standard fallback list
    candidateList.push('gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-pro')
    const uniqueModels = Array.from(new Set(candidateList)).filter(Boolean)

    let geminiData: any = null
    let lastErrorMessage = 'The AI service encountered an error. Please try again.'
    let lastErrorStatus = 500

    for (const model of uniqueModels) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`

      let res: Response
      try {
        res = await fetch(geminiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(geminiPayload),
          signal: AbortSignal.timeout(18_000),
        })
      } catch (e) {
        console.error(`[study-assistant] Fetch error for ${model}:`, e)
        cachedWorkingModel = null
        continue
      }

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const errBody = await res.json()
          msg = errBody?.error?.message || msg
        } catch {
          // ignore
        }

        lastErrorStatus = res.status
        lastErrorMessage = msg
        cachedWorkingModel = null

        // If model is unavailable, rate-limited, or overloaded with high demand, try the next model
        if (res.status === 400 || res.status === 404 || res.status === 429 || res.status === 503) {
          continue
        }
        break
      }

      try {
        geminiData = await res.json()
        const parts = geminiData?.candidates?.[0]?.content?.parts || []
        const hasText = parts.some((p: any) => !p.thought && typeof p.text === 'string' && p.text.trim())
        if (hasText || parts.length > 0) {
          // Cache this working model for instant next queries
          cachedWorkingModel = model
          break
        }
      } catch {
        cachedWorkingModel = null
      }
    }

    if (!geminiData) {
      return new Response(
        JSON.stringify({ error: `AI service error: ${lastErrorMessage}` }),
        { status: lastErrorStatus >= 400 && lastErrorStatus < 600 ? lastErrorStatus : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Extract user-facing response text (filtering out internal thinking parts)
    const rawParts: any[] = geminiData?.candidates?.[0]?.content?.parts || []
    const userFacingParts = rawParts
      .filter((p: any) => !p.thought && typeof p.text === 'string')
      .map((p: any) => p.text)

    let reply = userFacingParts.join('\n').trim()
    if (!reply && rawParts.length > 0) {
      reply = (rawParts[rawParts.length - 1]?.text || '').trim()
    }

    if (!reply || reply.trim().length === 0) {
      console.error('[study-assistant] Empty Gemini reply:', JSON.stringify(geminiData))
      return new Response(
        JSON.stringify({ error: 'The AI returned an empty response. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Parse and validate structured action proposals
    const { cleanReply, actions } = parseAndValidateActionProposals(reply, subjects)

    // -------------------------------------------------------------------------
    // Step 8: Return successful response
    // -------------------------------------------------------------------------
    return new Response(JSON.stringify({ reply: cleanReply.trim(), actions: actions || [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Catch-all — never expose internal details to the client
    console.error('[study-assistant] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

/**
 * Extracts, sanitizes, and validates structured action proposals from the AI reply.
 */
interface MilestoneProposal {
  title: string
  description?: string
  position: number
  target_date?: string | null
}

interface ActionProposal {
  id: string
  type: 'create_task' | 'create_deadline' | 'create_learning_plan'
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  deadline_type?: 'exam' | 'assignment' | 'project' | 'quiz' | 'presentation' | 'other'
  due_date?: string | null
  target_date?: string | null
  estimated_minutes?: number | null
  subject_id?: string | null
  subject_name?: string | null
  milestones?: MilestoneProposal[]
}

function parseAndValidateActionProposals(
  rawText: string,
  userSubjects: Subject[],
): { cleanReply: string; actions: ActionProposal[] } {
  const actionBlockRegex = /```(?:action_proposals|json:actions)?\s*([\s\S]*?)```/i
  const match = rawText.match(actionBlockRegex)

  if (!match) {
    return { cleanReply: rawText.trim(), actions: [] }
  }

  const rawJson = match[1].trim()
  const cleanReply = rawText.replace(actionBlockRegex, '').trim()

  try {
    const parsed = JSON.parse(rawJson)
    if (!Array.isArray(parsed)) {
      return { cleanReply, actions: [] }
    }

    const validActions: ActionProposal[] = []
    const now = new Date()

    parsed.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return

      const allowedTypes = ['create_deadline', 'create_task', 'create_learning_plan']
      if (!allowedTypes.includes(item.type)) return

      const type = item.type
      const title = typeof item.title === 'string' ? item.title.trim().slice(0, 200) : ''
      if (!title) return

      const description = typeof item.description === 'string' ? item.description.trim().slice(0, 500) : ''

      if (type === 'create_learning_plan') {
        const milestones: MilestoneProposal[] = []
        if (Array.isArray(item.milestones)) {
          item.milestones.slice(0, 8).forEach((m: any, mIdx: number) => {
            if (m && typeof m === 'object' && typeof m.title === 'string' && m.title.trim()) {
              milestones.push({
                title: m.title.trim().slice(0, 150),
                description: typeof m.description === 'string' ? m.description.trim().slice(0, 300) : undefined,
                position: Number.isInteger(m.position) ? m.position : mIdx + 1,
                target_date: m.target_date && !isNaN(new Date(m.target_date).getTime()) ? new Date(m.target_date).toISOString().slice(0, 10) : null,
              })
            }
          })
        }

        let targetDate: string | null = null
        if (item.target_date) {
          const d = new Date(item.target_date)
          if (!isNaN(d.getTime())) targetDate = d.toISOString().slice(0, 10)
        }

        validActions.push({
          id: `act_${Date.now()}_${idx}`,
          type: 'create_learning_plan',
          title,
          description: description || undefined,
          target_date: targetDate,
          milestones,
        })
        return
      }

      // Subject mapping
      let subjectId: string | null = null
      let subjectName: string | null = null

      if (typeof item.subject_name === 'string' && item.subject_name.trim()) {
        const queryName = item.subject_name.trim().toLowerCase()
        const matchedSub = userSubjects.find(
          (s) => s.name.toLowerCase() === queryName || queryName.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(queryName),
        )
        if (matchedSub) {
          subjectId = matchedSub.id
          subjectName = matchedSub.name
        } else {
          subjectName = item.subject_name.trim()
        }
      }

      // Date validation
      let dueDate: string | null = null
      if (item.due_date) {
        const parsedDate = new Date(item.due_date)
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate.toISOString()
        }
      }

      if (type === 'create_task') {
        const validPriorities = ['low', 'medium', 'high', 'urgent']
        const priority = validPriorities.includes(item.priority?.toLowerCase()) ? item.priority.toLowerCase() : 'medium'
        const estimatedMinutes = Number.isInteger(item.estimated_minutes) && item.estimated_minutes > 0 ? Math.min(item.estimated_minutes, 720) : null

        validActions.push({
          id: `act_${Date.now()}_${idx}`,
          type: 'create_task',
          title,
          description: description || undefined,
          priority,
          due_date: dueDate,
          estimated_minutes: estimatedMinutes,
          subject_id: subjectId,
          subject_name: subjectName,
        })
      } else if (type === 'create_deadline') {
        const validTypes = ['exam', 'assignment', 'project', 'quiz', 'presentation', 'other']
        const deadlineType = validTypes.includes(item.deadline_type?.toLowerCase()) ? item.deadline_type.toLowerCase() : 'assignment'

        if (!dueDate) {
          const defaultDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          dueDate = defaultDate.toISOString()
        }

        validActions.push({
          id: `act_${Date.now()}_${idx}`,
          type: 'create_deadline',
          title,
          description: description || undefined,
          deadline_type: deadlineType,
          due_date: dueDate,
          subject_id: subjectId,
          subject_name: subjectName,
        })
      }
    })

    return { cleanReply, actions: validActions }
  } catch (err) {
    console.warn('[study-assistant] Error parsing action proposals:', err)
    return { cleanReply, actions: [] }
  }
}
