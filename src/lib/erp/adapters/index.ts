import { ErpAdapter } from './types'
import { QuickBooksAdapter } from './quickbooks'
import { NetSuiteAdapter } from './netsuite'
import { SapAdapter } from './sap'
import { XeroAdapter } from './xero'

export * from './types'
export { QuickBooksAdapter, NetSuiteAdapter, SapAdapter, XeroAdapter }

export function getErpAdapter(connectorType: string): ErpAdapter {
  switch (connectorType.toLowerCase()) {
    case 'netsuite':
      return NetSuiteAdapter
    case 'sap':
      return SapAdapter
    case 'xero':
      return XeroAdapter
    case 'quickbooks':
    default:
      return QuickBooksAdapter
  }
}
