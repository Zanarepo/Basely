export interface ReassignmentOption {
  wbsElementId: string
  wbsElementName: string
  currentStakeholderId: string
  currentStakeholderName: string
  suggestedStakeholderId: string
  suggestedStakeholderName: string
  requiredSkill: string
  storyPoints: number
  justification: string
}

export interface RebalanceSuggestionResult {
  hasOverloadedMembers: boolean
  message: string
  suggestions: ReassignmentOption[]
}
