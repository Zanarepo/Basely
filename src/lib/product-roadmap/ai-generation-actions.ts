'use server'

import { draftSolutionDesignFromRoadmap } from '@/lib/documents/chain-modules/solution'
import { generateBacklogFromPrdAndRoadmap } from '@/lib/wbs/wbs-ai-actions'

export async function generatePrdFromRoadmapItem(projectId: string, itemId: string) {
  try {
    console.log('[generatePrdFromRoadmapItem] START CALLED WITH:', { projectId, itemId })
    const res = await draftSolutionDesignFromRoadmap(projectId, undefined, itemId)
    
    console.log('[generatePrdFromRoadmapItem] RESULT:', res)
    if (!res.ok) {
      return { success: false, error: res.error }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('[generatePrdFromRoadmapItem] FAILED TO GENERATE PRD:', error)
    return { success: false, error: error.message || 'Failed to generate PRD' }
  }
}

export async function generateWbsFromPrd(projectId: string, itemId: string) {
  try {
    console.log('[generateWbsFromPrd] START CALLED WITH:', { projectId, itemId })
    const res = await generateBacklogFromPrdAndRoadmap(projectId, 'dummy_org')
    console.log('[generateWbsFromPrd] RESULT:', res)
    return { success: res.success, error: res.error }
  } catch (error: any) {
    console.error('generateWbsFromPrd error:', error)
    return { success: false, error: error.message || 'Failed to auto-generate WBS' }
  }
}
