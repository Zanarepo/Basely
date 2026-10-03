'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function FeatureTogglesClient() {
  const [hideErp, setHideErp] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHideErp(localStorage.getItem('PZ_HIDE_ERP_DEV') === 'true')
  }, [])

  const handleToggle = () => {
    const nextState = !hideErp
    setHideErp(nextState)
    localStorage.setItem('PZ_HIDE_ERP_DEV', String(nextState))
    
    // Dispatch a custom event so other client components can react instantly
    window.dispatchEvent(new CustomEvent('pz-feature-toggle', { detail: { key: 'PZ_HIDE_ERP_DEV', value: nextState } }))
  }

  if (!mounted) return null

  return (
    <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-app-fg mb-1">Global Feature Toggles (Local)</h3>
          <p className="text-xs text-app-muted">Toggle visibility of under-construction features for presentation mode.</p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between bg-app-bg p-4 rounded-xl border border-app-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hideErp ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {hideErp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-app-fg">ERP & Developers Features</h4>
            <p className="text-xs text-app-muted mt-0.5">Controls visibility of ERP Connectors and Developers in the sidebar and integrations menu.</p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
            hideErp ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          role="switch"
          aria-checked={hideErp}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              hideErp ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
