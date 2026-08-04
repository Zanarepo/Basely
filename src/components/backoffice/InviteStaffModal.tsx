'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { InviteStaffPanel } from './InviteStaffPanel'

export function InviteStaffModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Invite Staff
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors z-10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <InviteStaffPanel />
          </div>
        </div>
      )}
    </>
  )
}
