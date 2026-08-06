'use client'

import { useEffect, useState } from 'react'
import { Tag, X, Clock } from 'lucide-react'
import { getActivePromos } from '@/lib/payments/promo-validation'

export function PromoBanner({ organizationId }: { organizationId: string }) {
  const [promos, setPromos] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load dismissed state from localStorage
    try {
      const saved = localStorage.getItem('zanarepo_dismissed_promos')
      if (saved) setDismissed(JSON.parse(saved))
    } catch {}

    if (organizationId) {
      getActivePromos(organizationId).then(setPromos)
    }
  }, [organizationId])

  const handleDismiss = (promoId: string) => {
    const newDismissed = { ...dismissed, [promoId]: true }
    setDismissed(newDismissed)
    localStorage.setItem('zanarepo_dismissed_promos', JSON.stringify(newDismissed))
  }

  // Find the first active promo that hasn't been dismissed
  const activePromo = promos.find(p => !dismissed[p.id])

  if (!activePromo) return null

  const isExclusive = activePromo.organization_id === organizationId
  
  let countdownText = null
  if (activePromo.valid_until) {
    const daysLeft = Math.ceil((new Date(activePromo.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 0) {
      countdownText = `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`
    } else {
      countdownText = 'Ends today'
    }
  }

  return (
    <div className={`relative flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8 border-b shadow-sm ${
      isExclusive 
        ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white border-amber-600' 
        : 'bg-linear-to-r from-indigo-600 to-purple-600 text-white border-indigo-700'
    }`}>
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Tag className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">
            {isExclusive ? '🎉 Special Offer Just For You!' : '🚀 Flash Sale!'}
          </p>
          <p className="text-xs text-white/90">
            Use code <strong className="bg-white/20 px-1.5 py-0.5 rounded mx-1">{activePromo.code}</strong> 
            for {activePromo.discount_type === 'percentage' ? `${activePromo.discount_value}%` : `$${activePromo.discount_value}`} OFF!
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {countdownText && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-white/10 px-2.5 py-1.5 rounded-full border border-white/20">
            <Clock className="w-3.5 h-3.5" />
            {countdownText}
          </div>
        )}
        <button
          onClick={() => handleDismiss(activePromo.id)}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
