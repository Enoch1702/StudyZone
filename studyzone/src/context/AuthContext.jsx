import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './useAuth'
import { stopAmbientSound } from '../services/soundGeneratorService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  /**
   * Fetches user profile from public.profiles table with safe fallback.
   */
  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        console.warn('[StudyZone] Could not fetch profile from database:', error.message)
      }

      if (data) {
        setProfile(data)
        return data
      }

      // Fallback profile from user metadata if trigger hasn't fired or is delayed
      const fallbackProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split('@')[0] ||
          'Student',
        avatar_url: currentUser.user_metadata?.avatar_url || null,
      }
      setProfile(fallbackProfile)
      return fallbackProfile
    } catch (err) {
      console.error('[StudyZone] Error loading profile:', err)
      return null
    }
  }, [])

  // Initialize session and listen to auth state changes
  useEffect(() => {
    let isMounted = true

    async function initSession() {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('[StudyZone] Error getting session:', error.message)
          setAuthError(error.message)
        }

        if (isMounted) {
          const currentSession = data?.session || null
          const currentUser = currentSession?.user || null
          setSession(currentSession)
          setUser(currentUser)

          if (currentUser) {
            await loadProfile(currentUser)
          } else {
            setProfile(null)
          }
        }
      } catch (err) {
        console.error('[StudyZone] Unexpected session init error:', err)
        if (isMounted) setAuthError(err instanceof Error ? err.message : 'Unknown auth error')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initSession()

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return

      const currentUser = currentSession?.user || null
      setSession(currentSession)
      setUser(currentUser)
      setAuthError(null)

      if (event === 'SIGNED_OUT' || !currentUser) {
        stopAmbientSound()
        setProfile(null)
        setLoading(false)
      } else if (currentUser) {
        await loadProfile(currentUser)
        setLoading(false)
      } else {
        stopAmbientSound()
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  /**
   * Register a new user with email and password.
   */
  const signUp = useCallback(async ({ email, password, fullName }) => {
    setAuthError(null)
    try {
      const cleanEmail = email.trim()
      const cleanName = fullName?.trim() || ''

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      })

      if (error) {
        return { data: null, error, needsEmailConfirmation: false }
      }

      // Check if session was created or if email verification is required
      const needsEmailConfirmation = Boolean(data.user && !data.session)

      return { data, error: null, needsEmailConfirmation }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Sign up failed'
      return { data: null, error: { message: errMessage }, needsEmailConfirmation: false }
    }
  }, [])

  /**
   * Sign in an existing user with email and password.
   */
  const signIn = useCallback(
    async ({ email, password }) => {
      setAuthError(null)
      try {
        const cleanEmail = email.trim()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) {
          return { data: null, error }
        }

        if (data?.user) {
          await loadProfile(data.user)
        }

        return { data, error: null }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : 'Sign in failed'
        return { data: null, error: { message: errMessage } }
      }
    },
    [loadProfile],
  )

  /**
   * Sign out the currently authenticated user.
   */
  const signOut = useCallback(async () => {
    setAuthError(null)
    stopAmbientSound()
    try {
      const { error } = await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
      if (error) return { error }
      return { error: null }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Sign out failed'
      return { error: { message: errMessage } }
    }
  }, [])

  /**
   * Update profile information in database and sync state.
   */
  const updateProfile = useCallback(
    async ({ fullName, avatarUrl }) => {
      if (!user) {
        return { error: { message: 'No authenticated user found.' } }
      }

      try {
        const updates = {
          full_name: fullName !== undefined ? fullName.trim() : profile?.full_name || '',
          updated_at: new Date().toISOString(),
        }
        if (avatarUrl !== undefined) {
          updates.avatar_url = avatarUrl
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)

        if (error) {
          return { error }
        }

        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: { full_name: updates.full_name },
        })

        setProfile((prev) => ({
          ...(prev || {}),
          ...updates,
        }))

        return { error: null }
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : 'Failed to update profile'
        return { error: { message: errMessage } }
      }
    },
    [user, profile],
  )

  /**
   * Refreshes the user profile from database.
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      return await loadProfile(user)
    }
    return null
  }, [user, loadProfile])

  // Context value memoization
  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      authError,
      isConfigured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      authError,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
