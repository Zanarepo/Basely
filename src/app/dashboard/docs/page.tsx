import React from 'react'
import { DocumentationCenter } from '@/components/dashboard/docs/DocumentationCenter'

export const metadata = {
  title: 'Documentation | Prazaner'
}

export default function DocsPage() {
  return (
    <div className="flex-1 h-[calc(100vh-4rem)] md:h-screen overflow-y-auto bg-app-bg pt-16 md:pt-0">
      <DocumentationCenter />
    </div>
  )
}
