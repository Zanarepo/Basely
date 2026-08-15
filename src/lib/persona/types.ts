export type UserPersona = 'product_manager' | 'project_manager' | 'agile_member'
export type EffectiveMode = 'product' | 'project'

export interface PersonaConfig {
  persona: UserPersona
  effectiveMode: EffectiveMode
  addButtonText: string
  rootNodeLabel: string
  treeTitleLabel: string
  showBudgetControls: boolean
}
