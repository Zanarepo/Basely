import { ErpAdapter, ExternalAccount, ExternalTransaction, AuthStatus } from './types'

const SAP_SAMPLE_ACCOUNTS: ExternalAccount[] = [
  { id: 'sap_acct_4001', code: '4001', name: 'WBS Internal Order: Specialist Civil Subcontractor', category: 'Cost Center Operations', type: 'Cost of Goods Sold' },
  { id: 'sap_acct_4002', code: '4002', name: 'S/4HANA Enterprise Cloud Computing & Database Cluster', category: 'IT & Infrastructure', type: 'Cost of Goods Sold' },
  { id: 'sap_acct_4003', code: '4003', name: 'Industrial BIM Design & Simulation Suite Software', category: 'Software Licenses', type: 'Expense' },
  { id: 'sap_acct_4004', code: '4004', name: 'Plant Equipment Leasing & Structural Prototyping', category: 'Hardware Materials', type: 'Cost of Goods Sold' },
  { id: 'sap_acct_4005', code: '4005', name: 'Global Executive Deployment & On-Site Inspection Travel', category: 'Travel & Accommodations', type: 'Expense' },
  { id: 'sap_acct_4006', code: '4006', name: 'Unbudgeted Emergency Environmental Site Audit Fees', category: 'Regulatory Compliance', type: 'Other Expense' }
]

const SAP_GENERATED_TXNS: ExternalTransaction[] = [
  {
    id: 'SAP-ORD-9001',
    accountId: 'sap_acct_4001',
    accountName: 'WBS Internal Order: Specialist Civil Subcontractor',
    amount: 22500.00,
    currency: 'USD',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    description: 'SAP Internal Order #9001: Heavy structural concrete and rebar excavation milestone',
    vendor: 'Apex DevOps LLC',
    projectTag: 'Basely Core'
  },
  {
    id: 'SAP-ORD-9002',
    accountId: 'sap_acct_4002',
    accountName: 'S/4HANA Enterprise Cloud Computing & Database Cluster',
    amount: 6800.00,
    currency: 'USD',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    description: 'Dedicated OData gateway servers and analytics SAP S/4HANA memory clustering',
    vendor: 'Amazon Web Services',
    projectTag: 'Basely Core'
  },
  {
    id: 'SAP-ORD-9003',
    accountId: 'sap_acct_4004',
    accountName: 'Plant Equipment Leasing & Structural Prototyping',
    amount: 8950.50,
    currency: 'USD',
    date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    description: 'Specialized industrial sensor rigs and structural load testing telemetry arrays',
    vendor: 'DigiKey Industrial',
    projectTag: 'Basely Core'
  },
  {
    id: 'SAP-ORD-9004',
    accountId: 'sap_acct_4006',
    accountName: 'Unbudgeted Emergency Environmental Site Audit Fees',
    amount: 5500.00,
    currency: 'USD',
    date: new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0],
    description: 'Mandatory soil sample auditing and industrial acoustic emissions inspection',
    vendor: 'Bureau Veritas Group',
    projectTag: 'Basely Core'
  }
]

export const SapAdapter: ErpAdapter = {
  id: 'sap',
  name: 'SAP S/4HANA Financials',
  
  async authenticate(config: Record<string, unknown>): Promise<AuthStatus> {
    await new Promise(resolve => setTimeout(resolve, 650))
    
    const isLiveMode = Boolean(config?.liveMode)
    const accountId = (config?.clientId as string) || 'SAP-S4H-882190'
    const companyName = (config?.companyName as string) || 'Enterprise AG (SAP S/4HANA)'

    if (isLiveMode && config?.apiEndpoint && (config?.token || config?.clientSecret)) {
      try {
        const endpoint = (config.apiEndpoint as string).replace(/\/$/, '')
        const token = (config.token || config.clientSecret) as string
        const response = await fetch(`${endpoint}/sap/opu/odata/sap/API_GLACCOUNTIN_SRV/GLAccountIn`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          return {
            connected: false,
            accountId,
            error: `SAP OData Live Authentication Failed: HTTP ${response.status} - ${response.statusText}`
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error reaching SAP OData Gateway'
        return {
          connected: false,
          accountId,
          error: `OData Gateway unreachable: ${msg}. Try switching to Simulated Test Mode.`
        }
      }
    }

    return {
      connected: true,
      accountId: isLiveMode ? `${accountId} [LIVE ODATA]` : `${accountId} [SIMULATION]`,
      accountName: companyName,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
    }
  },

  async getChartOfAccounts(config: Record<string, unknown>): Promise<ExternalAccount[]> {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (Boolean(config?.liveMode) && config?.apiEndpoint && (config?.token || config?.clientSecret)) {
      try {
        const endpoint = (config.apiEndpoint as string).replace(/\/$/, '')
        const token = (config.token || config.clientSecret) as string
        const res = await fetch(`${endpoint}/sap/opu/odata/sap/API_GLACCOUNTIN_SRV/GLAccountIn?$format=json`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.d?.results && Array.isArray(data.d.results)) {
            return data.d.results.map((acc: { GLAccount: string; GLAccountName?: string; GLAccountType?: string }) => ({
              id: `sap_${acc.GLAccount}`,
              code: acc.GLAccount,
              name: acc.GLAccountName || 'SAP General Ledger Account',
              category: 'SAP Cost Center',
              type: acc.GLAccountType || 'Expense'
            }))
          }
        }
      } catch {
        // Fall back to simulation on network error
      }
    }

    return SAP_SAMPLE_ACCOUNTS
  },

  async fetchTransactions(
    config: Record<string, unknown>,
    options?: { startDate?: string; endDate?: string; backfill?: boolean }
  ): Promise<ExternalTransaction[]> {
    await new Promise(resolve => setTimeout(resolve, 750))
    
    if (Boolean(config?.liveMode) && config?.apiEndpoint && (config?.token || config?.clientSecret)) {
      try {
        const endpoint = (config.apiEndpoint as string).replace(/\/$/, '')
        const token = (config.token || config.clientSecret) as string
        const res = await fetch(`${endpoint}/sap/opu/odata/sap/API_FINANCIAL_TRANSACTION_SRV/ActualCosts?$format=json`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.d?.results && Array.isArray(data.d.results)) {
            return data.d.results.map((ord: { DocumentReference: string; GLAccount: string; Amount: number; PostingDate: string; DocumentHeaderText?: string; Vendor?: string }) => ({
              id: `SAP-LIVE-${ord.DocumentReference}`,
              accountId: `sap_${ord.GLAccount}`,
              accountName: 'SAP Internal Order Cost',
              amount: Number(ord.Amount || 0),
              currency: 'USD',
              date: ord.PostingDate ? new Date(ord.PostingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              description: ord.DocumentHeaderText || `SAP OData Doc #${ord.DocumentReference}`,
              vendor: ord.Vendor || 'SAP Vendor',
              projectTag: 'Basely Core'
            }))
          }
        }
      } catch {
        // Fall back to simulation on error
      }
    }

    if (options?.startDate && !options.backfill) {
      return SAP_GENERATED_TXNS.filter(t => t.date >= (options.startDate as string))
    }
    return SAP_GENERATED_TXNS
  }
}
