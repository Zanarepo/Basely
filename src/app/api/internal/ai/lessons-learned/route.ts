import { NextResponse } from 'next/server'
import { synthesizeLessonsLearned, proposeStrategyUpdates } from '@/lib/documents/ai-chain-actions'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  try {
    const { action, projectId, releaseId, rawNotes, lessonsLearnedId, proposedRisks, proposedMoats } = await req.json()

    if (!projectId) {
      return NextResponse.json({ ok: false, error: 'projectId is required' }, { status: 400 })
    }

    if (action === 'synthesize') {
      if (!rawNotes) return NextResponse.json({ ok: false, error: 'rawNotes is required' }, { status: 400 })
      
      const result = await synthesizeLessonsLearned(projectId, releaseId || null, rawNotes)
      return NextResponse.json(result)
    } 
    if (action === 'save_draft') {
      if (!rawNotes) return NextResponse.json({ ok: false, error: 'rawNotes is required' }, { status: 400 })
      
      const adminSupabase = createAdminClient()
      
      let lessonId = lessonsLearnedId
      if (!lessonId || lessonId === 'temp') {
         let query = adminSupabase
           .from('product_lessons_learned')
           .select('id')
           .eq('project_id', projectId)
           
         if (releaseId) {
           query = query.eq('release_id', releaseId)
         } else {
           query = query.is('release_id', null)
         }
           
         const { data: existing } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()
         
         if (existing) lessonId = existing.id
      }
      
      if (lessonId && lessonId !== 'temp') {
        await adminSupabase.from('product_lessons_learned').update({
          raw_notes: rawNotes,
          updated_at: new Date().toISOString()
        }).eq('id', lessonId)
      } else {
        const { data: inserted } = await adminSupabase.from('product_lessons_learned').insert({
          project_id: projectId,
          release_id: releaseId || null,
          raw_notes: rawNotes,
        }).select('id').single()
        lessonId = inserted?.id
      }
      return NextResponse.json({ ok: true, id: lessonId })
    }

    if (action === 'propose_strategy_updates') {
      if (!lessonsLearnedId) return NextResponse.json({ ok: false, error: 'lessonsLearnedId is required' }, { status: 400 })
      
      const result = await proposeStrategyUpdates(projectId, lessonsLearnedId)
      return NextResponse.json(result)
    }
    
    if (action === 'accept_strategy_updates') {
       if (!lessonsLearnedId) return NextResponse.json({ ok: false, error: 'lessonsLearnedId is required' }, { status: 400 })
       
       const adminSupabase = createAdminClient()
       
       // Get current strategy
       const { data: strategy } = await adminSupabase
          .from('product_strategies')
          .select('id, strategic_risks, execution_moats')
          .eq('project_id', projectId)
          .single()
          
       if (!strategy) return NextResponse.json({ ok: false, error: 'Strategy not found' })
       
       const newRisks = [...(strategy.strategic_risks || []), ...(proposedRisks || [])]
       const newMoats = [...(strategy.execution_moats || []), ...(proposedMoats || [])]
       
       await adminSupabase.from('product_strategies').update({
         strategic_risks: newRisks,
         execution_moats: newMoats
       }).eq('id', strategy.id)
       
       await adminSupabase.from('product_lessons_learned').update({
         status: 'strategy_updated'
       }).eq('id', lessonsLearnedId)
       
       return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('[LessonsLearned API Error]:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
