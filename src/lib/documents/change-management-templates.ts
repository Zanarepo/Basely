export interface ChangeManagementTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'standard' | 'enterprise' | 'agile'
  iconName: string
  section_definitions: Array<{
    key: string
    title: string
    type: 'free_text' | 'data_bound'
    source?: string
  }>
}

export const CHANGE_MANAGEMENT_TEMPLATE_VARIANTS: Record<string, ChangeManagementTemplateVariant> = {
  standard_change_management: {
    id: 'standard_change_management',
    name: 'Standard Change Management Plan',
    subtitle: 'Classic change control plan defining philosophy, workflows, and thresholds.',
    category: 'standard',
    iconName: 'FileText',
    section_definitions: [
      { key: 'change_philosophy', title: 'Change Control Philosophy & Escalation Process', type: 'free_text' },
      { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
    ]
  },
  itil_change_management: {
    id: 'itil_change_management',
    name: 'ITIL Change Management Plan',
    subtitle: 'Service management approach with CAB (Change Advisory Board) integration.',
    category: 'enterprise',
    iconName: 'Layers',
    section_definitions: [
      { key: 'change_philosophy', title: 'Change Control Philosophy & Escalation Process', type: 'free_text' },
      { key: 'cab_structure', title: 'CAB Structure & Authority', type: 'free_text' },
      { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
    ]
  },
  agile_change_management: {
    id: 'agile_change_management',
    name: 'Agile Change Management',
    subtitle: 'Lightweight change adaptation plan focusing on backlog grooming and sprint boundaries.',
    category: 'agile',
    iconName: 'Zap',
    section_definitions: [
      { key: 'change_philosophy', title: 'Agile Adaptation & Backlog Philosophy', type: 'free_text' },
      { key: 'sprint_boundaries', title: 'Sprint Boundary Rules & Emergency Changes', type: 'free_text' },
      { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
    ]
  },
  prosci_adkar_change: {
    id: 'prosci_adkar_change',
    name: 'Prosci ADKAR Change Plan',
    subtitle: 'Organizational change management focusing on people and adoption (Awareness, Desire, Knowledge, Ability, Reinforcement).',
    category: 'enterprise',
    iconName: 'Users',
    section_definitions: [
      { key: 'adkar_philosophy', title: 'ADKAR Methodology & Adoption Strategy', type: 'free_text' },
      { key: 'change_philosophy', title: 'Change Control Philosophy & Escalation Process', type: 'free_text' },
      { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
    ]
  },
  minimal_change_management: {
    id: 'minimal_change_management',
    name: 'Minimal Change Log',
    subtitle: 'Streamlined change management for small teams or internal projects.',
    category: 'standard',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'change_philosophy', title: 'Change Control Philosophy', type: 'free_text' },
      { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
    ]
  }
}
