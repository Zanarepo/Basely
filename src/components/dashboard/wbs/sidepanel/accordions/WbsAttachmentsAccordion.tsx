import { useState } from 'react'
import { Paperclip, ChevronDown, ChevronRight } from 'lucide-react'
import { AttachmentList } from '@/components/dashboard/collaboration/attachments/AttachmentList'
import { AttachmentPicker } from '@/components/dashboard/collaboration/attachments/AttachmentPicker'

import { AttachmentSourceType } from '@/lib/collaboration/attachment-actions'

type WbsAttachmentsAccordionProps = {
  attachments: any[]
  isAttachmentsLoading: boolean
  hasEditAccess: boolean
  callerRole?: string
  callerUserId?: string
  handleAddAttachment: (
    fileName: string,
    sourceType: AttachmentSourceType,
    externalRef?: string,
    externalUrl?: string,
    mimeType?: string,
    filePath?: string,
    fileSize?: number
  ) => Promise<void>
  handleDeleteAttachment: (id: string) => Promise<void>
}

export function WbsAttachmentsAccordion({
  attachments,
  isAttachmentsLoading,
  hasEditAccess,
  callerRole,
  callerUserId,
  handleAddAttachment,
  handleDeleteAttachment,
}: WbsAttachmentsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-app-border rounded-xl bg-app-surface">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors ${
          isOpen ? 'rounded-t-xl' : 'rounded-xl'
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
          <Paperclip className="w-4 h-4 text-app-muted" />
          Attachments ({attachments.length})
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-app-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-app-muted" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-app-border bg-app-surface-solid rounded-b-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-app-fg">Files</h4>
            {hasEditAccess && (
              <AttachmentPicker onAttach={handleAddAttachment} />
            )}
          </div>
          <AttachmentList
            attachments={attachments}
            isLoading={isAttachmentsLoading}
            onDelete={handleDeleteAttachment}
            currentUserIsAdmin={callerRole === 'owner' || callerRole === 'admin'}
            currentUserId={callerUserId}
          />
        </div>
      )}
    </div>
  )
}
