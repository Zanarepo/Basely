'use server'

import * as core from './core-actions'
import * as ai from './ai-actions'

export async function getBacklogItems(projectId: string) {
  return core.getBacklogItems(projectId)
}

export async function upsertBacklogItem(payload: Parameters<typeof core.upsertBacklogItem>[0]) {
  return core.upsertBacklogItem(payload)
}

export async function deleteBacklogItem(id: string) {
  return core.deleteBacklogItem(id)
}

export async function convertBacklogItemToExecution(backlogItemId: string) {
  return ai.convertBacklogItemToExecution(backlogItemId)
}

export async function autoGenerateBacklogFromPersona(personaId: string, projectId: string, organizationId: string) {
  return ai.autoGenerateBacklogFromPersona(personaId, projectId, organizationId)
}
