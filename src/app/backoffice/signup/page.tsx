'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { createStaffAccount } from '@/lib/backoffice/staff-actions'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')
  const prefilledEmail = searchParams.get('email')

  const [email, setEmail] = useState(prefilledEmail || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }])
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // 1. Create account via Admin API (bypasses Supabase confirmation emails)
    const result = await createStaffAccount(email, password)
    if (!result.ok) {
      showToast('error', result.error || 'Failed to create account')
      setLoading(false)
      return
    }

    // 2. Log them in manually
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      showToast('error', authError.message || 'Login failed after signup')
      setLoading(false)
      return
    }

    showToast('success', 'Account created successfully! Redirecting...')

    // Give the toast a moment to display before redirecting
    setTimeout(() => {
      if (nextPath) {
        window.location.href = nextPath
      } else {
        router.push('/backoffice')
        router.refresh()
      }
    }, 1500)
  }

  return (
    <>
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
          Staff Email
        </label>
        <input 
          type="email" 
          required
          value={email}
          readOnly={!!prefilledEmail}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${prefilledEmail ? 'opacity-70 cursor-not-allowed bg-gray-50 dark:bg-[#151515]' : ''}`}
          placeholder="admin@baseline.com"
        />
      </div>
      
      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
          Choose a Password
        </label>
        <input 
          type="password" 
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
          placeholder="••••••••"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        style={{ cursor: 'pointer' }}
        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'Creating Account...' : 'Set Up Account'}
      </button>
      
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link href={`/backoffice/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          Sign in here
        </Link>
      </div>
    </form>
    <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </>
  )
}

export default function BackofficeSignup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply filter animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-[#111] p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-white/5">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Baseline <span className="text-indigo-600">Ops</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Set up your account to accept the invitation
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-sm text-gray-500">Loading...</div>}>
            <SignupForm />
          </Suspense>
          
        </div>
      </div>
    </div>
  )
}
