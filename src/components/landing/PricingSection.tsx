'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { calculatePppPrice, formatCurrency, RegionalPricing } from '@/lib/pricing/ppp-engine'

type Tier = {
  id: string
  name: string
  price_per_seat: number
  billing_model: string
}

export function PricingSection({ initialTiers = [] }: { initialTiers?: Tier[] }) {
  const [countryCode, setCountryCode] = useState('US')
  const [dynamicRegion, setDynamicRegion] = useState<RegionalPricing | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  // Extract prices from the DB, fallback to defaults if not found
  const freeTier = initialTiers.find(t => t.id === 'free')
  const premiumTier = initialTiers.find(t => t.id === 'premium')
  const enterpriseTier = initialTiers.find(t => t.id === 'enterprise' && t.billing_model === 'flat_rate')

  const freePrice = freeTier ? Number(freeTier.price_per_seat) : 0
  const premiumPrice = premiumTier ? Number(premiumTier.price_per_seat) : 49
  const enterprisePrice = enterpriseTier ? Number(enterpriseTier.price_per_seat) : 199

  useEffect(() => {
    const initPricing = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        
        // Fetch location
        const res = await fetch('/api/location')
        const locData = await res.json()
        const code = locData.countryCode || 'US'
        setCountryCode(code)

        // Fetch regional discount config for this country
        const { data: regionData } = await supabase
          .from('regional_discounts')
          .select('*')
          .eq('country_code', code)
          .single()
        
        if (regionData) {
          setDynamicRegion({
            countryCode: regionData.country_code,
            currency: regionData.currency as any,
            discountMultiplier: Number(regionData.discount_multiplier),
            exchangeRateToUsd: Number(regionData.exchange_rate_to_usd)
          })
        }
      } catch (err) {
        console.error('Error fetching pricing data:', err)
      } finally {
        setMounted(true)
      }
    }
    initPricing()
  }, [])

  const getPriceDisplay = (usdPrice: number) => {
    if (!mounted) return { text: `$${usdPrice}`, discount: 0 }
    
    if (usdPrice === 0) {
       const currency = dynamicRegion ? dynamicRegion.currency : 'USD'
       return { text: formatCurrency(0, currency as any), discount: 0 }
    }
    
    const info = calculatePppPrice(usdPrice, countryCode, dynamicRegion)
    return {
      text: formatCurrency(info.finalAmount, info.currency as any),
      discount: info.discountPercentage
    }
  }

  const freeDisplay = getPriceDisplay(freePrice)
  const premiumDisplay = getPriceDisplay(premiumPrice)
  const enterpriseDisplay = getPriceDisplay(enterprisePrice)

  return (
    <section className="px-6 py-24 bg-[#000000]" id="pricing">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14 animate-fade-in-up">
          <p className="font-mono text-[10px] text-violet-400/50 mb-3 tracking-widest">PRICING</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-white">Tired of paying per seat?</h2>
          <p className="text-slate-400 text-[15px]">Bring your whole team. One flat monthly rate. Professional project controls for everyone.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="landing-card animate-fade-in-up">
            <p className="font-mono text-[10px] text-slate-600 mb-2 tracking-widest">{freeTier?.name?.toUpperCase() || 'FREE'}</p>
            <p className="text-4xl font-semibold mb-1 text-white">{freeDisplay.text}</p>
            <p className="text-[12px] text-slate-600 mb-8">up to 3 users</p>
            <ul className="text-[13px] text-slate-500 space-y-3 mb-10">
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>3 active projects</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>WBS + CPM schedule</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>Basic task management</span></li>
            </ul>
            <a href="/login" className="landing-btn-secondary w-full py-2.5 text-center block">Start free</a>
          </div>

          {/* Premium Tier */}
          <div className="animate-fade-in-up relative" style={{ animationDelay: '0.1s', padding: '1px', borderRadius: '12px', background: 'linear-gradient(to bottom, rgba(124,58,237,0.4), rgba(79,70,229,0.2), rgba(255,255,255,0.06))' }}>
          <div className="landing-card h-full" style={{ borderColor: 'transparent' }}>
            <div className="absolute -top-3 left-6">
              <span className="text-[10px] font-mono px-3 py-1 rounded-full font-semibold text-white" style={{ background: 'linear-gradient(to right, #7c3aed, #4f46e5)' }}>Agency favorite</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 mb-2 tracking-widest">{premiumTier?.name?.toUpperCase() || 'PREMIUM'}</p>
            <div className="mb-1">
              <p className="text-4xl font-semibold text-white">{premiumDisplay.text}<span className="text-base text-slate-600 font-normal">/month</span></p>
              {premiumDisplay.discount > 0 && (
                <span className="inline-block mt-2 bg-white/[0.06] text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-white/[0.08]">
                  {premiumDisplay.discount}% Regional Discount applied!
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 font-medium mb-8">unlimited users & guests</p>
            <ul className="text-[13px] text-slate-500 space-y-3 mb-10">
              <li className="flex gap-2 text-white"><span className="text-white/50">✓</span> <span>Unlimited projects</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>Budget + EVM engine</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>RACI + risk register</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>Advanced reporting</span></li>
            </ul>
            <a href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl w-full py-2.5 text-center text-sm font-semibold text-white cursor-pointer transition-all hover:opacity-90" style={{ background: 'linear-gradient(to right, #7c3aed, #4f46e5)', boxShadow: '0 4px 14px rgba(109,40,217,0.25)' }}>Start free trial</a>
          </div>
          </div>

          {/* Enterprise Tier */}
          <div className="landing-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="font-mono text-[10px] text-slate-600 mb-2 tracking-widest">{enterpriseTier?.name?.toUpperCase() || 'ENTERPRISE'}</p>
            <div className="mb-1">
              <p className="text-4xl font-semibold text-white">{enterpriseDisplay.text}<span className="text-base text-slate-600 font-normal">/month</span></p>
              {enterpriseDisplay.discount > 0 && (
                <span className="inline-block mt-2 bg-white/[0.06] text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-white/[0.08]">
                  {enterpriseDisplay.discount}% Regional Discount applied!
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-600 mb-8">for scaling PMOs</p>
            <ul className="text-[13px] text-slate-500 space-y-3 mb-10">
              <li className="flex gap-2 text-white"><span className="text-white/50">✓</span> <span>Everything in Premium</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>SSO + approval workflows</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>Audit log + custom templates</span></li>
              <li className="flex gap-2"><span className="text-white/50">✓</span> <span>API + ERP integrations</span></li>
            </ul>
            <a href="mailto:sales@baseline.com" className="landing-btn-secondary w-full py-2.5 text-center block">Talk to sales</a>
          </div>
        </div>
      </div>
    </section>
  )
}
