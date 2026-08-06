import { getPromotions } from '@/lib/backoffice/promos-actions'
import { getStaffSession } from '@/lib/backoffice/auth'
import { PromosClient } from './PromosClient'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Promos & Coupons | Backoffice',
}

export default async function PromosPage() {
  const staff = await getStaffSession()
  if (!staff) redirect('/login')

  const promotions = await getPromotions()

  const activeCount = promotions.filter(p => p.is_active).length
  const totalRedemptions = promotions.reduce((acc, curr) => acc + (curr.current_uses || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-app-fg">Promos & Coupons</h1>
        <p className="text-sm text-app-muted mt-1">Manage marketing campaigns and exclusive organizational discounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-app-surface border border-app-border rounded-xl">
          <p className="text-sm font-medium text-app-muted">Active Campaigns</p>
          <p className="text-3xl font-bold text-app-fg mt-1">{activeCount}</p>
        </div>
        <div className="p-4 bg-app-surface border border-app-border rounded-xl">
          <p className="text-sm font-medium text-app-muted">Total Redemptions</p>
          <p className="text-3xl font-bold text-app-fg mt-1">{totalRedemptions}</p>
        </div>
        <div className="p-4 bg-app-surface border border-app-border rounded-xl">
          <p className="text-sm font-medium text-app-muted">Total Campaigns</p>
          <p className="text-3xl font-bold text-app-fg mt-1">{promotions.length}</p>
        </div>
      </div>

      <PromosClient initialPromotions={promotions} isSuperadmin={staff.role === 'superadmin'} />
    </div>
  )
}
