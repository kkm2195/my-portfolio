import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const adminEmail = (
  import.meta.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  import.meta.env.VITE_ADMIN_EMAIL ||
  ''
)
  .trim()
  .toLowerCase()

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const user = session?.user ?? null
  const isAdmin = useMemo(() => {
    if (!user) return false
    if (!adminEmail) return true // any logged-in user counts as admin if no email set
    return (user.email || '').toLowerCase() === adminEmail
  }, [user])

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    session,
    user,
    isAdmin,
    loading,
    signIn,
    signOut,
    configured: isSupabaseConfigured,
  }
}
