'use server'

import { createClient } from '@/utils/supabase/server'
import { fetchProjectReleasesData } from './release-actions'

export async function generateAiReleaseNotesAndChecklist(
  releaseId: string,
  projectId: string,
  methodology: string = 'Agile'
): Promise<{
  ok: boolean
  error?: string
  releaseNotesHtml?: string
  checklistItems?: Array<{ category: string; itemText: string }>
}> {
  try {
    const { ok, releases, scopeItemsMap } = await fetchProjectReleasesData(projectId)
    if (!ok || !releases) return { ok: false, error: 'Failed to fetch release details' }

    const release = releases.find(r => r.id === releaseId)
    if (!release) return { ok: false, error: 'Release not found' }

    const scopeItems = scopeItemsMap?.[releaseId] || []
    if (scopeItems.length === 0) {
      return { ok: false, error: 'No scope items found in this release. Link iterations or add scope items first.' }
    }

    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const isAgile = methodology === 'Agile' || methodology === 'Hybrid'
    
    const result = await generateStructuredJson<{
      release_title: string
      executive_summary: string
      features_by_epic: Array<{
        epic_name: string
        user_stories_delivered: string[]
        value_highlight: string
      }>
      operations_checklist: Array<{
        category: 'Database' | 'API & Integration' | 'Security & Auth' | 'Documentation' | 'Quality Assurance'
        item_text: string
      }>
      release_notes_markdown: string
    }>({
      systemPrompt: `You are an expert Product Manager & Release Ops Manager in a dual Product/Project management platform.
Generate a comprehensive Release Notes and Technical Operations Deployment Checklist based on the items in the release scope.

Tailor terminology to ${isAgile ? 'Agile (Release Notes, Epics, User Stories, Features)' : 'Waterfall/Enterprise (Milestone Handover Report, Summary Elements, Work Packages, Deliverables)'}.

Output JSON matching this exact structure:
{
  "release_title": "string",
  "executive_summary": "High-level summary of what this release delivers to customers and business stakeholders.",
  "features_by_epic": [
    {
      "epic_name": "Epic Title",
      "user_stories_delivered": ["Item 1", "Item 2"],
      "value_highlight": "Summary of business/user value"
    }
  ],
  "operations_checklist": [
    {
      "category": "Database",
      "item_text": "Verify schema migration scripts for..."
    }
  ],
  "release_notes_markdown": "Full Markdown release notes ready for customer publishing."
}`,
      userPrompt: `Release Name: ${release.name}
Objective: ${release.objective || 'N/A'}
Scope Items Delivered:
${scopeItems.map(item => `- [${item.entityType.toUpperCase()}] ${item.title} (Epic: ${item.parentEpicName || 'General'})`).join('\n')}`
    })

    const supabase = await createClient()

    // Insert generated readiness checklist items into DB
    if (result.operations_checklist && result.operations_checklist.length > 0) {
      const readinessRows = result.operations_checklist.map(chk => ({
        release_id: releaseId,
        category: chk.category,
        item_text: chk.item_text,
        is_checked: false
      }))

      await supabase.from('release_readiness_items').insert(readinessRows)
    }

    // Save generated release notes to releases table
    if (result.release_notes_markdown) {
      try {
        await supabase
          .from('releases')
          .update({ release_notes: result.release_notes_markdown })
          .eq('id', releaseId)
      } catch (e) {}
    }

    return {
      ok: true,
      releaseNotesHtml: result.release_notes_markdown,
      checklistItems: result.operations_checklist?.map(c => ({ category: c.category, itemText: c.item_text }))
    }

  } catch (err: any) {
    console.error('generateAiReleaseNotesAndChecklist error:', err)
    return { ok: false, error: err.message || 'AI generation failed' }
  }
}
