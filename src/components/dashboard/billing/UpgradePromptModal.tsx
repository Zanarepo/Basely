'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { TierId } from '@/lib/organizations/tier-logic'
import { calculatePppPrice, formatCurrency } from '@/lib/pricing/ppp-engine'
import { createCheckoutSessionAction } from '@/lib/organizations/subscription-actions'

interface UpgradePromptModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: TierId
  organizationId: string
  onSelectTier: (tier: TierId) => Promise<any> | void
  reason?: string
  featureOrLimitName?: string
}

const TIER_CARDS = [
  {
    id: 'free' as TierId,
    name: 'Free Starter',
    basePrice: 0,
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
    basePrice: 25,
    cycle: 'per seat / month',
    description: 'Complete delivery mechanics, collaboration, and product tracking.',
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
    basePrice: 65,
    cycle: 'per seat / month',
    description: 'Ultimate security, compliance signoffs, SSO, and deep ERP integration.',
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
  organizationId,
  onSelectTier,
  reason,
  featureOrLimitName,
}) => {
  const [loadingTier, setLoadingTier] = useState<TierId | null>(null)
  const [countryCode, setCountryCode] = useState('US')
  const [isLoadingPricing, setIsLoadingPricing] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      fetch('/api/location')
        .then(res => res.json())
        .then(data => {
          if (data.countryCode) {
            setCountryCode(data.countryCode)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingPricing(false))
    }

    // Handle bfcache (back button from checkout)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoadingTier(null)
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleSelect = async (tier: TierId) => {
    setLoadingTier(tier)
    try {
      if (tier === 'free') {
        await onSelectTier(tier)
      } else {
        const basePrice = TIER_CARDS.find(c => c.id === tier)?.basePrice || 0
        const priceInfo = calculatePppPrice(basePrice, countryCode)
        
        const res = await createCheckoutSessionAction(
          organizationId,
          tier,
          priceInfo.finalAmount,
          priceInfo.currency,
          true // Always default to autoRenew true for modal upgrades
        )
        
        if (res.ok && res.url) {
          window.location.href = res.url
          setTimeout(() => setLoadingTier(null), 1000)
        } else {
          alert(`Checkout Failed: ${res.error || 'Unknown error'}`)
          setLoadingTier(null)
        }
      }
    } catch (e) {
      setLoadingTier(null)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-gray-500/20 dark:bg-black/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-gray-900/95 border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8 text-center border-b border-gray-200 dark:border-white/10 bg-white dark:bg-app-bg relative">
          <button
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors text-lg font-bold"
          >
            ✕
          </button>

          <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white mb-3">
            Unlock Advanced Features
          </span>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Choose the Perfect Plan for Your Team
          </h2>
          
          {reason && (
            <div className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-300 text-sm font-semibold max-w-lg mx-auto">
              🚨 {reason} {featureOrLimitName ? `— ${featureOrLimitName}` : ''}
            </div>
          )}
          
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Upgrade instantly to unblock limits, access enterprise governance workflows, and turbocharge your delivery pipeline.
          </p>
        </div>

        {/* Plan Cards Matrix */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {TIER_CARDS.map((card) => {
            const isCurrent = card.id === currentTier
            const isLoading = loadingTier === card.id
            
            const priceInfo = card.basePrice !== undefined 
              ? calculatePppPrice(card.basePrice, countryCode)
              : null

            return (
              <div
                key={card.id}
                className={`flex flex-col justify-between rounded-xl p-6 border ${
                  card.popular
                    ? 'bg-white dark:bg-gray-800 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {card.badge}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent">
                        CURRENT PLAN
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{card.name}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 h-10">{card.description}</p>

                  <div className="mt-4 my-6 flex flex-col justify-center min-h-[4rem]">
                    {card.id === 'free' ? (
                       <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(0, priceInfo?.currency || 'USD')}</span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">/ forever</span>
                       </div>
                    ) : isLoadingPricing ? (
                       <span className="text-sm text-gray-400 animate-pulse">Calculating...</span>
                    ) : (
                       <div>
                         <div className="flex items-baseline gap-1">
                           <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(priceInfo!.finalAmount, priceInfo!.currency)}</span>
                           <span className="text-xs font-medium text-gray-500 dark:text-gray-400">/ {card.cycle}</span>
                         </div>
                         {priceInfo!.discountPercentage > 0 && (
                           <span className="inline-block mt-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                             {priceInfo!.discountPercentage}% Regional Discount
                           </span>
                         )}
                       </div>
                    )}
                  </div>

                  <hr className="border-gray-200 dark:border-white/10 my-4" />

                  <ul className="space-y-2.5 text-xs text-gray-300">
                    {card.features.map((ft, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-indigo-600 dark:text-indigo-400 mt-0.5 text-xs">✓</span>
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
                    className={`w-full py-2.5 px-4 rounded-md font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-200 dark:border-white/5'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : card.id === 'enterprise' ? (
                      'Start Free Trial / Switch'
                    ) : (
                      `Switch to ${card.name.split(' ')[0]}`
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 dark:bg-black/40 border-t border-gray-200 dark:border-white/10 text-center text-xs text-gray-500">
          🔒 Secure live instant billing activation. You can change or test tiers at any time without data loss.
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
export const TierUpgradeDialog = UpgradePromptModal
