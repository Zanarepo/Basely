'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { SignOutButton } from '@/components/SignOutButton'
import type { User } from '@supabase/supabase-js'

type ActiveSessionBannerProps = {
  continueHref?: string
  inviteMode?: boolean
}

export function ActiveSessionBanner({
  continueHref = '/dashboard',
  inviteMode = false,
}: ActiveSessionBannerProps) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setChecking(false)
    })
  }, [])

  if (checking || !user) return null

  return (
    <div className="flex flex-col gap-3 p-4 mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-sm">
      <p className="text-indigo-700 dark:text-indigo-200">
        You&apos;re already signed in as{' '}
        <span className="font-semibold text-app-fg">{user.email}</span>.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={continueHref}
          className="font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
        >
          {inviteMode ? 'Accept invitation' : 'Continue to app'}
        </Link>
        <span className="text-app-subtle">/</span>
        <SignOutButton />
      </div>
    </div>
  )
}