import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { User } from 'lucide-react'
import { ProfileSettingsPanel } from '@/components/dashboard/ProfileSettingsPanel'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-linear-to-tr from-violet-600 to-indigo-600">
          <User className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-app-fg">Profile Settings</h1>
          <p className="text-sm text-app-muted">Manage your personal information</p>
        </div>
      </div>

      <ProfileSettingsPanel
        currentName={profile?.full_name ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />
    </div>
  )
}
