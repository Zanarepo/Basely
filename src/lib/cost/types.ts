export type EstimationMethod = 'analogous' | 'parametric' | 'bottom_up';

export interface CostAccount {
  id: string;
  wbs_element_id: string;
  estimation_method: EstimationMethod;
  budgeted_total: number;
  rate: number | null;
  quantity: number | null;
  analogous_reference_note: string | null;
  currency: string;
  reconciliation_status: 'pending' | 'reconciled';
  resource_calculated_total: number;
  created_at: string;
  updated_at: string;
}

export type ResourceType = 'labor' | 'material' | 'fixed';
export type ResourceUnit = 'hr' | 'day' | 'unit' | 'flat';

export interface ResourceRate {
  id: string;
  project_id: string;
  name: string;
  type: ResourceType;
  rate: number;
  unit: ResourceUnit;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityResourceAssignment {
  id: string;
  wbs_element_id: string;
  resource_rate_id: string;
  quantity: number;
  calculated_cost: number;
  created_at: string;
  updated_at: string;
  // joined data
  resource?: ResourceRate;
}

export interface TimePhaseEntry {
  id: string;
  cost_account_id: string;
  period_start_date: string;
  period_end_date: string;
  planned_amount: number;
  created_at: string;
}

export interface BudgetBaseline {
  id: string;
  project_id: string;
  name: string;
  saved_at: string;
  created_by: string | null;
}

export interface BaselineCostSnapshot {
  id: string;
  baseline_id: string;
  wbs_element_id: string;
  snapshotted_wbs_name: string;
  snapshotted_parent_id: string | null;
  baseline_total: number;
  exchange_rate_at_snapshot: number;
  baseline_time_phase: any[]; // JSONB
}

// Re-export from standalone actuals module for WbsCostData compatibility
export type { ActualCost, ActualCostSource } from '@/lib/actuals/types'
import type { ActualCost } from '@/lib/actuals/types'

// Helper types for the UI
export interface WbsCostData {
  wbsId: string;
  wbsName: string;
  wbsCode: string;
  parentId: string | null;
  isWorkPackage: boolean;
  costAccount: CostAccount | null;
  timePhaseEntries: TimePhaseEntry[];
  resourceAssignments: ActivityResourceAssignment[];
  actualCosts: ActualCost[];
}

