'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import type { TierId } from '@/lib/organizations/tier-logic'
import { calculatePppPrice, formatCurrency } from '@/lib/pricing/ppp-engine'
import { useManualPlanSwitcher } from './hooks/useManualPlanSwitcher'

interface BillingDashboardProps {
  organizationId: string
  onPlanChanged?: () => void
  children?: React.ReactNode
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  organizationId,
  onPlanChanged,
  children,
}) => {
  const {
    tier,
    isTrialing,
    isExpired,
    daysRemaining,
    updating,
    isOpen,
    setIsOpen,
    isHovered,
    setIsHovered,
    isAutoRenew,
    handleSetAutoRenew,
    countryCode,
    isLoadingPricing,
    isCheckoutLoading,
    basePrices,
    dynamicRegion,
    promoInput,
    setPromoInput,
    appliedPromo,
    isVerifyingPromo,
    handleApplyPromo,
    handleRemovePromo,
    handleCheckout,
  } = useManualPlanSwitcher({ organizationId, onPlanChanged })

  const tiers: { id: TierId; name: string; badge: string; color: string }[] = [
    { id: 'free', name: 'Free Starter', badge: 'Basic 1 Proj', color: 'from-gray-600 to-slate-700' },
    { id: 'premium', name: 'Premium', badge: 'Unlimited + Starter + Biz', color: 'from-blue-600 to-violet-600' },
    { id: 'enterprise', name: 'Enterprise', badge: 'Full Gov & ERP', color: 'from-purple-600 to-fuchsia-600' },
  ]

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-app-bg max-w-4xl mx-auto shadow-sm overflow-hidden transition-all duration-200"
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-lg shrink-0">
            💳
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Billing & Subscription</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your workspace subscription and view localized pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status indicator badge */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 p-2 rounded-xl border border-gray-200 dark:border-white/10">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 hidden sm:inline">Current Plan:</span>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                isTrialing
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                  : tier === 'enterprise'
                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30'
                  : tier === 'premium'
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {tier} {isTrialing ? `(Trial: ${daysRemaining}d left)` : (isExpired && tier !== 'free') ? '(Expired)' : ''}
            </span>
          </div>

          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-6 pt-4 border-t border-gray-200 dark:border-white/10">
          {children}

          {/* Billing Options Toggle */}
          <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-xl p-4 mb-6 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Billing Frequency</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose how you'd like to pay for your subscription.</p>
            </div>
            <div className="flex bg-gray-200/50 dark:bg-black/50 p-1 rounded-lg border border-gray-200 dark:border-white/10">
              <button 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSetAutoRenew(true)}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${isAutoRenew ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Auto-Renew Monthly
              </button>
              <button 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSetAutoRenew(false)}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${!isAutoRenew ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Manual 1-Month
              </button>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-xl p-4 mb-6 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Promo Code</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Have a discount code? Apply it here.</p>
            </div>
            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={!!appliedPromo?.valid}
                  placeholder="e.g. SUMMER50"
                  className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-48"
                />
                {appliedPromo?.valid ? (
                  <button
                    onClick={handleRemovePromo}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoInput.trim() || isVerifyingPromo}
                    className="px-3 py-1.5 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingPromo ? '...' : 'Apply'}
                  </button>
                )}
              </div>
              {appliedPromo && (
                <div className={`text-xs font-bold ${appliedPromo.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {appliedPromo.valid ? (
                    <>✓ Promo Applied: {appliedPromo.promo?.discount_type === 'percentage' ? `${appliedPromo.promo?.discount_value}%` : `$${appliedPromo.promo?.discount_value}`} OFF</>
                  ) : (
                    <>✕ {appliedPromo.message}</>
                  )}
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-white/10 my-4 relative z-10" />

          {/* Interactive controls: hover-revealed action buttons */}
          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((t) => {
                const isCurrentPlan = tier === t.id
                const isActivePlan = isCurrentPlan && (!isExpired || t.id === 'free')
                
                // Calculate localized price
                const baseInfo = calculatePppPrice(basePrices[t.id], countryCode, dynamicRegion)
                
                // Apply Promo if valid
                let finalPrice = baseInfo.finalAmount
                if (appliedPromo?.valid && appliedPromo.promo) {
                  if (appliedPromo.promo.discount_type === 'percentage') {
                    finalPrice = Math.max(0, finalPrice * (1 - appliedPromo.promo.discount_value / 100))
                  } else {
                    finalPrice = Math.max(0, finalPrice - appliedPromo.promo.discount_value)
                  }
                }

                return (
                  <div
                    key={t.id}
                    className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      isActivePlan
                        ? 'bg-white dark:bg-gray-800 border-violet-500 ring-1 ring-violet-500 shadow-sm'
                        : isCurrentPlan
                        ? 'bg-white dark:bg-gray-800 border-amber-500 ring-1 ring-amber-500 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <strong className="text-base text-gray-900 dark:text-white font-extrabold">{t.name}</strong>
                        {isActivePlan && <span className="text-sm text-violet-600 dark:text-violet-400 font-bold">✓ Active</span>}
                        {isCurrentPlan && !isActivePlan && <span className="text-sm text-amber-600 dark:text-amber-400 font-bold">⚠ Expired</span>}
                      </div>
                      
                      {/* Pricing Display */}
                      <div className="mb-3">
                        {t.id === 'free' ? (
                          <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(0, baseInfo.currency)}<span className="text-xs text-gray-500 dark:text-gray-400 font-normal">/month</span></span>
                        ) : isLoadingPricing ? (
                          <span className="text-sm text-gray-400 animate-pulse">Calculating local price...</span>
                        ) : (
                          <div>
                            {appliedPromo?.valid ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 line-through">
                                  {formatCurrency(baseInfo.finalAmount, baseInfo.currency)}
                                </span>
                                <div className="flex items-end gap-1">
                                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(finalPrice, baseInfo.currency)}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mb-1">/month</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-end gap-1">
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(finalPrice, baseInfo.currency)}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mb-1">/month</span>
                              </div>
                            )}
                            {baseInfo.discountPercentage > 0 && (
                              <div className="mt-1">
                                <span className="inline-block bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                                  {baseInfo.discountPercentage}% Regional Discount applied!
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-xs text-violet-600 dark:text-violet-400 font-medium block">{t.badge}</span>
                      
                      {/* Hover-revealed button */}
                      <button
                        disabled={updating || isActivePlan || isCheckoutLoading !== null}
                        onClick={() => handleCheckout(t.id)}
                        style={{ cursor: isActivePlan ? 'default' : 'pointer' }}
                        className={`mt-6 w-full py-2.5 px-4 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                          isHovered || isActivePlan || isCurrentPlan || isCheckoutLoading === t.id
                            ? 'opacity-100'
                            : 'opacity-100 sm:opacity-0'
                        } ${
                          isActivePlan
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-200 dark:border-white/5'
                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                        }`}
                      >
                        {isCheckoutLoading === t.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </>
                        ) : updating ? (
                          'Processing...'
                        ) : isActivePlan ? (
                          'Current Plan'
                        ) : isCurrentPlan && !isActivePlan ? (
                          'Renew Plan'
                        ) : t.id === 'free' ? (
                          'Downgrade to Free'
                        ) : (
                          `Checkout ${t.name.toUpperCase()}`
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Map the old component name to the new one so we don't break existing imports right away
export const ManualPlanSwitcher = BillingDashboard
export const SubscriptionTester = BillingDashboard
