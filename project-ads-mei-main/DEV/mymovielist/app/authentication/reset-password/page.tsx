'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import styles from '../style/auth.module.css'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid session from the password reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true)
      } else {
        setErrorMessage('Invalid or expired reset link. Please request a new password reset.')
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setSuccessMessage('Password updated successfully! Redirecting to login...')
      setTimeout(() => {
        window.location.href = '/authentication'
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || 'An error occurred while resetting your password.')
      setLoading(false)
    }
  }

  if (!isValidToken && !errorMessage) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Verifying...</h1>
            <p className={styles.subtitle}>Please wait while we verify your reset link.</p>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.subtitle}>Enter your new password below.</p>
        </header>

        {isValidToken ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>

            {successMessage && <p className={styles.success}>{successMessage}</p>}
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}

            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => (window.location.href = '/authentication')}
            >
              Back to login
            </button>
          </form>
        ) : (
          <>
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            <button
              type="button"
              className={styles.button}
              onClick={() => (window.location.href = '/authentication')}
              style={{ marginTop: '1rem' }}
            >
              Return to login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
