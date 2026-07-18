import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key')
    
    // Stub authentication
    if (!apiKey || apiKey !== process.env.ACTUALS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing x-api-key header' }, { status: 401 })
    }

    const body = await request.json()

    // Validate payload
    const { wbs_element_id, amount, currency, date, description } = body
    if (!wbs_element_id || amount === undefined || !currency || !date) {
      return NextResponse.json({ 
        error: 'Bad Request: Missing required fields (wbs_element_id, amount, currency, date)' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Enforce valid WBS element
    const { data: wbsElement, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('id')
      .eq('id', wbs_element_id)
      .single()

    if (wbsError || !wbsElement) {
      return NextResponse.json({ error: 'Bad Request: Invalid wbs_element_id' }, { status: 400 })
    }

    // Insert actual cost
    const { data: actualCost, error: insertError } = await supabase
      .from('actual_costs')
      .insert({
        wbs_element_id,
        amount,
        currency,
        date,
        description: description || null,
        source: 'api'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting actual cost via webhook:', insertError)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: actualCost }, { status: 201 })
  } catch (error) {
    console.error('Actuals webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
