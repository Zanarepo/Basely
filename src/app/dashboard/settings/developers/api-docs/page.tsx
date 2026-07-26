import React from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Key, Globe, ShieldAlert } from 'lucide-react'

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 pb-20">
      <div>
        <Link href="/dashboard/settings/developers" className="flex items-center gap-2 text-sm text-indigo-500 hover:underline mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Developers
        </Link>
        <h1 className="text-3xl font-bold text-app-fg tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-500" /> API Documentation
        </h1>
        <p className="text-app-muted mt-3 text-lg leading-relaxed">
          The public REST API and Webhook system allows you to build custom integrations against the platform. Read and write data securely using scoped API keys.
        </p>
      </div>

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-app-fg border-b border-app-border pb-2 flex items-center gap-2">
          <Key className="w-6 h-6 text-app-muted" /> Authentication
        </h2>
        <p className="text-app-muted">
          All API requests must be authenticated using an API Key. Generate an API Key from the Developers settings panel.
        </p>
        <div className="bg-app-bg border border-app-border rounded-lg p-4 font-mono text-sm">
          <p className="text-emerald-500 mb-2"># Include the API key in the Authorization header</p>
          <span className="text-indigo-400">Authorization:</span> Bearer base_live_your_api_key_here
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="text-sm">Never expose your API keys in client-side code (like browsers or mobile apps). Only use them from secure backend environments.</p>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-app-fg border-b border-app-border pb-2">Endpoints</h2>
        
        {/* GET Projects */}
        <div className="bg-app-surface-solid border border-app-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 font-bold text-xs rounded uppercase tracking-wider">GET</span>
            <code className="text-app-fg font-mono text-sm font-semibold">/api/v1/projects</code>
          </div>
          <p className="text-sm text-app-muted">Lists all projects your organization has access to.</p>
        </div>

        {/* GET WBS */}
        <div className="bg-app-surface-solid border border-app-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 font-bold text-xs rounded uppercase tracking-wider">GET</span>
            <code className="text-app-fg font-mono text-sm font-semibold">/api/v1/projects/:projectId/wbs</code>
          </div>
          <p className="text-sm text-app-muted">Retrieves the Work Breakdown Structure (WBS) elements for a specific project.</p>
        </div>

        {/* GET Activities */}
        <div className="bg-app-surface-solid border border-app-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 font-bold text-xs rounded uppercase tracking-wider">GET</span>
            <code className="text-app-fg font-mono text-sm font-semibold">/api/v1/projects/:projectId/activities</code>
          </div>
          <p className="text-sm text-app-muted">Fetches schedule activities and tasks for a project.</p>
        </div>

        {/* POST Actual Costs */}
        <div className="bg-app-surface-solid border border-app-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 font-bold text-xs rounded uppercase tracking-wider">POST</span>
            <code className="text-app-fg font-mono text-sm font-semibold">/api/v1/projects/:projectId/actual-costs</code>
          </div>
          <p className="text-sm text-app-muted">Ingests an actual cost record (requires <code className="bg-app-bg px-1 py-0.5 rounded border border-app-border">read_write</code> scope).</p>
          <div className="bg-app-bg border border-app-border rounded-lg p-4 font-mono text-sm mt-2 overflow-x-auto">
            {`{
  "activity_id": "uuid",
  "amount": 1500.50,
  "date": "2026-07-25",
  "description": "Invoice #12345"
}`}
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-app-fg border-b border-app-border pb-2 flex items-center gap-2">
          <Globe className="w-6 h-6 text-app-muted" /> Webhooks
        </h2>
        <p className="text-app-muted">
          Webhooks allow your application to receive real-time HTTP POST requests when events occur on the platform.
        </p>
        <h3 className="font-bold text-app-fg mt-6">Payload Signature (HMAC)</h3>
        <p className="text-sm text-app-muted mb-2">
          We sign all webhook payloads so you can verify they originated from us. The signature is included in the <code>X-Webhook-Signature</code> header.
        </p>
        <div className="bg-app-bg border border-app-border rounded-lg p-4 font-mono text-sm">
          <span className="text-indigo-400">X-Webhook-Signature:</span> sha256=d3a2b4...
        </div>
        <p className="text-sm text-app-muted mt-2">
          To verify, compute the SHA-256 HMAC of the raw request body using your webhook's signing secret as the key, and compare it to the signature in the header.
        </p>

        <h3 className="font-bold text-app-fg mt-6">Example Payload</h3>
        <div className="bg-app-bg border border-app-border rounded-lg p-4 font-mono text-sm mt-2 overflow-x-auto">
          {`{
  "event": "risk_change",
  "timestamp": "2026-07-25T14:30:00Z",
  "data": {
    "reference_entity_type": "risk",
    "reference_entity_id": "e45...a12",
    "project_id": "c12...f89",
    "content_summary": "Risk 'Supply Chain Delay' status changed to Critical"
  }
}`}
        </div>
      </section>
      
      {/* Rate Limits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-app-fg border-b border-app-border pb-2">Rate Limiting</h2>
        <p className="text-app-muted">
          We rate limit API requests to ensure stability. The limit is <strong>100 requests per minute</strong> per API Key.
        </p>
        <p className="text-sm text-app-muted">
          When the limit is reached, a <code>429 Too Many Requests</code> status code is returned.
        </p>
      </section>
    </div>
  )
}
