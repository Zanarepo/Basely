import type { UserPersona, PersonaConfig } from './types'

export const PERSONA_STORAGE_KEY = 'zanarepo_user_persona'
export const PERSONA_CHANGE_EVENT = 'zanarepo_persona_changed'

export const PERSONA_CONFIGS: Record<UserPersona, PersonaConfig> = {
  product_manager: {
    persona: 'product_manager',
    effectiveMode: 'product',
    addButtonText: 'Add Epic',
    rootNodeLabel: 'Epic Group',
    treeTitleLabel: 'Product Structure Tree',
    showBudgetControls: false,
  },
  agile_member: {
    persona: 'agile_member',
    effectiveMode: 'product',
    addButtonText: 'Add Epic',
    rootNodeLabel: 'Epic Group',
    treeTitleLabel: 'Product Structure Tree',
    showBudgetControls: false,
  },
  project_manager: {
    persona: 'project_manager',
    effectiveMode: 'project',
    addButtonText: 'Add Phase',
    rootNodeLabel: 'Phase Group',
    treeTitleLabel: 'Work Breakdown Tree',
    showBudgetControls: true,
  },
}
