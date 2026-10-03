'use server'

import * as estimates from './estimates-actions'
import * as baseline from './baseline-actions'
import * as resource from './resource-actions'
import * as projectCost from './project-cost-actions'

export async function saveCostEstimate(...args: Parameters<typeof estimates.saveCostEstimate>) {
  return estimates.saveCostEstimate(...args)
}
export async function generateLinearTimePhasing(...args: Parameters<typeof estimates.generateLinearTimePhasing>) {
  return estimates.generateLinearTimePhasing(...args)
}
export async function reconcileBottomUpEstimate(...args: Parameters<typeof estimates.reconcileBottomUpEstimate>) {
  return estimates.reconcileBottomUpEstimate(...args)
}

export async function createBudgetBaseline(...args: Parameters<typeof baseline.createBudgetBaseline>) {
  return baseline.createBudgetBaseline(...args)
}
export async function getBaselineSnapshots(...args: Parameters<typeof baseline.getBaselineSnapshots>) {
  return baseline.getBaselineSnapshots(...args)
}
export async function updateBudgetBaseline(...args: Parameters<typeof baseline.updateBudgetBaseline>) {
  return baseline.updateBudgetBaseline(...args)
}
export async function deleteBudgetBaseline(...args: Parameters<typeof baseline.deleteBudgetBaseline>) {
  return baseline.deleteBudgetBaseline(...args)
}

export async function createResourceRate(...args: Parameters<typeof resource.createResourceRate>) {
  return resource.createResourceRate(...args)
}
export async function updateResourceRate(...args: Parameters<typeof resource.updateResourceRate>) {
  return resource.updateResourceRate(...args)
}
export async function deleteResourceRate(...args: Parameters<typeof resource.deleteResourceRate>) {
  return resource.deleteResourceRate(...args)
}
export async function bulkImportResourceRates(...args: Parameters<typeof resource.bulkImportResourceRates>) {
  return resource.bulkImportResourceRates(...args)
}
export async function bulkDeleteResourceRates(...args: Parameters<typeof resource.bulkDeleteResourceRates>) {
  return resource.bulkDeleteResourceRates(...args)
}
export async function assignResourceToActivity(...args: Parameters<typeof resource.assignResourceToActivity>) {
  return resource.assignResourceToActivity(...args)
}
export async function deleteResourceAssignment(...args: Parameters<typeof resource.deleteResourceAssignment>) {
  return resource.deleteResourceAssignment(...args)
}

export async function updateProjectContingency(...args: Parameters<typeof projectCost.updateProjectContingency>) {
  return projectCost.updateProjectContingency(...args)
}
export async function updateGlobalOverhead(...args: Parameters<typeof projectCost.updateGlobalOverhead>) {
  return projectCost.updateGlobalOverhead(...args)
}
