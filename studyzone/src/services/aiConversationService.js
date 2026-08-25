import { supabase } from '../lib/supabase'

const LOCAL_CONVS_PREFIX = 'studyzone_local_ai_convs_'
const LOCAL_MSGS_PREFIX = 'studyzone_local_ai_msgs_'

function getLocalConversations(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_CONVS_PREFIX}${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalConversations(userId, convs) {
  try {
    localStorage.setItem(`${LOCAL_CONVS_PREFIX}${userId}`, JSON.stringify(convs))
  } catch {
    // ignore
  }
}

function getLocalMessages(conversationId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_MSGS_PREFIX}${conversationId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalMessages(conversationId, msgs) {
  try {
    localStorage.setItem(`${LOCAL_MSGS_PREFIX}${conversationId}`, JSON.stringify(msgs))
  } catch {
    // ignore
  }
}

/**
 * Deterministically generates a concise title from the first user message.
 */
export function generateConversationTitle(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return 'New Study Conversation'
  }

  let text = messageText.trim()

  // Remove common conversational prefixes
  text = text.replace(
    /^(can you|could you|please|help me|what should i|create a|give me a|give me|how to|i want to)\s+/i,
    '',
  )
  text = text.replace(/[?!.]+$/, '')

  if (!text) return 'Study Conversation'

  // Capitalize first letter and truncate
  const cleaned = text.charAt(0).toUpperCase() + text.slice(1)
  return cleaned.slice(0, 48).trim()
}

/**
 * Fetches all AI conversations for the user, ordered by most recently active.
 * Merges Supabase records with local storage fallback.
 */
export async function getConversations(userId) {
  if (!userId) return { data: [], error: null }

  const localConvs = getLocalConversations(userId)

  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error || !data) {
      // Fallback to local storage if Supabase table is not ready or fails
      return { data: localConvs, error: null }
    }

    // Merge Supabase and Local conversations, deduplicating by ID
    const map = new Map()
    for (const c of localConvs) map.set(c.id, c)
    for (const c of data) map.set(c.id, c)

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )

    return { data: merged, error: null }
  } catch (err) {
    console.warn('Supabase fetch failed, using local storage fallback for conversations:', err)
    return { data: localConvs, error: null }
  }
}

/**
 * Creates a new AI conversation thread (Supabase + LocalStorage fallback).
 */
export async function createConversation({ userId, title }) {
  if (!userId) return { data: null, error: new Error('User is required.') }

  const cleanTitle = (title || 'New Study Conversation').slice(0, 80)
  const nowISO = new Date().toISOString()
  const localFallbackId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const localConvObj = {
    id: localFallbackId,
    user_id: userId,
    title: cleanTitle,
    created_at: nowISO,
    updated_at: nowISO,
  }

  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: cleanTitle,
      })
      .select()
      .single()

    if (error || !data) {
      // Save locally
      const currentLocals = getLocalConversations(userId)
      saveLocalConversations(userId, [localConvObj, ...currentLocals])
      return { data: localConvObj, error: null }
    }

    // Also cache locally
    const currentLocals = getLocalConversations(userId)
    saveLocalConversations(userId, [data, ...currentLocals.filter((c) => c.id !== data.id)])

    return { data, error: null }
  } catch (err) {
    console.warn('Using local fallback for conversation creation:', err)
    const currentLocals = getLocalConversations(userId)
    saveLocalConversations(userId, [localConvObj, ...currentLocals])
    return { data: localConvObj, error: null }
  }
}

/**
 * Updates conversation title.
 */
export async function updateConversationTitle({ conversationId, userId, title }) {
  if (!conversationId || !userId) return { error: null }

  const nowISO = new Date().toISOString()
  const cleanTitle = title.slice(0, 80)

  // Update local storage
  const locals = getLocalConversations(userId)
  const updatedLocals = locals.map((c) =>
    c.id === conversationId ? { ...c, title: cleanTitle, updated_at: nowISO } : c,
  )
  saveLocalConversations(userId, updatedLocals)

  try {
    await supabase
      .from('ai_conversations')
      .update({ title: cleanTitle, updated_at: nowISO })
      .eq('id', conversationId)
      .eq('user_id', userId)

    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Deletes an AI conversation and cascades its messages.
 */
export async function deleteConversation({ conversationId, userId }) {
  if (!conversationId || !userId) return { error: null }

  // Remove from local storage
  const locals = getLocalConversations(userId)
  saveLocalConversations(
    userId,
    locals.filter((c) => c.id !== conversationId),
  )
  try {
    localStorage.removeItem(`${LOCAL_MSGS_PREFIX}${conversationId}`)
  } catch {
    // ignore
  }

  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Fetches all messages for a specific conversation in chronological order.
 */
export async function getConversationMessages(conversationId, userId) {
  if (!conversationId || !userId) return { data: [], error: null }

  const localMsgs = getLocalMessages(conversationId)

  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('id, conversation_id, role, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return { data: localMsgs, error: null }
    }

    // Merge Supabase and Local messages, deduplicating by ID
    const map = new Map()
    for (const m of localMsgs) map.set(m.id, m)
    for (const m of data) map.set(m.id, m)

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    return { data: merged, error: null }
  } catch (err) {
    console.warn('Using local fallback for conversation messages:', err)
    return { data: localMsgs, error: null }
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

  const nowISO = new Date().toISOString()
  const localMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const localMsgObj = {
    id: localMsgId,
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    metadata: metadata || {},
    created_at: nowISO,
  }

  // Always save to local storage immediately
  const existingLocalMsgs = getLocalMessages(conversationId)
  saveLocalMessages(conversationId, [...existingLocalMsgs, localMsgObj])

  // Bump local conversation timestamp
  const locals = getLocalConversations(userId)
  saveLocalConversations(
    userId,
    locals.map((c) => (c.id === conversationId ? { ...c, updated_at: nowISO } : c)),
  )

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
        .update({ updated_at: nowISO })
        .eq('id', conversationId)
        .eq('user_id', userId),
    ])

    if (msgRes.data) {
      // Update local message ID with database ID
      const current = getLocalMessages(conversationId)
      saveLocalMessages(
        conversationId,
        current.map((m) => (m.id === localMsgId ? msgRes.data : m)),
      )
      return { data: msgRes.data, error: null }
    }

    return { data: localMsgObj, error: null }
  } catch {
    return { data: localMsgObj, error: null }
  }
}

/**
 * Updates message metadata (e.g. marking proposed actions as applied/dismissed).
 */
export async function updateMessageMetadata({ messageId, conversationId, userId, metadata }) {
  if (!messageId || !userId) return { error: null }

  if (conversationId) {
    const localMsgs = getLocalMessages(conversationId)
    saveLocalMessages(
      conversationId,
      localMsgs.map((m) => (m.id === messageId ? { ...m, metadata: metadata || {} } : m)),
    )
  }

  try {
    const { error } = await supabase
      .from('ai_messages')
      .update({ metadata: metadata || {} })
      .eq('id', messageId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    return { error: err }
  }
}
