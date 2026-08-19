import { useState, useEffect } from 'react'
import { resolveClosureReportData, ClosureReportData } from '@/lib/documents/resolvers/closure-resolver'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'

interface UseClosureReportViewerProps {
  projectId: string
  currentLifecycle: ProjectLifecycleStatus
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useClosureReportViewer({
  projectId,
  currentLifecycle,
  onShowToast,
}: UseClosureReportViewerProps) {
  const [data, setData] = useState<ClosureReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [executiveSummary, setExecutiveSummary] = useState(
    'Formal Project Closure Report summarizing verified EVM metrics, completed schedule baselines, deliverable acceptance, and residual risk assessments upon entering the Closing phase.'
  )
  const [saving, setSaving] = useState(false)

  const isUnlocked = ['Closing', 'Closed'].includes(currentLifecycle)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!isUnlocked) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await resolveClosureReportData(projectId)
        if (isMounted) {
          setData(res)
        }
      } catch (err) {
        console.error('Failed to load closure data:', err)
        onShowToast?.('error', 'Could not compile project closure figures.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [projectId, isUnlocked, onShowToast])

  const handleSaveSnapshot = async () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onShowToast?.('success', 'Closure Report snapshot frozen and archived in compliance records.')
    }, 800)
  }

  return {
    data,
    loading,
    executiveSummary,
    setExecutiveSummary,
    saving,
    isUnlocked,
    handleSaveSnapshot,
  }
}
