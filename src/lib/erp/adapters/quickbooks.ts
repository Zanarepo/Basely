import { ErpAdapter, ExternalAccount, ExternalTransaction, AuthStatus } from './types'

const SAMPLE_ACCOUNTS: ExternalAccount[] = [
  { id: 'acc_6000', code: '6000', name: 'Subcontractor & Specialist Labor', category: 'Project Services', type: 'Cost of Goods Sold' },
  { id: 'acc_6100', code: '6100', name: 'Cloud Compute & AWS Infrastructure', category: 'Hosting & Server Costs', type: 'Cost of Goods Sold' },
  { id: 'acc_6200', code: '6200', name: 'Specialized Engineering CAD Licenses', category: 'Software & Tools', type: 'Expense' },
  { id: 'acc_6300', code: '6300', name: 'Hardware Prototyping & Materials', category: 'Materials', type: 'Cost of Goods Sold' },
  { id: 'acc_6400', code: '6400', name: 'Client On-Site Deployment Travel', category: 'Travel & Accommodations', type: 'Expense' },
  { id: 'acc_6500', code: '6500', name: 'Unbudgeted Legal & Regulatory Fees', category: 'Professional Services', type: 'Other Expense' },
  { id: 'acc_6600', code: '6600', name: 'Site Safety Inspection & Audits', category: 'Compliance', type: 'Expense' }
]

const GENERATED_TRANSACTIONS: ExternalTransaction[] = [
  {
    id: 'QBO-TXN-10001',
    accountId: 'acc_6000',
    accountName: 'Subcontractor & Specialist Labor',
    amount: 14500.00,
    currency: 'USD',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    description: 'Q3 contract engineering support & cloud infrastructure audit',
    vendor: 'Apex DevOps LLC',
    projectTag: 'Basely Core'
  },
  {
    id: 'QBO-TXN-10002',
    accountId: 'acc_6100',
    accountName: 'Cloud Compute & AWS Infrastructure',
    amount: 4320.50,
    currency: 'USD',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    description: 'Monthly dedicated database clustering & AI compute reserved instances',
    vendor: 'Amazon Web Services',
    projectTag: 'Basely Core'
  },
  {
    id: 'QBO-TXN-10003',
    accountId: 'acc_6200',
    accountName: 'Specialized Engineering CAD Licenses',
    amount: 2800.00,
    currency: 'USD',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    description: 'Annual enterprise seats for simulation engine & BIM modeler',
    vendor: 'Autodesk Enterprise',
    projectTag: 'Basely Core'
  },
  {
    id: 'QBO-TXN-10004',
    accountId: 'acc_6300',
    accountName: 'Hardware Prototyping & Materials',
    amount: 6150.75,
    currency: 'USD',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    description: 'Edge server diagnostic rigs and sensor interface arrays',
    vendor: 'DigiKey Industrial',
    projectTag: 'Basely Core'
  },
  {
    id: 'QBO-TXN-10005',
    accountId: 'acc_6400',
    accountName: 'Client On-Site Deployment Travel',
    amount: 1850.00,
    currency: 'USD',
    date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    description: 'Field engineer flight and accommodation for user signoff',
    vendor: 'Delta Enterprise Travel',
    projectTag: 'Basely Core'
  },
  {
    id: 'QBO-TXN-10006',
    accountId: 'acc_6500',
    accountName: 'Unbudgeted Legal & Regulatory Fees',
    amount: 3200.00,
    currency: 'USD',
    date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    description: 'Cross-border compliance assessment & tax compliance review',
    vendor: 'Ernst & Young Advisory',
    projectTag: 'Basely Core'
  },
  {
    id: 'QBO-TXN-10007',
    accountId: 'acc_6600',
    accountName: 'Site Safety Inspection & Audits',
    amount: 1250.00,
    currency: 'USD',
    date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    description: 'Quarterly industrial safety review and ISO 27001 workplace audit',
    vendor: 'Bureau Veritas Group',
    projectTag: 'Basely Core'
  }
]

