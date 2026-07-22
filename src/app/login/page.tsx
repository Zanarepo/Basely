'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { LogIn, Mail, Lock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { ActiveSessionBanner } from '@/components/ActiveSessionBanner'
import { AuthPageShell } from '@/components/AuthPageShell'
import { useSsoLogin } from './hooks/useSsoLogin'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const safeNext = next.startsWith('/') ? next : '/dashboard'
  const isInviteFlow = safeNext.startsWith('/invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    searchParams.get('error')
  )
  const [successMsg, setSuccessMsg] = useState<string | null>(() =>
    searchParams.get('message')
  )

  const { isCheckingSso, checkAndRedirectSso, initiateSsoFlow } = useSsoLogin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Quick client validations
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      // 1. Check if SSO is enforced for this email
      const { isSsoEnforced, orgId, isBreakGlass, idpUrl } = await checkAndRedirectSso(email)

      if (isSsoEnforced && orgId && !isBreakGlass) {
        // Enforced and not the break-glass admin -> redirect to IdP
        const { error: ssoError } = await initiateSsoFlow(orgId, email, idpUrl)
        if (ssoError) {
          setErrorMsg(ssoError)
          setLoading(false)
        }
        // Keep loading true if redirecting successfully
        return
      }

      // 2. Otherwise, proceed with native Supabase password login
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data?.user) {
        router.refresh()
        router.push(safeNext)
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      })
      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
      }
    } catch {
      setErrorMsg('Could not initialize OAuth flow.')
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-600 shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] mb-4 animate-pulse">
            <LogIn className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-app-fg">
            Baseline
          </h1>
          <p className="mt-2 text-sm text-app-muted font-medium">
            Sign in to accept your workspace invitation.
          </p>
        </div>

        <div className="auth-card">
          <h2 className="text-xl font-semibold text-app-fg mb-2">
            {isInviteFlow ? 'Sign in to join workspace' : 'Welcome back'}
          </h2>

          {isInviteFlow && (
            <p className="mb-6 text-sm text-app-muted">
              Use your existing account to accept this invitation. If the invited email matches, the workspace will be added to your switcher.
            </p>
          )}

          <ActiveSessionBanner continueHref={safeNext} inviteMode={isInviteFlow} />

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in">
              <ShieldAlert className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="auth-label">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-app-subtle group-focus-within:text-indigo-500 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="auth-label">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-app-subtle group-focus-within:text-indigo-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isCheckingSso}
              className="relative w-full py-3.5 px-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading || isCheckingSso ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isCheckingSso ? 'Checking security policies...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isInviteFlow ? 'Sign in and accept invite' : 'Sign In'}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app-border" />
            </div>
            <span className="relative px-3 bg-app-surface text-xs font-semibold text-app-subtle uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="auth-oauth-btn"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className="auth-oauth-btn"
            >
              <svg className="h-5 w-5 text-app-fg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="text-center mt-6 text-sm text-app-muted">
            {isInviteFlow ? 'New to Baseline?' : 'Don&apos;t have an account?'}{' '}
            <Link
              href={
                safeNext !== '/dashboard'
                  ? `/register?next=${encodeURIComponent(safeNext)}`
                  : '/register'
              }
              className="font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
    </AuthPageShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-app-bg text-app-fg text-sm font-semibold tracking-wider animate-pulse">
        Loading Baseline...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
