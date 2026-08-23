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
 *   5. Assemble clean, normalized AI context
 *   6. Call Gemini API with system prompt + context + limited history + message
 *   7. Return { reply } or { error }
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

interface RequestBody {
  message: string
  history?: ConversationTurn[]
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
  tasks: Task[],
  deadlines: Deadline[],
  sessions: StudySession[],
  now: Date,
): string {
  // Build subject lookup map
  const subjectMap = new Map<string, string>()
  subjects.forEach((s) => subjectMap.set(s.id, s.name))

  const lines: string[] = []
  lines.push(`Current date: ${now.toDateString()}`)

  // --- Learner Profile (if available) ---
  if (profile && (profile.learner_type || profile.primary_goal || profile.learning_focus)) {
    lines.push('\n=== LEARNER PROFILE ===')
    if (profile.learner_type) lines.push(`Learning Category: ${profile.learner_type}`)
    if (profile.primary_goal) lines.push(`Primary Goal: ${profile.primary_goal}`)
    if (profile.learning_focus) lines.push(`Current Focus: ${profile.learning_focus}`)
  }

  // --- Subjects ---
  lines.push('\n=== SUBJECTS ===')
  if (subjects.length === 0) {
    lines.push('No subjects added yet.')
  } else {
    subjects.forEach((s) => {
      lines.push(`- ${s.name}${s.description ? ` (${s.description})` : ''}`)
    })
  }

  // --- Tasks ---
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in-progress')
  const completed = tasks.filter((t) => t.status === 'completed')
  const overdue = pending.filter(
    (t) => t.due_date && new Date(t.due_date).getTime() < now.getTime(),
  )
  const upcoming = pending.filter(
    (t) => !t.due_date || new Date(t.due_date).getTime() >= now.getTime(),
  )

  lines.push('\n=== TASKS ===')

  if (tasks.length === 0) {
    lines.push('No tasks added yet.')
  } else {
    if (overdue.length > 0) {
      lines.push('\nOVERDUE tasks (address these urgently):')
      overdue.forEach((t) => {
        const subject = t.subject_id ? subjectMap.get(t.subject_id) : null
        lines.push(
          `  [${t.priority.toUpperCase()}] ${t.title}${subject ? ` — ${subject}` : ''} — due ${formatRelativeDate(t.due_date!, now)}`,
        )
      })
    }

    if (upcoming.length > 0) {
      lines.push('\nPending / In-progress tasks:')
      upcoming.forEach((t) => {
        const subject = t.subject_id ? subjectMap.get(t.subject_id) : null
        const dueLabel = t.due_date ? ` — due ${formatRelativeDate(t.due_date, now)}` : ' — no due date'
        const estLabel = t.estimated_minutes ? ` (~${t.estimated_minutes} min)` : ''
        lines.push(
          `  [${t.priority.toUpperCase()}] ${t.title}${subject ? ` — ${subject}` : ''}${dueLabel}${estLabel} [${t.status}]`,
        )
      })
    }

    lines.push(`\nCompleted tasks: ${completed.length}`)
  }

  // --- Deadlines ---
  lines.push('\n=== UPCOMING DEADLINES ===')
  const upcomingDeadlines = deadlines.filter(
    (d) => new Date(d.due_date).getTime() >= now.getTime() - 24 * 60 * 60 * 1000, // include today/yesterday
  )

  if (upcomingDeadlines.length === 0) {
    lines.push('No upcoming deadlines.')
  } else {
    upcomingDeadlines.forEach((d) => {
      const subject = d.subject_id ? subjectMap.get(d.subject_id) : null
      lines.push(
        `  [${d.deadline_type.toUpperCase()}] ${d.title}${subject ? ` — ${subject}` : ''} — ${formatRelativeDate(d.due_date, now)}`,
      )
    })
  }

  // --- Recent Study Activity ---
  lines.push('\n=== RECENT STUDY ACTIVITY (last 14 days) ===')
  if (sessions.length === 0) {
    lines.push('No recent study sessions logged.')
  } else {
    // Aggregate by subject
    const subjectMinutes = new Map<string, number>()
    let unlinkedMinutes = 0

    sessions.forEach((s) => {
      if (s.subject_id && subjectMap.has(s.subject_id)) {
        const name = subjectMap.get(s.subject_id)!
        subjectMinutes.set(name, (subjectMinutes.get(name) || 0) + s.duration_minutes)
      } else {
        unlinkedMinutes += s.duration_minutes
      }
    })

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
    lines.push(`Total study time logged: ${totalMinutes} minutes across ${sessions.length} sessions`)

    if (subjectMinutes.size > 0) {
      lines.push('Time by subject:')
      subjectMinutes.forEach((mins, name) => {
        lines.push(`  ${name}: ${mins} min`)
      })
    }
    if (unlinkedMinutes > 0) {
      lines.push(`  Unlinked sessions: ${unlinkedMinutes} min`)
    }

    // Note subjects with NO study time in last 14 days
    const studiedSubjects = new Set(subjectMinutes.keys())
    const neglected = subjects.filter((s) => !studiedSubjects.has(s.name))
    if (neglected.length > 0) {
      lines.push(`Subjects with no recent study time: ${neglected.map((s) => s.name).join(', ')}`)
    }
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
    // Step 4: Fetch user-scoped StudyZone context
    // -------------------------------------------------------------------------
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [profileResult, subjectsResult, tasksResult, deadlinesResult, sessionsResult] = await Promise.all([
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

      supabaseAdmin
        .from('tasks')
        .select('id, title, description, priority, status, due_date, estimated_minutes, subject_id, completed_at')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(50),

      supabaseAdmin
        .from('deadlines')
        .select('id, title, description, deadline_type, due_date, subject_id')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })
        .limit(20),

      supabaseAdmin
        .from('study_sessions')
        .select('id, subject_id, task_id, started_at, duration_minutes, notes')
        .eq('user_id', userId)
        .gte('started_at', fourteenDaysAgo.toISOString())
        .order('started_at', { ascending: false })
        .limit(30),
    ])

    const profile: LearnerProfile | null = profileResult.data || null
    const subjects: Subject[] = subjectsResult.data || []
    const tasks: Task[] = tasksResult.data || []
    const deadlines: Deadline[] = deadlinesResult.data || []
    const sessions: StudySession[] = sessionsResult.data || []

    // -------------------------------------------------------------------------
    // Step 5: Build clean AI context
    // -------------------------------------------------------------------------
    const contextBlock = buildContext(profile, subjects, tasks, deadlines, sessions, now)

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

    const messageWithContext = `Student's StudyZone Profile & Workload Data:\n${contextBlock}\n\nStudent's Question:\n${message}`

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

    // -------------------------------------------------------------------------
    // Step 8: Return successful response
    // -------------------------------------------------------------------------
    return new Response(JSON.stringify({ reply: reply.trim() }), {
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