export const QuickBooksAdapter: ErpAdapter = {
  id: 'quickbooks',
  name: 'QuickBooks Online',
  
  async authenticate(config: Record<string, unknown>): Promise<AuthStatus> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const isLiveMode = Boolean(config?.liveMode)
    const realmId = (config?.realmId as string) || (config?.tenantId as string) || process.env.QBO_REALM_ID || ''
    const token = (config?.token as string) || process.env.QBO_ACCESS_TOKEN || ''
    const companyName = (config?.companyName as string) || 'Acme Project Controls Inc. (QBO)'
    const isSandbox = realmId.startsWith('93') || realmId.startsWith('46')
    const baseUrl = isSandbox ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}` : `https://quickbooks.api.intuit.com/v3/company/${realmId}`

    if (isLiveMode) {
      if (!realmId || !token) {
        return {
          connected: false,
          accountId: realmId || 'Missing',
          error: 'QuickBooks Live Mode requires both a valid Realm ID and OAuth Access Token.'
        }
      }

      try {
        const response = await fetch(`${baseUrl}/companyinfo/${realmId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          return {
            connected: false,
            accountId: realmId,
            error: `QuickBooks Live API Authentication Failed (HTTP ${response.status}): Invalid Realm ID or expired Token. ${errorText ? errorText.slice(0, 80) : ''}`
          }
        }

        const data = await response.json().catch(() => ({}))
        const verifiedName = data?.CompanyInfo?.CompanyName || data?.CompanyInfo?.LegalName || 'Verified Intuit Sandbox'

        return {
          connected: true,
          accountId: `${realmId} [LIVE INTUIT ${isSandbox ? 'SANDBOX' : 'PROD'} API]`,
          accountName: `${verifiedName} (Verified over Intuit Cloud)`,
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network failure contacting Intuit developer API'
        return {
          connected: false,
          accountId: realmId,
          error: `Intuit API connection error: ${msg}. Switch to Simulated Test Mode if offline.`
        }
      }
    }
    
    return {
      connected: true,
      accountId: `${realmId || '9130353457198270'} [SIMULATED DEMO]`,
      accountName: `${companyName} [Built-in Test Engine]`,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
    }
  },

  async getChartOfAccounts(config: Record<string, unknown>): Promise<ExternalAccount[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const isLiveMode = Boolean(config?.liveMode)
    const realmId = (config?.realmId as string) || (config?.tenantId as string) || process.env.QBO_REALM_ID || ''
    const token = (config?.token as string) || process.env.QBO_ACCESS_TOKEN || ''

    if (isLiveMode) {
      if (!token || !realmId) {
        throw new Error('QuickBooks Live API Error: Missing Realm ID or Access Token.')
      }
      const isSandbox = realmId.startsWith('93') || realmId.startsWith('46')
      const baseUrl = isSandbox ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}` : `https://quickbooks.api.intuit.com/v3/company/${realmId}`
      const query = encodeURIComponent("SELECT * FROM Account WHERE AccountType IN ('Expense', 'Cost of Goods Sold', 'Other Expense')")
      
      const res = await fetch(`${baseUrl}/query?query=${query}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      })

      if (!res.ok) {
        throw new Error(`QuickBooks Live API Error: Failed to fetch accounts (HTTP ${res.status}). Verify your Realm ID (${realmId}) and token.`)
      }

      const data = await res.json()
      if (data?.QueryResponse?.Account && Array.isArray(data.QueryResponse.Account)) {
        return data.QueryResponse.Account.map((acc: { Id: string; AcctNum?: string; Name?: string; AccountType?: string; Classification?: string }) => ({
          id: `qbo_live_${acc.Id}`,
          code: acc.AcctNum || acc.Id,
          name: `${acc.Name || 'QuickBooks Account'} (Live QBO)`,
          category: acc.Classification || 'Expense Category',
          type: acc.AccountType || 'Expense'
        }))
      }
      return []
    }

    return SAMPLE_ACCOUNTS
  },

  async fetchTransactions(
    config: Record<string, unknown>,
    options?: { startDate?: string; endDate?: string; backfill?: boolean }
  ): Promise<ExternalTransaction[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const isLiveMode = Boolean(config?.liveMode)
    const realmId = (config?.realmId as string) || (config?.tenantId as string) || process.env.QBO_REALM_ID || ''
    const token = (config?.token as string) || process.env.QBO_ACCESS_TOKEN || ''

    if (isLiveMode) {
      if (!token || !realmId) {
        throw new Error('QuickBooks Live API Error: Cannot sync transactions without a valid Realm ID and token.')
      }
      const isSandbox = realmId.startsWith('93') || realmId.startsWith('46')
      const baseUrl = isSandbox ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}` : `https://quickbooks.api.intuit.com/v3/company/${realmId}`
      const query = encodeURIComponent("SELECT * FROM Purchase WHERE TxnDate >= '2025-01-01'")
      
      const res = await fetch(`${baseUrl}/query?query=${query}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      })

      if (!res.ok) {
        throw new Error(`QuickBooks Sync Failed: Intuit API returned HTTP ${res.status}. Your Realm ID or OAuth Token is invalid/expired.`)
      }

      const data = await res.json()
      if (data?.QueryResponse?.Purchase && Array.isArray(data.QueryResponse.Purchase)) {
        return data.QueryResponse.Purchase.map((pur: { Id: string; AccountRef?: { value?: string }; TotalAmt?: number; TxnDate?: string; PrivateNote?: string; EntityRef?: { name?: string } }) => ({
          id: `QBO-LIVE-${pur.Id}`,
          accountId: `qbo_live_${pur.AccountRef?.value || 'acc_6000'}`,
          accountName: 'QuickBooks Live Purchase Invoice',
          amount: Number(pur.TotalAmt || 0),
          currency: 'USD',
          date: pur.TxnDate ? new Date(pur.TxnDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          description: pur.PrivateNote || `Live Intuit Sandbox Invoice #${pur.Id}`,
          vendor: pur.EntityRef?.name || 'Live QBO Vendor',
          projectTag: 'Basely Core'
        }))
      }
      return []
    }

    // If startDate is passed without backfill, we filter by date
    if (options?.startDate && !options.backfill) {
      return GENERATED_TRANSACTIONS.filter(t => t.date >= (options.startDate as string))
    }
    
    return GENERATED_TRANSACTIONS
  }
}
