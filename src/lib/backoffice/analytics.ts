import { createAdminClient } from '@/utils/supabase/admin'

export interface CohortStats {
  cohort_month: string
  tier_id: string
  months_since_signup: number
  active_orgs: number
  total_orgs: number
  retention_rate: number
}

export interface ChurnRisk {
  organization_id: string
  score: number
  contributing_signals: {
    feature_depth_score: number
    login_frequency_score: number
    payment_history_score: number
    failed_payments_count: number
    active_projects_count: number
    weighting_model: string
  }
  calculated_at: string
}

export interface ForecastRange {
  bestCaseMRR: number
  expectedMRR: number
  worstCaseMRR: number
  assumptions: {
    historicalChurnRate: number
    bestCaseChurnRate: number
    worstCaseChurnRate: number
    currentMRR: number
  }
}

// 1. Fetch pre-calculated Cohort Retention Stats
export async function getCohortRetentionStats(): Promise<CohortStats[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cohort_retention_stats')
    .select('*')
    .order('cohort_month', { ascending: true })
    .order('months_since_signup', { ascending: true })

  if (error) {
    console.error('Error fetching cohort stats:', error.message)
    return []
  }
  return data as CohortStats[]
}

// 2. Fetch pre-calculated Churn Risk Scores (used for AM views)
export async function getChurnRiskScores(orgIds?: string[]): Promise<ChurnRisk[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('churn_risk_scores')
    .select('*, organizations!inner(is_sandbox)')
    .eq('organizations.is_sandbox', false)
  
  if (orgIds && orgIds.length > 0) {
    query = query.in('organization_id', orgIds)
  }
  
  const { data, error } = await query
  if (error) {
    console.error('Error fetching churn risk scores:', error.message)
    return []
  }
  return data as ChurnRisk[]
}

// 3. Calculate LTV & Forecast dynamically based on billing_history and current subs
export async function getLTVAndForecast(assignedOrgIds: string[] | null): Promise<{ totalLTV: number, forecast: ForecastRange }> {
  const supabase = createAdminClient()

  // For real systems, we'd sum up `amount_paid` across `billing_history`.
  let billingQuery = supabase
    .from('billing_history')
    .select('amount_paid, organization_id, status, organizations!inner(is_sandbox)')
    .eq('organizations.is_sandbox', false)
    
  if (assignedOrgIds !== null) {
    billingQuery = billingQuery.in('organization_id', assignedOrgIds.length ? assignedOrgIds : ['00000000-0000-0000-0000-000000000000'])
  }
  const { data: bills } = await billingQuery
  
  let totalLTV = 0
  bills?.forEach(b => {
    if (b.status === 'paid') totalLTV += Number(b.amount_paid)
  })

  // To forecast MRR, get current active subs and tier prices
  let subQuery = supabase
    .from('organization_subscriptions')
    .select('tier_id, seat_count, status, organizations!inner(is_sandbox)')
    .eq('organizations.is_sandbox', false)
    
  if (assignedOrgIds !== null) {
    subQuery = subQuery.in('organization_id', assignedOrgIds.length ? assignedOrgIds : ['00000000-0000-0000-0000-000000000000'])
  }
  const [{ data: subs }, { data: tiers }] = await Promise.all([
    subQuery,
    supabase.from('subscription_tiers').select('id, price_per_seat')
  ])

  // Map tiers to prices
  const tierPrices: Record<string, number> = {}
  tiers?.forEach(t => { tierPrices[t.id] = Number(t.price_per_seat) })

  let currentMRR = 0
  let totalOrgs = 0
  let churnedOrgs = 0

  subs?.forEach(s => {
    totalOrgs++
    if (s.status === 'canceled' || s.status === 'expired') {
      churnedOrgs++
    }
    // Trialing subscriptions have not yet paid, so they do not count towards actual MRR.
    // We only count 'active' or 'past_due' subscriptions.
    if (s.status === 'active' || s.status === 'past_due') {
      const price = tierPrices[s.tier_id] || 0
      currentMRR += (s.seat_count * price)
    }
  })

  // Historical churn rate
  const historicalChurnRate = totalOrgs > 0 ? (churnedOrgs / totalOrgs) : 0.05 // fallback 5%
  
  // Forecast Assumptions
  const worstCaseChurnRate = Math.min(historicalChurnRate * 1.5, 1.0)
  const bestCaseChurnRate = historicalChurnRate * 0.5
  
  const expectedMRR = currentMRR * (1 - historicalChurnRate)
  const worstCaseMRR = currentMRR * (1 - worstCaseChurnRate)
  const bestCaseMRR = currentMRR * (1 - bestCaseChurnRate)

  return {
    totalLTV,
    forecast: {
      expectedMRR,
      worstCaseMRR,
      bestCaseMRR,
      assumptions: {
        historicalChurnRate,
        bestCaseChurnRate,
        worstCaseChurnRate,
        currentMRR
      }
    }
  }
}
