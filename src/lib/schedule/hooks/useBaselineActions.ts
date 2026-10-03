import { saveBaseline, deleteBaseline, renameBaseline } from '@/lib/schedule/actions/baselines'
import type { HudMessage } from './useScheduleData'

type BaselineActionsDeps = {
  projectId: string
  selectedBaselineId: string
  setSelectedBaselineId: (id: string) => void
  setLoading: (v: boolean) => void
  showHud: (text: string, type: NonNullable<HudMessage>['type'], autoHideMs?: number) => void
  fetchData: (showHud?: boolean) => Promise<void>
}

/**
 * Provides baseline create, delete, and rename handlers.
 */
export function useBaselineActions({
  projectId,
  selectedBaselineId,
  setSelectedBaselineId,
  setLoading,
  showHud,
  fetchData,
}: BaselineActionsDeps) {

  const handleCreateBaseline = async () => {
    const name = prompt('Enter a name for this baseline (e.g. Kickoff Baseline):')
    if (!name || !name.trim()) return

    setLoading(true)
    try {
      const res = await saveBaseline(projectId, name.trim())
      if (!res.ok) throw new Error(res.error)
      await fetchData()
      // @ts-ignore
      if (res.pendingApproval) {
        showHud('Approval request submitted and is pending admin review.', 'info', 5000)
      } else {
        showHud('Baseline saved successfully!', 'success', 5000)
      }
    } catch (err: any) {
      showHud(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBaseline = async (baselineId: string) => {
    if (!confirm('Are you sure you want to delete this baseline?')) return

    setLoading(true)
    try {
      const res = await deleteBaseline(projectId, baselineId)
      if (!res.ok) throw new Error(res.error)

      showHud('Baseline deleted', 'success')
      if (selectedBaselineId === baselineId) {
        setSelectedBaselineId('')
      }
      await fetchData()
    } catch (err: any) {
      showHud(err.message, 'error')
      setLoading(false)
    }
  }

  const handleRenameBaseline = async (baselineId: string, currentName: string) => {
    const newName = prompt('Enter a new name for this baseline:', currentName)
    if (!newName || !newName.trim() || newName.trim() === currentName) return

    setLoading(true)
    try {
      const res = await renameBaseline(projectId, baselineId, newName.trim())
      if (!res.ok) throw new Error(res.error)

      showHud('Baseline renamed', 'success')
      await fetchData()
    } catch (err: any) {
      showHud(err.message, 'error')
      setLoading(false)
    }
  }

  return {
    handleCreateBaseline,
    handleDeleteBaseline,
    handleRenameBaseline,
  }
}
