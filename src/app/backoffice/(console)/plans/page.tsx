import { getSubscriptionPlans, getBackofficeAuditLogs, getRegionalDiscounts } from '@/lib/backoffice/plans-actions'
import Link from 'next/link'
import { Layers, Edit } from 'lucide-react'
import { AuditLogsTable } from './AuditLogsTable'
import { RegionalDiscountsTable } from './RegionalDiscountsTable'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { Server, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PlansPage(props: { searchParams: Promise<{ page?: string, q?: string, archived?: string }> }) {
  const plans = await getSubscriptionPlans()
  const searchParams = await props.searchParams
  
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 10
  const q = searchParams?.q || ''
  const includeArchived = searchParams?.archived === 'true'

  const { data: logs, count } = await getBackofficeAuditLogs(page, pageSize, q, includeArchived)
  const regionalDiscounts = await getRegionalDiscounts()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-linear-to-tr from-violet-500 to-purple-500 shadow-sm">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-app-fg tracking-tight">Plans & Features</h1>
          </div>
        </div>
      </div>
      <CollapsibleSection
        title="Subscription Plans"
        description="Manage your subscription tiers, limits, and feature gating logic globally."
        icon={<Server className="h-5 w-5" />}
        defaultOpen={false}
      >
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-app-bg rounded-2xl border border-app-border shadow-sm flex flex-col hover:border-violet-500/30 transition-colors">
              <div className="p-6 border-b border-app-border">
                <h2 className="text-2xl font-bold text-app-fg mb-1 capitalize">{plan.name}</h2>
                <p className="text-app-muted text-sm min-h-[40px]">{plan.description}</p>
                
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-black tracking-tight text-app-fg">${plan.price_per_seat}</span>
                  <span className="text-app-subtle mb-1">/ seat / {plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>

              <div className="p-6 flex-1">
                <Link 
                  href={`/backoffice/plans/${plan.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 font-semibold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Configure Features
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <RegionalDiscountsTable discounts={regionalDiscounts} />

      <CollapsibleSection
        title="Audit Logs"
        description="Review all changes made to plans, limits, and pricing by staff."
        icon={<Activity className="h-5 w-5" />}
        defaultOpen={false}
        contentClassName="p-0"
      >
        <AuditLogsTable 
          logs={logs} 
          totalCount={count}
          currentPage={page}
          pageSize={pageSize}
        />
      </CollapsibleSection>
    </div>
  )
}
