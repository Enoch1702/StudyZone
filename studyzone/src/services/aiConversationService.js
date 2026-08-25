import { supabase } from '../lib/supabase'

/**
 * Deterministically generates a concise title from the first user message.
 */
export function generateConversationTitle(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return 'New Study Conversation'
  }

  let text = messageText.trim()

  // Remove common conversational prefixes
  text = text.replace(/^(can you|could you|please|help me|what should i|create a|give me a|give me|how to|i want to)\s+/i, '')
  text = text.replace(/[?!.]+$/, '')

  if (!text) return 'Study Conversation'

  // Capitalize first letter and truncate
  const cleaned = text.charAt(0).toUpperCase() + text.slice(1)
  return cleaned.slice(0, 48).trim()
}

/**
 * Fetches all AI conversations for the user, ordered by most recently active.
 */
export async function getConversations(userId) {
  if (!userId) return { data: [], error: null }

  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    return { data: data || [], error }
  } catch (err) {
    console.error('Error fetching AI conversations:', err)
    return { data: [], error: err }
  }
}

/**
 * Creates a new AI conversation thread.
 */
export async function createConversation({ userId, title }) {
  if (!userId) return { data: null, error: new Error('User is required.') }

  const cleanTitle = (title || 'New Study Conversation').slice(0, 80)

  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: cleanTitle,
      })
      .select()
      .single()

    return { data, error }
  } catch (err) {
    console.error('Error creating AI conversation:', err)
    return { data: null, error: err }
  }
}

/**
 * Updates conversation title.
 */
export async function updateConversationTitle({ conversationId, userId, title }) {
  if (!conversationId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ title: title.slice(0, 80), updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    console.error('Error updating conversation title:', err)
    return { error: err }
  }
}

/**
 * Deletes an AI conversation and cascades its messages.
 */
export async function deleteConversation({ conversationId, userId }) {
  if (!conversationId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    console.error('Error deleting AI conversation:', err)
    return { error: err }
  }
}

/**
 * Fetches all messages for a specific conversation in chronological order.
 */
export async function getConversationMessages(conversationId, userId) {
  if (!conversationId || !userId) return { data: [], error: null }

  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('id, conversation_id, role, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    return { data: data || [], error }
  } catch (err) {
    console.error('Error fetching conversation messages:', err)
    return { data: [], error: err }
  }
}

/**
 * Saves a message (user or assistant) and bumps the conversation updated_at timestamp.
 */
export async function saveConversationMessage({
  conversationId,
  userId,
  role,
  content,
  metadata = {},
}) {
  if (!conversationId || !userId || !content) return { data: null, error: null }

  try {
    const [msgRes] = await Promise.all([
      supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          metadata: metadata || {},
        })
        .select()
        .single(),

      supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', userId),
    ])

    return { data: msgRes.data, error: msgRes.error }
  } catch (err) {
    console.error('Error saving conversation message:', err)
    return { data: null, error: err }
  }
}

/**
 * Updates message metadata (e.g. marking proposed actions as applied/dismissed).
 */
export async function updateMessageMetadata({ messageId, userId, metadata }) {
  if (!messageId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('ai_messages')
      .update({ metadata: metadata || {} })
      .eq('id', messageId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    console.error('Error updating message metadata:', err)
    return { error: err }
  }
}
