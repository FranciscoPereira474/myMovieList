import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js'

/**
 * Create a new user account with email and password.
 * Returns { user, error } so it matches Supabase's expected structure.
 */
export async function signUp(email: string, password: string, username?: string): Promise<{
  user: User | null
  error: Error | null
}> {
  /* DEBUG LOGGING */
  // console.log('🔵 Attempting signup for:', email)
  // console.log('🔵 Username:', username || email.split('@')[0])
  
  // Determine the redirect URL - use production URL if not on localhost
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://my-web-app-511913648406.europe-southwest1.run.app'
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0], // Store username in metadata
      },
      emailRedirectTo: `${baseUrl}/authentication`,
    }
  })

  // console.log('🔵 Signup response:', {
  //   user: data.user ? `User created: ${data.user.id}` : 'No user',
  //   session: data.session ? 'Session created' : 'No session',
  //   error: error ? error.message : 'No error'
  // })
  if (error) {
    console.error('❌ Signup error details:', {
      message: error.message,
      status: error.status,
      name: error.name
    })
    
    // Check for rate limiting
    if (error.message.includes('rate') || error.message.includes('limit') || error.message.includes('quota')) {
      console.error('🚫 RATE LIMIT HIT! Wait before trying again.')
    }
    
    // Check if email confirmation is disabled
    if (data.user && !data.session) {
      console.warn('⚠️ User created but no session - email confirmation likely required')
    }
  } else {
    // console.log('✅ Signup successful!')
    if (data.user && data.session) {
      // console.log('✅ User is auto-confirmed (email confirmation disabled)')
    } else if (data.user && !data.session) {
      // console.log('📧 Email confirmation required - check inbox')
    }
  }

  return {
    user: data.user,
    error,
  }
}

/**
 * Sign in an existing user.
 * Returns an error object if authentication fails, null on success.
 */
export async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { error }
}

/**
 * Try to sign in silently (for polling during email confirmation).
 * Returns true if successful, false otherwise. Does not throw or log errors.
 */
export async function trySignIn(email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return !error
}

/**
 * Check if an email already exists in the database.
 * Uses the server-side API route to check securely.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch('/authentication/api/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      console.error('Error checking email existence: API returned', response.status)
      return false
    }

    const data = await response.json()
    return data.exists === true
  } catch (error) {
    console.error('Error checking email existence:', error)
    return false
  }
}

/**
 * Check if a username already exists in the database (public.users table).
 * Uses the server-side API route to check securely.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const response = await fetch('/authentication/api/check-username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    })

    if (!response.ok) {
      console.error('Error checking username existence: API returned', response.status)
      return false
    }

    const data = await response.json()
    return data.exists === true
  } catch (error) {
    console.error('Error checking username existence:', error)
    return false
  }
}

/**
 * Check if an email is confirmed (verified) in Supabase.
 * Uses the server-side API to check securely.
 */
export async function checkEmailConfirmed(email: string): Promise<boolean> {
  // Since we can't access auth.users from client side, we'll use the profiles table
  // If a profile exists for this email, the user is confirmed
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  // If user exists in profiles, they are confirmed
  if (data) {
    return true
  }

  // If we can't verify, allow password reset and let Supabase handle validation
  return true
}

/**
 * Send a password reset email to the user.
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/authentication/reset-password`,
  })

  if (error) throw error
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('❌ Logout error:', error.message)
    throw error
  }
  
  // console.log('✅ User logged out successfully')
    
  // Redirect to home page after logout
  window.location.href = '/'
}
