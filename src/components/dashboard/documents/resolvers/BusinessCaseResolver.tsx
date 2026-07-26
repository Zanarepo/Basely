'use client'

import { useEffect, useState } from 'react'
import { BusinessCase } from '@/lib/initiation/actions'
import { createClient } from '@/utils/supabase/client'

interface BusinessCaseResolverProps {
  entityId: string
  field: 'problem_statement' | 'proposed_solution' | 'financials' | 'recommendation'
}

export default function BusinessCaseResolver({ entityId, field }: BusinessCaseResolverProps) {
  const [data, setData] = useState<BusinessCase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: bc } = await supabase
        .from('business_cases')
        .select('*')
        .eq('id', entityId)
        .single()
      setData(bc)
      setLoading(false)
    }
    load()
  }, [entityId])

  if (loading) {
    return <div className="animate-pulse h-4 bg-app-border rounded w-3/4"></div>
  }

  if (!data) {
    return <p className="text-app-muted italic">Business Case data not found.</p>
  }

  if (field === 'problem_statement') {
    return <p className="whitespace-pre-wrap">{data.problem_statement || 'No problem statement provided.'}</p>
  }

  if (field === 'proposed_solution') {
    return <p className="whitespace-pre-wrap">{data.proposed_solution || 'No proposed solution provided.'}</p>
  }

  if (field === 'financials') {
    return (
      <div className="space-y-2">
        <p><strong>Estimated Cost:</strong> {data.estimated_cost ? `$${data.estimated_cost.toLocaleString()}` : 'Not provided'}</p>
        <p><strong>Estimated Benefit / ROI:</strong> {data.estimated_benefit || 'Not provided'}</p>
      </div>
    )
  }

  if (field === 'recommendation') {
    return <p className="whitespace-pre-wrap">{data.recommendation || 'No recommendation provided.'}</p>
  }

  return null
}
