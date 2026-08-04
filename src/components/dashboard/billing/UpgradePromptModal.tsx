'use client'

import React, { useState } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'

interface UpgradePromptModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: TierId
  onSelectTier: (tier: TierId) => Promise<any> | void
  reason?: string
  featureOrLimitName?: string
}

const TIER_CARDS = [
  {
    id: 'free' as TierId,
    name: 'Free Starter',
    price: '$0',
    cycle: 'forever',
    description: 'Essential planning for individuals and small teams starting out.',
    color: 'from-gray-500 to-slate-600',
    badge: 'Core Basic',
    features: [
      '1 Active Project',
      '3 Edit-level Seat Allotment',
      'Core Workspaces & Organization',
      'WBS & Basic Gantt Schedule',
      'Community Support',
    ],
  },
  {
    id: 'premium' as TierId,
    name: 'Premium Professional',
    price: '$25',
    cycle: 'per seat / month',
    description: 'Complete delivery mechanics, collaboration, and product tracking.',
    color: 'from-blue-600 to-indigo-600',
    badge: 'Most Popular ⭐',
    popular: true,
    features: [
      'Unlimited Active Projects',
      'Unlimited Seat Allotments',
      'Earned Value Management (EVM) & Rates',
      'Actual Cost Logging & CSV Import',
      'RACI Matrices & Risk Register',
      'Live Document Engine & Status Reports',
      'Realtime Comments & Notifications',
      'Product Roadmaps, GTM & Backlog OKRs',
      'ADR, Skills & RAID Register',
      'Release Plans & Gate Signoffs',
    ],
  },
  {
    id: 'enterprise' as TierId,
    name: 'Enterprise Governance',
    price: '$65',
    cycle: 'per seat / month',
    description: 'Ultimate security, compliance signoffs, SSO, and deep ERP integration.',
    color: 'from-purple-600 to-fuchsia-600',
    badge: 'Enterprise ⚡',
    features: [
      'Everything in Premium, plus:',
      '14-Day Free Enterprise Trial',
      'Granular RBAC & Custom Roles',
      'Formal Approval Workflows',
      'Compliance Audit Logs',
      'SSO & Identity Provider Config',
      'REST API Keys & Outward Webhooks',
      'ERP Data Sync & Connectors (QuickBooks/NetSuite)',
      'Dedicated Priority Account Manager',
    ],
  },
]

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
  reason,
  featureOrLimitName,
}) => {
  const [loadingTier, setLoadingTier] = useState<TierId | null>(null)
  const [hoveredCard, setHoveredCard] = useState<TierId | null>(null)

  if (!isOpen) return null

  const handleSelect = async (tier: TierId) => {
    setLoadingTier(tier)
    try {
      await onSelectTier(tier)
    } finally {
      setLoadingTier(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-gray-900/95 border border-white/10 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8 text-center border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent relative">
          <button
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-lg font-bold"
          >
            ✕
          </button>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 mb-3">
            Unlock Advanced Power
          </span>
          
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose the Perfect Plan for Your Team
          </h2>
          
          {reason && (
            <div className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold max-w-lg mx-auto">
              🚨 {reason} {featureOrLimitName ? `— ${featureOrLimitName}` : ''}
            </div>
          )}
          
          <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
            Upgrade instantly to unblock limits, access enterprise governance workflows, and turbocharge your delivery pipeline.
          </p>
        </div>

        {/* Plan Cards Matrix */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {TIER_CARDS.map((card) => {
            const isCurrent = card.id === currentTier
            const isCardHovered = hoveredCard === card.id
            const isLoading = loadingTier === card.id

            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative flex flex-col justify-between rounded-xl p-6 border transition-all duration-300 transform ${
                  card.popular
                    ? 'bg-gradient-to-b from-indigo-900/40 to-gray-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                    : 'bg-gray-800/50 border-white/10 hover:border-white/30'
                } ${isCardHovered ? 'scale-[1.02] shadow-2xl' : 'scale-100'}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {card.badge}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                        CURRENT PLAN
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white">{card.name}</h3>
                  <p className="mt-1 text-xs text-gray-400 h-10">{card.description}</p>

                  <div className="mt-4 my-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{card.price}</span>
                    <span className="text-xs font-medium text-gray-400">/ {card.cycle}</span>
                  </div>

                  <hr className="border-white/10 my-4" />

                  <ul className="space-y-2.5 text-xs text-gray-300">
                    {card.features.map((ft, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <span>{ft}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    disabled={isCurrent || isLoading}
                    onClick={() => handleSelect(card.id)}
                    style={{ cursor: isCurrent ? 'default' : 'pointer' }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-md ${
                      isCurrent
                        ? 'bg-gray-700 text-gray-400 opacity-80 cursor-not-allowed'
                        : `bg-gradient-to-r ${card.color} text-white hover:opacity-90 hover:shadow-lg active:scale-95 transform`
                    } ${
                      /* Hover treatment: slightly brighter and raised when hovering card */
                      !isCurrent && isCardHovered ? 'ring-2 ring-white/30 shadow-xl' : ''
                    }`}
                  >
                    {isLoading
                      ? 'Updating...'
                      : isCurrent
                      ? 'Current Active Plan'
                      : card.id === 'enterprise'
                      ? 'Start 14-Day Free Trial / Switch'
                      : `Switch to ${card.name.split(' ')[0]}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-black/40 border-t border-white/10 text-center text-xs text-gray-500">
          🔒 Secure live instant billing activation. You can change or test tiers at any time without data loss.
        </div>
      </div>
    </div>
  )
}
export const TierUpgradeDialog = UpgradePromptModal
