'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ImpersonationBanner({ 
  staffRole, 
  targetUserId,
  targetUserName
}: { 
  staffRole: string
  targetUserId: string 
  targetUserName?: string
}) {
  const [isEnding, setIsEnding] = useState(false)
  const router = useRouter()

  const handleEndSession = async () => {
    setIsEnding(true)
    await fetch('/api/backoffice/impersonate', { method: 'DELETE' })
    router.push('/backoffice/tenants')
    router.refresh()
  }

  const isReadOnly = staffRole === 'support_junior'

  return (
    <div className="w-full bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between shadow-md z-50 sticky top-0">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        <span className="text-sm font-black tracking-wide uppercase">
          Impersonation Session Active
        </span>
        <span className="text-xs font-semibold bg-amber-900/10 px-2 py-0.5 rounded ml-2">
          {targetUserName ? `${targetUserName} (${targetUserId})` : targetUserId}
        </span>
        {isReadOnly && (
          <span className="text-[10px] font-bold bg-amber-900 text-amber-100 px-2 py-0.5 rounded ml-2 uppercase">
            Read Only Mode
          </span>
        )}
      </div>

      <button 
        onClick={handleEndSession}
        disabled={isEnding}
        style={{ cursor: isEnding ? 'not-allowed' : 'pointer' }}
        className="px-3 py-1 bg-amber-900 text-amber-100 hover:bg-amber-800 text-xs font-bold rounded shadow-sm transition-colors"
      >
        {isEnding ? 'Ending...' : 'End Impersonation'}
      </button>
    </div>
  )
}
