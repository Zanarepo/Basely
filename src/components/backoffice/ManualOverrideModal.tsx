'use client'

import { useState, useRef, useEffect } from 'react'
import { overrideTenantTierAction } from '@/lib/backoffice/actions'
import { useRouter } from 'next/navigation'

interface Props {
  organizationId: string
  currentTier: string
  currentStatus: string
  currentSeats: number
  staffRole: string
}

export function ManualOverrideModal({ organizationId, currentTier, currentStatus, currentSeats, staffRole }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [tier, setTier] = useState(currentTier)
  const [status, setStatus] = useState(currentStatus)
  const [seats, setSeats] = useState(currentSeats)
  const [justification, setJustification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleOverride = async () => {
    if (!justification.trim()) {
      alert("A justification is strictly required for auditing purposes.")
      return
    }
    
    setIsSubmitting(true)
    try {
      await overrideTenantTierAction(organizationId, tier, status, seats, justification)
      setIsOpen(false)
      setJustification('')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Junior support cannot open this modal.
  if (staffRole === 'support_junior') return null

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        Manual Override
      </button>

      {isOpen && (
        <div 
          ref={modalRef} 
          className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden transform origin-top-right transition-all"
        >
          <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/50">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Override Subscription</h3>
            <p className="text-xs text-gray-500 mt-1">Actions are logged permanently.</p>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Target Tier</label>
              <select 
                value={tier} 
                onChange={(e) => setTier(e.target.value)}
                className="w-full text-sm rounded-lg border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm rounded-lg border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="expired">Expired</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Allocated Seats</label>
              <input 
                type="number"
                min="1"
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                className="w-full text-sm rounded-lg border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">Justification (Required)</label>
              <textarea 
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="e.g. Granted 30 day enterprise extension per Sales request"
                className="w-full text-sm rounded-lg border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-gray-900 dark:text-white py-2 px-3 outline-none focus:ring-1 focus:ring-red-500 h-20 resize-none"
              />
            </div>

            <button
              disabled={isSubmitting || !justification.trim()}
              onClick={handleOverride}
              style={{ cursor: isSubmitting || !justification.trim() ? 'not-allowed' : 'pointer' }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Applying...' : 'Execute Override'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
