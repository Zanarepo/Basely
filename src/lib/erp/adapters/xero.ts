import { ErpAdapter, ExternalAccount, ExternalTransaction, AuthStatus } from './types'

const XERO_SAMPLE_ACCOUNTS: ExternalAccount[] = [
  { id: 'xero_acct_310', code: '310', name: 'Contract Engineering & Consulting Services (Xero GL)', category: 'Direct Costs', type: 'Cost of Goods Sold' },
  { id: 'xero_acct_320', code: '320', name: 'AWS & Cloud Hosting Dedicated Infrastructure', category: 'IT & Infrastructure', type: 'Cost of Goods Sold' },
  { id: 'xero_acct_330', code: '330', name: 'Engineering & BIM Simulation Software Seats', category: 'Operating Expenses', type: 'Expense' },
  { id: 'xero_acct_340', code: '340', name: 'Hardware Testing & IoT Prototype Components', category: 'Materials', type: 'Cost of Goods Sold' },
  { id: 'xero_acct_350', code: '350', name: 'On-Site Deployment & Client Verification Travel', category: 'Travel', type: 'Expense' },
  { id: 'xero_acct_360', code: '360', name: 'Unbudgeted Safety Compliance & ISO Audit Claim', category: 'Legal & Professional', type: 'Other Expense' }
]

const XERO_GENERATED_TXNS: ExternalTransaction[] = [
  {
    id: 'XERO-INV-7001',
    accountId: 'xero_acct_310',
    accountName: 'Contract Engineering & Consulting Services (Xero GL)',
    amount: 11200.00,
    currency: 'USD',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    description: 'Xero Approved Invoice #7001: Backend API optimization & automated load testing',
    vendor: 'Apex DevOps LLC',
    projectTag: 'Basely Core'
  },
  {
    id: 'XERO-INV-7002',
    accountId: 'xero_acct_320',
    accountName: 'AWS & Cloud Hosting Dedicated Infrastructure',
    amount: 3850.25,
    currency: 'USD',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    description: 'Monthly Cloudflare Edge networks and AWS PostgreSQL reserved instances',
    vendor: 'Amazon Web Services',
    projectTag: 'Basely Core'
  },
  {
    id: 'XERO-CLM-7003',
    accountId: 'xero_acct_350',
    accountName: 'On-Site Deployment & Client Verification Travel',
    amount: 1420.00,
    currency: 'USD',
    date: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
    description: 'Field engineer transport and accommodations for client acceptance sign-off',
    vendor: 'Delta Enterprise Travel',
    projectTag: 'Basely Core'
  },
  {
    id: 'XERO-CLM-7004',
    accountId: 'xero_acct_360',
    accountName: 'Unbudgeted Safety Compliance & ISO Audit Claim',
    amount: 2900.00,
    currency: 'USD',
    date: new Date(Date.now() - 13 * 86400000).toISOString().split('T')[0],
    description: 'Mandatory third-party security auditing and SOC2 Stage 2 external verification',
    vendor: 'Ernst & Young Advisory',
    projectTag: 'Basely Core'
  }
]

export const XeroAdapter: ErpAdapter = {
  id: 'xero',
  name: 'Xero Accounting Suite',
  
  async authenticate(config: Record<string, unknown>): Promise<AuthStatus> {
    await new Promise(resolve => setTimeout(resolve, 550))
    
    const isLiveMode = Boolean(config?.liveMode)
    const tenantId = (config?.tenantId as string) || (config?.realmId as string) || 'xero-tenant-49812-au'
    const companyName = (config?.companyName as string) || 'Global Engineering Ltd. (Xero Suite)'

    if (isLiveMode && config?.token && (config?.tenantId || config?.realmId)) {
      try {
        const response = await fetch('https://api.xero.com/api.xro/2.0/Organisation', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Xero-Tenant-Id': (config.tenantId || config.realmId) as string,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          return {
            connected: false,
            accountId: tenantId,
            error: `Xero Live OAuth Authentication Failed: HTTP ${response.status} - ${response.statusText}`
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error communicating with api.xero.com'
        return {
          connected: false,
          accountId: tenantId,
          error: `Xero API endpoint unreachable: ${msg}. Switch to Test Simulation Option.`
        }
      }
    }

    return {
      connected: true,
      accountId: isLiveMode ? `${tenantId} [LIVE XERO API]` : `${tenantId} [SIMULATION]`,
      accountName: companyName,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
    }
  },

  async getChartOfAccounts(config: Record<string, unknown>): Promise<ExternalAccount[]> {
    await new Promise(resolve => setTimeout(resolve, 400))

    if (Boolean(config?.liveMode) && config?.token && (config?.tenantId || config?.realmId)) {
      try {
        const res = await fetch('https://api.xero.com/api.xro/2.0/Accounts?where=Status%3D%3D%22ACTIVE%22', {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Xero-Tenant-Id': (config.tenantId || config.realmId) as string,
            'Accept': 'application/json'
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.Accounts)) {
            return data.Accounts.map((acc: { AccountID: string; Code: string; Name: string; Class?: string }) => ({
              id: `xero_${acc.AccountID}`,
              code: acc.Code || acc.AccountID,
              name: acc.Name || 'Xero Account',
              category: 'Xero General Ledger',
              type: acc.Class || 'Expense'
            }))
          }
        }
      } catch {
        // Fall back to simulation mode on error
      }
    }

    return XERO_SAMPLE_ACCOUNTS
  },

  async fetchTransactions(
    config: Record<string, unknown>,
    options?: { startDate?: string; endDate?: string; backfill?: boolean }
  ): Promise<ExternalTransaction[]> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    if (Boolean(config?.liveMode) && config?.token && (config?.tenantId || config?.realmId)) {
      try {
        const res = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22', {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Xero-Tenant-Id': (config.tenantId || config.realmId) as string,
            'Accept': 'application/json'
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.Invoices)) {
            return data.Invoices.map((inv: { InvoiceID: string; InvoiceNumber?: string; Total?: number; Date?: string; Reference?: string; Contact?: { Name?: string } }) => ({
              id: `XERO-LIVE-${inv.InvoiceID}`,
              accountId: 'xero_acct_310',
              accountName: 'Xero Authorised Invoice',
              amount: Number(inv.Total || 0),
              currency: 'USD',
              date: inv.Date ? new Date(inv.Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              description: inv.Reference || `Live Xero Invoice #${inv.InvoiceNumber || inv.InvoiceID}`,
              vendor: inv.Contact?.Name || 'Xero Vendor',
              projectTag: 'Basely Core'
            }))
          }
        }
      } catch {
        // Fall back to demo simulation
      }
    }

    if (options?.startDate && !options.backfill) {
      return XERO_GENERATED_TXNS.filter(t => t.date >= (options.startDate as string))
    }
    return XERO_GENERATED_TXNS
  }
}
