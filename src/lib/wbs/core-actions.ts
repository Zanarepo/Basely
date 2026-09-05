'use server'

export type { ActionResponse, CreateWbsResult } from './core/types'

import * as fetchActions from './core/fetch-actions'
import * as createActions from './core/create-actions'
import * as updateActions from './core/update-actions'
import * as deleteActions from './core/delete-actions'
import * as moveActions from './core/move-actions'

export async function getWbsElements(...args: Parameters<typeof fetchActions.getWbsElements>) {
  return fetchActions.getWbsElements(...args)
}

export async function createWbsElement(...args: Parameters<typeof createActions.createWbsElement>) {
  return createActions.createWbsElement(...args)
}

export async function bulkImportWbsElements(...args: Parameters<typeof createActions.bulkImportWbsElements>) {
  return createActions.bulkImportWbsElements(...args)
}

export async function updateWbsElement(...args: Parameters<typeof updateActions.updateWbsElement>) {
  return updateActions.updateWbsElement(...args)
}

export async function deleteWbsElement(...args: Parameters<typeof deleteActions.deleteWbsElement>) {
  return deleteActions.deleteWbsElement(...args)
}

export async function bulkDeleteWbsElements(...args: Parameters<typeof deleteActions.bulkDeleteWbsElements>) {
  return deleteActions.bulkDeleteWbsElements(...args)
}

export async function moveWbsElement(...args: Parameters<typeof moveActions.moveWbsElement>) {
  return moveActions.moveWbsElement(...args)
}

export async function updateWbsSortOrders(...args: Parameters<typeof moveActions.updateWbsSortOrders>) {
  return moveActions.updateWbsSortOrders(...args)
}
