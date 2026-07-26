'use client'

import { ApiKeysPanel } from '@/components/dashboard/settings/developers/ApiKeysPanel'
import { WebhooksPanel } from '@/components/dashboard/settings/developers/WebhooksPanel'

export default function DevelopersSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      <div>
        <h1 className="text-2xl font-bold text-app-fg tracking-tight">Developers & Integrations</h1>
        <p className="text-app-muted mt-2 max-w-2xl">
          Manage API keys and Webhooks to integrate your organization's data with external tools and ERP systems. 
          Need help? <a href="/dashboard/settings/developers/api-docs" className="text-indigo-500 hover:underline">View the API Documentation &rarr;</a>
        </p>
      </div>

      <div className="space-y-6">
        <ApiKeysPanel />
        <WebhooksPanel />
      </div>
    </div>
  )
}
