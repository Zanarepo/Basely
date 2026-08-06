'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, Info, AlertOctagon } from 'lucide-react'

export type Announcement = {
  id: string
  message: string
  type: 'info' | 'warning' | 'critical'
  link_url?: string
}

export function GlobalBanner({ announcement }: { announcement: Announcement | null }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!announcement) {
      setIsVisible(false)
      return
    }
    
    // Check if the user has already dismissed THIS specific announcement
    const dismissedId = localStorage.getItem('basely_dismissed_announcement')
    if (dismissedId !== announcement.id) {
      setIsVisible(true)
    }
  }, [announcement])

  if (!announcement || !isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('basely_dismissed_announcement', announcement.id)
  }

  // Color config based on type
  const config = {
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: <Info className="w-4 h-4 shrink-0" />
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      icon: <AlertOctagon className="w-4 h-4 shrink-0" />
    }
  }

  const currentConfig = config[announcement.type] || config.info

  return (
    <div className={`w-full ${currentConfig.bg} border-b ${currentConfig.border} px-4 py-2.5 flex items-center justify-center relative animate-in slide-in-from-top-4 fade-in duration-300 z-50`}>
      <div className={`flex items-center gap-3 ${currentConfig.text} text-sm font-medium`}>
        {currentConfig.icon}
        <span className="flex-1 text-center sm:text-left">
          {announcement.message}
          {announcement.link_url && (
            <a 
              href={announcement.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Read more
            </a>
          )}
        </span>
      </div>
      <button 
        onClick={handleDismiss}
        className={`absolute right-4 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors ${currentConfig.text}`}
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
