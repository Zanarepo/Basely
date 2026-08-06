import { createAdminClient } from '@/utils/supabase/admin'
import { ShieldAlert } from 'lucide-react'
import { AbuseFlagCard } from '@/components/backoffice/abuse/AbuseFlagCard'

export const dynamic = 'force-dynamic'

export default async function BackofficeAbusePage() {
  const supabase = await createAdminClient()

  const { data: flags, error } = await supabase
    .from('abuse_flags')
    .select('*, organizations(name)')
    .order('reviewed_at', { ascending: true, nullsFirst: true })
    .order('flagged_at', { ascending: false })

  if (error) {
    return <div>Error loading abuse flags: {error.message}</div>
  }

  const unreviewed = flags?.filter((f: any) => !f.reviewed_at) || []
  const reviewed = flags?.filter((f: any) => f.reviewed_at) || []

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-app-fg">Abuse & Fraud Detection</h1>
          <p className="text-sm font-semibold text-app-muted">Review simulated suspicious activities and enforce policies.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black text-app-fg flex items-center gap-2">
          Action Required
          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreviewed.length}</span>
        </h2>
        
        {unreviewed.length === 0 ? (
          <div className="p-8 text-center bg-app-card border border-app-border border-dashed rounded-2xl text-app-muted font-bold text-sm">
            No pending abuse flags. Everything looks good!
          </div>
        ) : (
          <div className="grid gap-4">
            {unreviewed.map((flag: any) => (
              <AbuseFlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-app-border">
          <h2 className="text-sm font-black text-app-fg">Previously Reviewed</h2>
          <div className="grid gap-4 opacity-75">
            {reviewed.map((flag: any) => (
              <AbuseFlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
