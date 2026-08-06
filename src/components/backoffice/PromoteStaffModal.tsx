'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  staffRole: string
}

export function PromoteStaffModal({ staffRole }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('support_junior')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setResult(null)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Only superadmins can promote staff
  if (staffRole !== 'superadmin') return null

  const handlePromote = async () => {
    if (!email.trim()) return

    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/backoffice/promote-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()

      if (res.ok) {
        setResult({ ok: true, message: data.message || 'User promoted successfully!' })
        setEmail('')
        router.refresh()
      } else {
        setResult({ ok: false, message: data.error || 'Failed to promote user.' })
      }
    } catch (err: any) {
      setResult({ ok: false, message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button 
        type="button"
        onClick={() => { setIsOpen(!isOpen); setResult(null) }}
        style={{ cursor: 'pointer' }}
        className="px-4 py-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
        Add Platform Staff
      </button>

      {isOpen && (
        <div 
          ref={modalRef} 
          className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden transform origin-top-right"
        >
          <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/50">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Promote Existing User</h3>
            <p className="text-xs text-gray-500 mt-1">Use an existing account email to grant platform access.</p>
          </div>
          
          <div className="p-4 space-y-4">
            {result && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                result.ok 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {result.message}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">User Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. pzana.fred@gmail.com"
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white py-2 px-3 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Staff Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white py-2 px-3 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="superadmin">Superadmin (Full Access)</option>
                <option value="support_senior">Support Senior (Read + Write)</option>
                <option value="support_junior">Support Junior (Read Only)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !email.trim()}
              onClick={handlePromote}
              style={{ cursor: isSubmitting || !email.trim() ? 'not-allowed' : 'pointer' }}
              className="w-full py-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Promoting...' : 'Grant Platform Access'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
