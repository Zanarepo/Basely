'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' }
]

export function CurrencySelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCurrency = searchParams.get('currency') || 'USD'

  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (code: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('currency', code)
    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  const selected = CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0]

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-app-surface-solid border border-app-border rounded-lg text-sm font-bold text-app-fg hover:bg-app-hover transition-colors shadow-sm"
        style={{ cursor: 'pointer' }}
      >
        <span className="text-app-muted">{selected.symbol}</span>
        <span>{selected.code}</span>
        <svg className="w-4 h-4 text-app-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-app-surface-solid border border-app-border rounded-xl shadow-lg z-20 overflow-hidden overflow-y-auto max-h-64">
            {CURRENCIES.map((c) => (
              <button
                type="button"
                key={c.code}
                onClick={() => handleSelect(c.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-app-hover flex items-center justify-between ${currentCurrency === c.code ? 'bg-app-hover/50 font-bold text-app-fg' : 'text-app-muted'}`}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-4 text-center font-bold text-app-subtle">{c.symbol}</span>
                  <span>{c.code}</span>
                </div>
                {currentCurrency === c.code && (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
