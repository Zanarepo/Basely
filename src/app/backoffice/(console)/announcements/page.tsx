import { getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { AnnouncementsClient } from '@/components/backoffice/AnnouncementsClient'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsDirectory() {
  const staff = await getStaffSession()
  if (!staff) return null

  if (staff.role !== 'superadmin' && staff.role !== 'support_senior') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-black text-app-fg tracking-tight mb-2">Access Denied</h2>
        <p className="text-app-muted">You do not have permission to manage global system announcements.</p>
      </div>
    )
  }

  const supabase = createAdminClient()

  const { data: announcements } = await supabase
    .from('system_announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-app-fg tracking-tight">System Announcements</h1>
          <p className="text-sm text-app-muted mt-1">Manage global in-app alerts and maintenance banners.</p>
        </div>
      </div>

      <AnnouncementsClient initialAnnouncements={announcements || []} />
    </div>
  )
}
