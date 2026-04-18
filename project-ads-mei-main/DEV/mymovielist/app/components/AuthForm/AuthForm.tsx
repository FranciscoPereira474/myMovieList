'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn, signUp, checkEmailExists, checkUsernameExists, resetPassword, checkEmailConfirmed, trySignIn } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import AuthFormStyles from '@/app/authentication/style/auth.module.css'

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to validate username (URL-safe characters only)
const isValidUsername = (username: string): boolean => {
  // Only allow letters, numbers, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  return usernameRegex.test(username)
}

interface Props {
  isLogin: boolean
  toggleMode: () => void
  redirectTo?: string
}

export default function AuthForm({ isLogin, toggleMode }: Props) {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [username, setUsername] = useState('') // username first
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') // confirm password
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  const pollRef = useRef<number | null>(null)
  const attemptsRef = useRef(0)
  const maxAttempts = 12
  const pollInterval = 5000

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [])

  const startPollingForConfirmation = () => {
    attemptsRef.current = 0
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      attemptsRef.current += 1
      // Use trySignIn which doesn't throw or log errors
      const success = await trySignIn(email, password)
      if (success) {
        if (pollRef.current) {
          window.clearInterval(pollRef.current)
          pollRef.current = null
        }
        window.location.href = redirectTo
      } else if (attemptsRef.current >= maxAttempts) {
        if (pollRef.current) {
          window.clearInterval(pollRef.current)
          pollRef.current = null
        }
        setLoading(false)
        setErrorMessage('Confirmation timed out. Please click the button below to go to login after confirming your email.')
        setSuccessMessage(null)
        setAwaitingConfirmation(true) // Keep showing the login button
      }
    }, pollInterval)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validate email format first
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address. Make sure to use your email, not your username.')
      setLoading(false)
      return
    }

    try {
      if (isForgotPassword) {
        // Check if email is confirmed before allowing password reset
        const isConfirmed = await checkEmailConfirmed(email)
        if (!isConfirmed) {
          setErrorMessage('This email has not been confirmed yet. Please confirm your email before resetting your password.')
          setLoading(false)
          return
        }
        await resetPassword(email)
        setSuccessMessage('Password reset email sent! Check your inbox for instructions.')
        setLoading(false)
        return
      }

      if (isLogin) {
        const { error: signInError } = await signIn(email, password)
        if (signInError) {
          setErrorMessage(signInError.message || 'Invalid login credentials')
          setLoading(false)
          return
        }
        window.location.href = redirectTo
        return
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.')
        setLoading(false)
        return
      }

      // Validate username format (URL-safe characters only)
      if (!isValidUsername(username)) {
        setErrorMessage('Username can only contain letters, numbers, underscores (_) and hyphens (-).')
        setLoading(false)
        return
      }

      // Check if username is already taken
      const usernameExists = await checkUsernameExists(username)
      if (usernameExists) {
        setErrorMessage('This username is already taken. Please choose a different username.')
        setLoading(false)
        return
      }

      // Check if email is already in use
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        setErrorMessage('This email is already in use. Try logging in instead.')
        setLoading(false)
        return
      }

      const { user, error: signUpError } = await signUp(email, password, username)
      
      if (signUpError) {
        console.error('❌ SignUp error in form:', signUpError)
        // Provide better error messages for common issues
        let errorMsg = signUpError.message || 'Failed to create account'
        if (errorMsg.toLowerCase().includes('database error') || errorMsg.toLowerCase().includes('duplicate')) {
          errorMsg = 'This username is already taken. Please choose a different username.'
        } else if (errorMsg.toLowerCase().includes('user already registered')) {
          errorMsg = 'An account with this email already exists. Try logging in instead.'
        }
        setErrorMessage(errorMsg)
        setLoading(false)
        return
      }
      
      /* DEBUG LOGS */
      // console.log('📧 Account created, waiting for confirmation...')
      setAwaitingConfirmation(true)
      setLoading(false)
      setSuccessMessage('Account created! Please check your email to confirm your account.')
      startPollingForConfirmation()
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || 'An error has occurred during authentication.')
      setSuccessMessage(null)
      setLoading(false)
    }
  }

  const trySignInNow = async () => {
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    const { error } = await signIn(email, password)
    if (error) {
      setErrorMessage(error.message || 'Not yet confirmed. Check your email.')
      setLoading(false)
    } else {
      window.location.href = redirectTo
    }
  }

  const cancelAwaiting = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
    setAwaitingConfirmation(false)
    setLoading(false)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  return (
    <form onSubmit={handleSubmit} className={AuthFormStyles.form}>
      {!isLogin && !isForgotPassword && (
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          required
        />
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {!isForgotPassword && (
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      )}

      {!isLogin && !isForgotPassword && (
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      )}

      <button type="submit" className={AuthFormStyles.button} disabled={loading}>
        {loading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Login' : 'Create Account'}
      </button>

      {successMessage && <p className={AuthFormStyles.success}>{successMessage}</p>}
      {errorMessage && <p className={AuthFormStyles.error}>{errorMessage}</p>}

      {awaitingConfirmation && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className={AuthFormStyles.button}
            onClick={trySignInNow}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'I confirmed my email - Log me in'}
          </button>
          <button
            type="button"
            className={AuthFormStyles.toggleButton}
            onClick={cancelAwaiting}
          >
            Cancel and go back
          </button>
        </div>
      )}

      {!awaitingConfirmation && (
        <>
          {isLogin && !isForgotPassword && (
            <button type="button" className={AuthFormStyles.forgotPassword} onClick={toggleForgotPassword}>
              Forgot your password?
            </button>
          )}

          {isForgotPassword && (
            <button type="button" className={AuthFormStyles.toggleButton} onClick={toggleForgotPassword}>
              Back to login
            </button>
          )}

          {!isForgotPassword && (
            <button type="button" className={AuthFormStyles.toggleButton} onClick={toggleMode}>
              {isLogin ? "Don't have an account yet? Create one" : 'Already have an account? Log in'}
            </button>
          )}
        </>
      )}
    </form>
  )
}
