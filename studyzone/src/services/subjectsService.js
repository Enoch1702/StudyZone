import { supabase } from '../lib/supabase'

/**
 * Service handling CRUD operations for the subjects table in Supabase.
 * Enforces user isolation backed by Supabase Row Level Security (auth.uid() = user_id).
 */

/**
 * Fetch all subjects belonging to the authenticated user.
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getSubjects(userId) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required to fetch subjects.') }
  }

  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch subjects.'),
    }
  }
}

/**
 * Create a new subject for the authenticated user.
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID
 * @param {string} params.name - Subject name
 * @param {string} [params.description] - Optional description
 * @param {string} [params.color] - Hex color code
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createSubject({ userId, name, description, color }) {
  if (!userId) {
    return { data: null, error: new Error('Authenticated user is required to create a subject.') }
  }

  const cleanName = name?.trim()
  if (!cleanName) {
    return { data: null, error: new Error('Subject name cannot be empty.') }
  }

  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert([
        {
          user_id: userId,
          name: cleanName,
          description: description?.trim() || null,
          color: color || '#4f7cff',
        },
      ])
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create subject.'),
    }
  }
}

/**
 * Update an existing subject owned by the authenticated user.
 * @param {Object} params
 * @param {string} params.id - Subject UUID
 * @param {string} params.userId - Authenticated user UUID
 * @param {string} params.name - Subject name
 * @param {string} [params.description] - Optional description
 * @param {string} [params.color] - Hex color code
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateSubject({ id, userId, name, description, color }) {
  if (!id || !userId) {
    return { data: null, error: new Error('Subject ID and user ID are required.') }
  }

  const cleanName = name?.trim()
  if (!cleanName) {
    return { data: null, error: new Error('Subject name cannot be empty.') }
  }

  try {
    const { data, error } = await supabase
      .from('subjects')
      .update({
        name: cleanName,
        description: description?.trim() || null,
        color: color || '#4f7cff',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update subject.'),
    }
  }
}

/**
 * Delete a subject owned by the authenticated user.
 * @param {Object} params
 * @param {string} params.id - Subject UUID
 * @param {string} params.userId - Authenticated user UUID
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteSubject({ id, userId }) {
  if (!id || !userId) {
    return { error: new Error('Subject ID and user ID are required.') }
  }

  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete subject.'),
    }
  }
}
