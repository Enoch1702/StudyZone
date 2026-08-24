import { supabase } from '../lib/supabase'

/**
 * Frontend AI service for StudyZone.
 *
 * All communication goes through the Supabase Edge Function `study-assistant`.
 * The Gemini API key NEVER touches the frontend — the Edge Function is the
 * security boundary.
 *
 * @module aiService
 */

/**
 * A single turn in the conversation history.
 * @typedef {Object} ConversationTurn
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/**
 * Send a message to the StudyZone AI assistant.
 *
 * The Supabase client automatically attaches the authenticated user's JWT
 * in the Authorization header — the Edge Function uses this to securely
 * derive the user identity without trusting any client-provided user_id.
 *
 * @param {Object} params
 * @param {string} params.message - The user's message (must be non-empty)
 * @param {Array<{role: 'user'|'assistant', content: string}>} [params.history=[]]
 *   Recent conversation history. Limited to the last 10 turns before sending.
 * @returns {Promise<{ reply: string }>}
 * @throws {Error} Normalized, user-facing error message on any failure
 */
export async function sendMessage({ message, history = [], analyticsSummary = null }) {
  const trimmedMessage = message?.trim()
  if (!trimmedMessage) {
    throw new Error('Please enter a message before sending.')
  }

  // Limit history to the 10 most recent turns on the client side as well
  const limitedHistory = history.slice(-10)

  let data
  let error

  try {
    const result = await supabase.functions.invoke('study-assistant', {
      body: {
        message: trimmedMessage,
        history: limitedHistory,
        analytics_summary: analyticsSummary,
      },
    })
    data = result.data
    error = result.error
  } catch (networkErr) {
    // Network-level failure (e.g. Edge Function unreachable)
    throw new Error(
      'Could not reach the AI service. Please check your connection and try again.',
      { cause: networkErr },
    )
  }

  // Supabase functions.invoke sets error when the function returns a non-2xx status.
  // The actual error message from our Edge Function is in the response body (error.context).
  // data is null for non-2xx responses — we must read the body from the error context.
  if (error) {
    let serverMessage = null

    try {
      // error.context is the raw Response object from the fetch
      const body = await error.context?.json()
      serverMessage = body?.error
    } catch {
      // Body could not be parsed — fall back to generic message
    }

    throw new Error(
      serverMessage || error?.message || 'The AI service returned an error. Please try again.',
    )
  }

  if (!data?.reply || typeof data.reply !== 'string' || data.reply.trim().length === 0) {
    throw new Error('The AI returned an empty response. Please try again.')
  }

  return {
    reply: data.reply.trim(),
    actions: Array.isArray(data?.actions) ? data.actions : [],
  }
}
