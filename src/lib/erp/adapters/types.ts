export interface ExternalAccount {
  id: string
  code: string
  name: string
  category: string
  type: 'Expense' | 'Cost of Goods Sold' | 'Other Expense' | string
}

export interface ExternalTransaction {
  id: string
  accountId: string
  accountName: string
  amount: number
  currency: string
  date: string
  description: string
  vendor?: string
  projectTag?: string
}

export interface AuthStatus {
  connected: boolean
  accountId?: string
  accountName?: string
  expiresAt?: string
  error?: string
}

export interface ErpAdapter {
  id: string
  name: string
  authenticate(config: Record<string, unknown>): Promise<AuthStatus>
  getChartOfAccounts(config: Record<string, unknown>): Promise<ExternalAccount[]>
  fetchTransactions(
    config: Record<string, unknown>, 
    options?: { startDate?: string; endDate?: string; backfill?: boolean }
  ): Promise<ExternalTransaction[]>
}

export interface SyncErrorDetail {
  externalRecordId: string
  accountCode: string
  accountName: string
  amount: number
  date: string
  errorMessage: string
  reason: 'unmapped_account' | 'api_rejection' | 'network_error' | string
}

export interface SyncExecutionResult {
  status: 'success' | 'failure' | 'partial_failure'
  totalRecords: number
  successCount: number
  errorCount: number
  details: SyncErrorDetail[]
  durationMs: number
}
