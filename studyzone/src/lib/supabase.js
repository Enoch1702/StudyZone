import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[StudyZone] Supabase credentials are not configured or using default placeholders. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'
  )
}

/**
 * Centralized Supabase Client for StudyZone.
 * Safe fallback placeholder is supplied when variables are pending configuration.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

/**
 * Safe connection test helper.
 * Tests reachability of the configured Supabase instance without exposing keys or credentials.
 *
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Supabase environment variables are missing or contain placeholder values.',
    }
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(0)
    if (error && error.code !== 'PGRST116') {
      return {
        ok: false,
        message: error.message || 'Supabase query test returned an error.',
      }
    }
    return {
      ok: true,
      message: 'Supabase connection verified successfully.',
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Unknown connection error.',
    }
  }
}
