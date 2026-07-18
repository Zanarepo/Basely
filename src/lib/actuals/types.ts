export type ActualCostSource = 'manual' | 'import' | 'api';

export interface ActualCost {
  id: string;
  wbs_element_id: string;
  activity_id: string | null;
  resource_rate_id: string | null;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  source: ActualCostSource;
  created_at: string;
  updated_at: string;
}
