import { useState } from 'react'
import { generateAiReleaseNotesAndChecklist } from '@/lib/releases/ai-actions'

interface UseReleaseNotesAiGeneratorProps {
  releaseId: string
  projectId: string
  methodology: string
  onGenerated?: () => void
}

export function useReleaseNotesAiGenerator({
  releaseId,
  projectId,
  methodology,
  onGenerated
}: UseReleaseNotesAiGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null)
  const [checklistCount, setChecklistCount] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await generateAiReleaseNotesAndChecklist(releaseId, projectId, methodology)
      if (!res.ok) {
        setError(res.error || 'Failed to generate AI release notes')
        return
      }
      setReleaseNotes(res.releaseNotesHtml || null)
      setChecklistCount(res.checklistItems?.length || 0)
      onGenerated?.()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (releaseNotes) {
      navigator.clipboard.writeText(releaseNotes)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return {
    loading,
    error,
    releaseNotes,
    checklistCount,
    copied,
    handleGenerate,
    handleCopy
  }
}
