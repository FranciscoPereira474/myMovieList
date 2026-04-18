// Página principal de autenticação

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthForm from '@/app/components/AuthForm/AuthForm'
import { supabase } from '@/lib/supabaseClient'
import styles from './style/auth.module.css'

function AuthContent() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const toggleMode = () => setIsLogin((s) => !s)

  // Check if user is already authenticated and redirect them
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // User is already logged in, redirect them
        window.location.href = redirectTo
      } else {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [redirectTo])

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Checking session...</h1>
            <p className={styles.subtitle}>Please wait</p>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className={styles.subtitle}>
            {isLogin ? 'Sign in to continue to your dashboard.' : 'Sign up and confirm your email to get started.'}
          </p>
        </header>

        <AuthForm isLogin={isLogin} toggleMode={toggleMode} redirectTo={redirectTo} />
      </div>
    </div>
  )
}

export default function AuthenticationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  )
}