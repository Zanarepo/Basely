import { useState } from 'react'
import { generateOkrsFromStrategy, generateOkrsFromProject } from '@/lib/documents/ai-chain-actions'

export function useGenerateOkrs(
  organizationId: string, 
  projectId: string, 
  onSuccess: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (source: 'strategy' | 'project' = 'strategy') => {
    setIsGenerating(true)
    showToast(`Praz-AI is analyzing ${source === 'strategy' ? 'Strategy Canvas' : 'Project Documents'} to generate OKRs...`, 'info')
    
    try {
      const { ok, error } = source === 'strategy' 
        ? await generateOkrsFromStrategy(projectId, organizationId)
        : await generateOkrsFromProject(projectId, organizationId)
      
      if (ok) {
        showToast(`${source === 'strategy' ? 'Strategic' : 'Project'} OKRs successfully generated!`, 'success')
        onSuccess()
      } else {
        showToast(error || 'Failed to generate OKRs', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, handleGenerate }
}
