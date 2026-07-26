'use client'

import { useEffect, useState } from 'react'
import { FeasibilityStudy } from '@/lib/initiation/actions'
import { createClient } from '@/utils/supabase/client'

interface FeasibilityStudyResolverProps {
  entityId: string
  field: 'technical' | 'financial' | 'operational' | 'recommendation'
}

export default function FeasibilityStudyResolver({ entityId, field }: FeasibilityStudyResolverProps) {
  const [data, setData] = useState<FeasibilityStudy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: fs } = await supabase
        .from('feasibility_studies')
        .select('*')
        .eq('id', entityId)
        .single()
      setData(fs)
      setLoading(false)
    }
    load()
  }, [entityId])

  if (loading) {
    return <div className="animate-pulse h-4 bg-app-border rounded w-3/4"></div>
  }

  if (!data) {
    return <p className="text-app-muted italic">Feasibility Study data not found.</p>
  }

  if (field === 'technical') {
    return <p className="whitespace-pre-wrap">{data.technical_assessment || 'No technical assessment provided.'}</p>
  }

  if (field === 'financial') {
    return <p className="whitespace-pre-wrap">{data.financial_assessment || 'No financial assessment provided.'}</p>
  }

  if (field === 'operational') {
    return <p className="whitespace-pre-wrap">{data.operational_assessment || 'No operational assessment provided.'}</p>
  }

  if (field === 'recommendation') {
    return <p className="whitespace-pre-wrap">{data.overall_recommendation || 'No recommendation provided.'}</p>
  }

  return null
}
