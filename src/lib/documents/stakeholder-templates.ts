import type { DocumentSectionDef } from './types'

export interface StakeholderTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'standard' | 'enterprise' | 'agile'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const STAKEHOLDER_TEMPLATE_VARIANTS: Record<string, StakeholderTemplateVariant> = {
  default_stakeholder_register: {
    id: 'default_stakeholder_register',
    name: 'Default Stakeholder Roster',
    subtitle: 'A data-bound stakeholder roster and summary.',
    category: 'standard',
    bestFor: 'Projects that rely on the database-backed stakeholder roster.',
    iconName: 'Users',
    section_definitions: [
      { key: 'executive_summary', title: 'Stakeholder Summary', type: 'free_text', placeholder: 'High-level stakeholder management overview.' },
      { key: 'stakeholder_roster', title: 'Stakeholder Roster & Analysis', type: 'data_bound', source: 'register.stakeholders' }
    ]
  },
  standard_stakeholder_register: {
    id: 'standard_stakeholder_register',
    name: 'Standard Stakeholder Register',
    subtitle: 'Comprehensive 9-point stakeholder register covering analysis, communication, and risk.',
    category: 'enterprise',
    bestFor: 'Formal IT and business projects requiring structured stakeholder management.',
    iconName: 'FileText',
    section_definitions: [
      { key: 'purpose', title: '1. Purpose', type: 'free_text', placeholder: 'The purpose of this document...' },
      { key: 'stakeholder_register', title: '2. Stakeholder Register', type: 'data_bound', source: 'register.stakeholders' },
      { key: 'stakeholder_analysis', title: '3. Stakeholder Analysis', type: 'free_text', placeholder: 'Responsibilities, Expectations, Communication Frequency for each stakeholder' },
      { key: 'power_interest_matrix', title: '4. Power–Interest Matrix', type: 'free_text', placeholder: 'Manage Closely, Keep Involved, Keep Informed, Monitor' },
      { key: 'communication_requirements', title: '5. Stakeholder Communication Requirements', type: 'free_text', placeholder: 'Information Needed | Frequency | Method' },
      { key: 'engagement_strategy', title: '6. Stakeholder Engagement Strategy', type: 'free_text', placeholder: 'How to maintain effective stakeholder engagement' },
      { key: 'stakeholder_risks', title: '7. Stakeholder Risks', type: 'free_text', placeholder: 'Risk | Impact | Mitigation' },
      { key: 'register_maintenance', title: '8. Register Maintenance', type: 'free_text', placeholder: 'When the Stakeholder Register should be reviewed' },
      { key: 'document_approval', title: '9. Document Approval', type: 'free_text', placeholder: 'Role | Responsibility | Name' }
    ]
  }
}
