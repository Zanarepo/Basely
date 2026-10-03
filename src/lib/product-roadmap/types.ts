import { Horizon } from './constants'

export interface RoadmapOkr {
  id: string
  title: string
}

export interface RoadmapItem {
  id: string
  project_id: string
  title: string
  description: string | null
  horizon: Horizon
  theme: string | null
  moscow_status: string | null
  rice_score: number | null
  primary_okr_id: string | null
  okr?: RoadmapOkr
  wbs_element_id?: string | null
  
  // Custom UI fields calculated on the frontend or joined
  hasPrd?: boolean
  hasSolutionDesign?: boolean
  hasWbs?: boolean
  wbsProgressPercent?: number
}
