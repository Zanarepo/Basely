'use client'

import React, { useState } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'

interface ManualPlanSwitcherProps {
  organizationId: string
  onPlanChanged?: () => void
}

export const ManualPlanSwitcher: React.FC<ManualPlanSwitcherProps> = ({
  organizationId,
  onPlanChanged,
}) => {
  const { tier, isTrialing, isExpired, daysRemaining, updating, switchPlan } = useWorkspaceTier(organizationId)
  const [isHovered, setIsHovered] = useState(false)
  const [activeTab, setActiveTab] = useState<'switch' | 'simulate'>('switch')

  const handleSwitch = async (targetTier: TierId, simulateExpire = false) => {
    await switchPlan(targetTier, simulateExpire)
    if (onPlanChanged) onPlanChanged()
  }

  const tiers: { id: TierId; name: string; badge: string; color: string }[] = [
    { id: 'free', name: 'Free Starter ($0)', badge: 'Basic 1 Proj', color: 'from-gray-600 to-slate-700' },
    { id: 'premium', name: 'Premium ($25/s)', badge: 'Unlimit + Starter + Biz', color: 'from-blue-600 to-indigo-600' },
    { id: 'enterprise', name: 'Enterprise ($65/s)', badge: 'Full Gov & ERP + 14d Trial', color: 'from-purple-600 to-fuchsia-600' },
  ]

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-purple-500/30 bg-gradient-to-br from-gray-900/90 via-slate-900/90 to-purple-950/40 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 hover:border-purple-500/60 hover:shadow-purple-500/10 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none transform translate-x-12 -translate-y-12" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md font-bold text-base">
            🧪
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Subscription & Feature Gating Test Switcher</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Sprint 29 Engine
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Instantly toggle tiers or simulate 14-day Enterprise trial lifecycle to verify gate locks.
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-300">Active Mode:</span>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow ${
              isTrialing
                ? 'bg-amber-500 text-gray-950 animate-pulse'
                : tier === 'enterprise'
                ? 'bg-purple-600 text-white'
                : tier === 'premium'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200'
            }`}
          >
            {tier} {isTrialing ? `(Trial: ${daysRemaining}d left)` : isExpired ? '(Expired -> Free)' : ''}
          </span>
        </div>
      </div>

      <hr className="border-white/10 my-3" />

      {/* Interactive controls: hover-revealed action buttons as per development guidelines */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-300">Select Target Plan for Current Workspace:</span>
          <span className="text-[11px] text-gray-500 italic">
            {!isHovered ? '✨ Hover over card to reveal live test actions' : '⚡ Live testing controls unlocked'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tiers.map((t) => {
            const isSelected = tier === t.id && !isExpired
            return (
              <div
                key={t.id}
                className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? 'bg-white/10 border-indigo-500/60 shadow-inner'
                    : 'bg-black/20 border-white/5 hover:bg-black/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <strong className="text-sm text-white font-extrabold">{t.name}</strong>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                  <span className="text-[11px] text-indigo-300 font-medium block">{t.badge}</span>
                </div>

                {/* Hover-revealed button */}
                <button
                  disabled={updating || isSelected}
                  onClick={() => handleSwitch(t.id)}
                  style={{ cursor: isSelected ? 'default' : 'pointer' }}
                  className={`mt-3 w-full py-1.5 px-3 text-xs font-bold rounded-lg transition-all duration-300 transform ${
                    isHovered || isSelected
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-40 sm:opacity-0 translate-y-1'
                  } ${
                    isSelected
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                      : `bg-gradient-to-r ${t.color} text-white shadow hover:scale-[1.02] active:scale-95`
                  }`}
                >
                  {updating ? 'Switching...' : isSelected ? 'Active Plan' : `Switch to ${t.id.toUpperCase()}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Simulation Actions Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
          <span className="text-xs text-gray-400">
            <strong>Lifecycle Simulation:</strong> Check automatic fallback when the 14-day trial period terminates.
          </span>

          <button
            disabled={updating}
            onClick={() => handleSwitch('free', true)}
            style={{ cursor: 'pointer' }}
            className={`w-full sm:w-auto px-4 py-1.5 text-xs font-extrabold text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-xl shadow hover:bg-amber-900/80 hover:text-white transition-all duration-300 active:scale-95 transform ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-80 scale-[0.98]'
            }`}
          >
            ⏰ Simulate 14-Day Trial Expiry ➔ Downgrade to Free
          </button>
        </div>
      </div>
    </div>
  )
}
export const SubscriptionTester = ManualPlanSwitcher
