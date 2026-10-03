'use client'

import { Search } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface AdrFilterToolbarProps {
  search: string
  setSearch: (val: string) => void
  domainFilter: string
  setDomainFilter: (val: string) => void
  statusFilter: string
  setStatusFilter: (val: string) => void
}

export function AdrFilterToolbar({
  search, setSearch, domainFilter, setDomainFilter, statusFilter, setStatusFilter
}: AdrFilterToolbarProps) {
  return (
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-app-surface/60 border border-app-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search records by title, context, or decision..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-app-input border border-app-border text-app-fg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <EnterpriseSelect
              value={domainFilter}
              onChange={(val) => setDomainFilter(val)}
              options={[
                { value: 'all', label: 'All Domains', description: 'Show decisions across all technical sectors' },
                { value: 'backend', label: 'Backend & Services', description: 'Server architecture & microservices' },
                { value: 'frontend', label: 'Frontend & UI/UX', description: 'React & user interfaces' },
                { value: 'database', label: 'Database & Storage', description: 'PostgreSQL & data models' },
                { value: 'infrastructure', label: 'DevOps & Infra', description: 'Cloud deployment pipelines' },
                { value: 'security', label: 'Security & Auth', description: 'SSO, RLS & encryption' },
                { value: 'ai_data', label: 'Praz-AI & Data Pipelines', description: 'LLMs & analytics telemetry' }
              ]}
            />
          </div>

          <div className="w-40">
            <EnterpriseSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Statuses', description: 'Show all lifecycle states' },
                { value: 'accepted', label: 'Accepted Only', description: 'Active governing engineering standards' },
                { value: 'proposed', label: 'Proposed Only', description: 'Under active architectural review' },
                { value: 'superseded', label: 'Superseded Only', description: 'Replaced legacy records' },
                { value: 'deprecated', label: 'Deprecated Only', description: 'Retired patterns' },
                { value: 'rejected', label: 'Rejected Only', description: 'Declined approaches' }
              ]}
            />
          </div>
        </div>
      </div>
  )
}
