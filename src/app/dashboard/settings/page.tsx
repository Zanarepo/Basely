import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { NotificationPreferences } from '@/components/dashboard/notifications/NotificationPreferences'
import { Settings as SettingsIcon } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app-surface">
      <div className="sticky top-0 z-20 flex-shrink-0">
        <header className="flex h-14 items-center justify-between border-b border-app-border bg-app-surface-solid/95 px-6 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-app-muted" />
            <h1 className="text-lg font-semibold text-app-fg tracking-tight">Settings</h1>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-app-fg mb-4">Account Settings</h2>
            <div className="bg-app-surface border border-app-border rounded-xl p-6">
              <p className="text-sm text-app-subtle">
                Logged in as: <span className="font-medium text-app-fg">{userData.user.email}</span>
              </p>
            </div>
          </section>

          <section id="notifications">
            <h2 className="text-xl font-bold text-app-fg mb-4">Notifications</h2>
            <NotificationPreferences />
          </section>
        </div>
      </div>
    </div>
  )
}
