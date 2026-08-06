import { getSubscriptionPlanDetails } from '@/lib/backoffice/plans-actions'
import { PlanEditor } from '@/components/backoffice/PlanEditor'
import { ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const { tier, features, limits } = await getSubscriptionPlanDetails(id)

  if (!tier) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/backoffice/plans" className="inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-fg transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-linear-to-tr from-indigo-500 to-purple-500 shadow-sm">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-app-fg tracking-tight capitalize">{tier.name} Plan</h1>
          </div>
          <p className="text-app-muted text-lg max-w-2xl">
            Configure the specific features, price, and usage limits included in this tier.
          </p>
        </div>
      </div>

      <PlanEditor tierId={id} initialTier={tier} features={features} limits={limits} />
    </div>
  )
}
