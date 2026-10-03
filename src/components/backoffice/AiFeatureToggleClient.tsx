'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { togglePremiumAiAccess } from '@/lib/backoffice/ai-toggle-actions'
import { useRouter } from 'next/navigation'

export function AiFeatureToggleClient({
  organizationId,
  initialAiEnabled,
  tier
}: {
  organizationId: string
  initialAiEnabled: boolean
  tier: string
}) {
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (tier !== 'premium') return null

  const handleToggle = async () => {
    setLoading(true)
    setError(null)
    const nextState = !aiEnabled
    
    // Optimistic UI update
    setAiEnabled(nextState)
    
    const res = await togglePremiumAiAccess(organizationId, nextState)
    if (res.ok) {
      router.refresh()
    } else {
      setAiEnabled(!nextState) // Revert on failure
      setError(res.error || 'Failed to update Praz-AI setting.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-app-card rounded-2xl border border-app-border p-5 mt-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600/10 text-violet-500 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-app-fg">Premium Praz-AI Access</h3>
            <p className="text-xs text-app-muted mt-0.5">Toggle Generative Praz-AI features for this Premium workspace.</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 disabled:opacity-50 ${
            aiEnabled ? 'bg-violet-600' : 'bg-app-border'
          }`}
          role="switch"
          aria-checked={aiEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              aiEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {loading && <Loader2 className="w-3 h-3 m-1 text-violet-600 animate-spin" />}
          </span>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>}
    </div>
  )
}
