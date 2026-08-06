'use client'

import { useState } from 'react'
import { DataDeletionModal } from './DataDeletionModal'

interface Props {
  organizationId: string
  organizationName: string
}

export function DataDeletionButton({ organizationId, organizationName }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer' }}
        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        Wipe Data
      </button>

      {isOpen && (
        <DataDeletionModal
          organizationId={organizationId}
          organizationName={organizationName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
